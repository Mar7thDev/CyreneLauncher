package fsService

import (
	"cyrene-launcher/pkg/constant"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"golang.org/x/sys/windows"
)

const (
	genshinDefaultDllPath      = "native/bin/ysrpg.dll"
	genshinDefaultInjectorPath = "native/bin/YsrpgInjector.exe"
	genshinDispatchProcessName = "YsrpgDispatchTlsListener.exe"
	genshinGateProcessName     = "genshin-gate-listener.exe"
	genshinPathConfigFile      = "YuanShen.path.txt"
	genshinYuanShenProcessName = "YuanShen.exe"
)

type genshinProcessSpec struct {
	Args             []string          `json:"args"`
	Environment      map[string]string `json:"environment"`
	File             string            `json:"file"`
	WorkingDirectory string            `json:"working_directory"`
}

type genshinPathSpec struct {
	Dll            string `json:"dll"`
	GamePathConfig string `json:"game_path_config"`
	Injector       string `json:"injector"`
}

type genshinManifest struct {
	Paths     genshinPathSpec `json:"paths"`
	Processes struct {
		Dispatch genshinProcessSpec `json:"dispatch"`
		Gate     genshinProcessSpec `json:"gate"`
		Game     genshinProcessSpec `json:"game"`
	} `json:"processes"`
}

type managedGenshinServer struct {
	mu          sync.Mutex
	token       uint64
	running     bool
	dispatchCmd *exec.Cmd
	gateCmd     *exec.Cmd
}

var genshinServerManager managedGenshinServer

func (f *FSService) StartGenshinServer() (bool, string) {
	if genshinServerManager.isRunning() {
		return true, ""
	}

	bundleRoot, manifest, err := loadGenshinManifest()
	if err != nil {
		return false, err.Error()
	}
	if err := clearGenshinLogs(bundleRoot); err != nil {
		return false, fmt.Sprintf("failed to clear Genshin logs: %v", err)
	}

	dispatchCmd, err := startHiddenGenshinProcess(bundleRoot, manifest.Processes.Dispatch)
	if err != nil {
		return false, fmt.Sprintf("failed to start dispatch: %v", err)
	}

	gateCmd, err := startHiddenGenshinProcess(bundleRoot, manifest.Processes.Gate)
	if err != nil {
		_ = killProcess(dispatchCmd)
		_ = dispatchCmd.Wait()
		return false, fmt.Sprintf("failed to start gate: %v", err)
	}

	token := genshinServerManager.markRunning(dispatchCmd, gateCmd)
	go watchGenshinProcess(dispatchCmd, token)
	go watchGenshinProcess(gateCmd, token)
	return true, ""
}

func (f *FSService) IsGenshinServerRunning() bool {
	return isProcessRunning(genshinDispatchProcessName) || isProcessRunning(genshinGateProcessName)
}

func (f *FSService) StartGenshinGame(yuanShenPath string) (bool, string) {
	yuanShenPath = strings.TrimSpace(yuanShenPath)
	if yuanShenPath == "" {
		return false, "YuanShen.exe path is empty"
	}

	absYuanShenPath, err := filepath.Abs(yuanShenPath)
	if err != nil {
		return false, err.Error()
	}
	if !strings.EqualFold(filepath.Base(absYuanShenPath), genshinYuanShenProcessName) {
		return false, "selected game path must end with YuanShen.exe"
	}
	if info, err := os.Stat(absYuanShenPath); err != nil {
		return false, "YuanShen.exe was not found: " + absYuanShenPath
	} else if info.IsDir() {
		return false, "YuanShen.exe path points to a directory: " + absYuanShenPath
	}
	if isProcessRunning(genshinYuanShenProcessName) {
		return false, "YuanShen.exe is already running"
	}

	bundleRoot, manifest, err := loadGenshinManifest()
	if err != nil {
		return false, err.Error()
	}

	gameSpec := manifest.Processes.Game
	if gameSpec.File == "" {
		gameSpec.File = firstNonEmpty(manifest.Paths.Injector, genshinDefaultInjectorPath)
		gameSpec.WorkingDirectory = filepath.ToSlash(filepath.Dir(gameSpec.File))
	}
	injectorPath := resolveGenshinBundlePath(bundleRoot, gameSpec.File)
	if info, err := os.Stat(injectorPath); err != nil {
		return false, "Genshin injector was not found: " + injectorPath
	} else if info.IsDir() {
		return false, "Genshin injector path points to a directory: " + injectorPath
	}

	dllPath := resolveGenshinBundlePath(bundleRoot, firstNonEmpty(manifest.Paths.Dll, genshinDefaultDllPath))
	if info, err := os.Stat(dllPath); err != nil {
		return false, "ysrpg.dll was not found: " + dllPath
	} else if info.IsDir() {
		return false, "ysrpg.dll path points to a directory: " + dllPath
	}

	configPath := filepath.Join(filepath.Dir(injectorPath), genshinPathConfigFile)
	if manifest.Paths.GamePathConfig != "" {
		configPath = resolveGenshinBundlePath(bundleRoot, manifest.Paths.GamePathConfig)
	}
	if err := os.MkdirAll(filepath.Dir(configPath), 0755); err != nil {
		return false, "failed to create injector config directory: " + err.Error()
	}
	if err := os.WriteFile(configPath, []byte(absYuanShenPath+"\r\n"), 0644); err != nil {
		return false, "failed to write injector game path: " + err.Error()
	}

	cmd, err := startHiddenGenshinProcess(bundleRoot, gameSpec)
	if err != nil {
		return false, fmt.Sprintf("failed to start injector: %v", err)
	}

	go func() { _ = cmd.Wait() }()
	go watchGenshinGameProcess()
	return true, ""
}

func (f *FSService) StopGenshinServer() (bool, string) {
	dispatchCmd, gateCmd, token, running := genshinServerManager.snapshot()
	if !running {
		if err := killGenshinServerProcessesByName(); err != nil {
			return false, err.Error()
		}
		application.Get().Event.Emit("server:exit")
		return true, ""
	}

	var errs []string
	if err := killProcess(gateCmd); err != nil {
		errs = append(errs, "gate: "+err.Error())
	}
	if err := killProcess(dispatchCmd); err != nil {
		errs = append(errs, "dispatch: "+err.Error())
	}
	if len(errs) > 0 {
		return false, strings.Join(errs, "; ")
	}

	if genshinServerManager.clearIfCurrent(token) {
		application.Get().Event.Emit("server:exit")
	}
	return true, ""
}

func loadGenshinManifest() (string, genshinManifest, error) {
	var manifest genshinManifest
	bundleRoot, err := filepath.Abs(constant.GenshinServerBundleDir)
	if err != nil {
		return "", manifest, err
	}

	manifestPath := filepath.Join(bundleRoot, "cyrene-manifest.json")
	body, err := os.ReadFile(manifestPath)
	if err != nil {
		return "", manifest, fmt.Errorf("Genshin server package manifest not found: %s", manifestPath)
	}
	if err := json.Unmarshal(body, &manifest); err != nil {
		return "", manifest, fmt.Errorf("failed to parse Genshin server manifest: %w", err)
	}
	if manifest.Processes.Dispatch.File == "" {
		return "", manifest, errors.New("Genshin server manifest is missing dispatch process file")
	}
	if manifest.Processes.Gate.File == "" {
		return "", manifest, errors.New("Genshin server manifest is missing gate process file")
	}
	return bundleRoot, manifest, nil
}

func startHiddenGenshinProcess(bundleRoot string, spec genshinProcessSpec) (*exec.Cmd, error) {
	exePath := resolveGenshinBundlePath(bundleRoot, spec.File)
	if _, err := os.Stat(exePath); err != nil {
		return nil, fmt.Errorf("%s was not found", exePath)
	}

	logEnvironment := defaultGenshinLogEnvironment(bundleRoot)
	if err := os.MkdirAll(filepath.Join(bundleRoot, "data"), 0755); err != nil {
		return nil, fmt.Errorf("failed to create Genshin log directory: %w", err)
	}

	cmd := exec.Command(exePath, spec.Args...)
	cmd.Dir = resolveGenshinWorkingDirectory(bundleRoot, spec.WorkingDirectory)
	cmd.Env = mergeEnvironment(os.Environ(), mergeEnvironmentMaps(logEnvironment, spec.Environment))
	cmd.Stdin = nil
	cmd.Stdout = nil
	cmd.Stderr = nil
	cmd.SysProcAttr = &windows.SysProcAttr{
		HideWindow:       true,
		CreationFlags:    windows.CREATE_NO_WINDOW | windows.CREATE_BREAKAWAY_FROM_JOB,
		NoInheritHandles: true,
	}

	if err := cmd.Start(); err != nil {
		return nil, err
	}
	return cmd, nil
}

func defaultGenshinLogEnvironment(bundleRoot string) map[string]string {
	dataDir := filepath.Join(bundleRoot, "data")
	return map[string]string{
		"GENSHIN_ENABLE_LOGS":  "1",
		"GENSHIN_ENCRYPT_LOGS": "1",
		"GENSHIN_GATE_LOG":     filepath.Join(dataDir, "gate_listener.log"),
		"YSRPG_ENABLE_LOGS":    "1",
		"YSRPG_ENCRYPT_LOGS":   "1",
		"YSRPG_LOG":            filepath.Join(dataDir, "ysrpg.log"),
	}
}

func clearGenshinLogs(bundleRoot string) error {
	dataDir := filepath.Join(bundleRoot, "data")
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return err
	}

	entries, err := os.ReadDir(dataDir)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := strings.ToLower(entry.Name())
		if !strings.HasSuffix(name, ".log") && !strings.Contains(name, ".log.") {
			continue
		}
		if err := os.Remove(filepath.Join(dataDir, entry.Name())); err != nil && !errors.Is(err, os.ErrNotExist) {
			return err
		}
	}
	return nil
}

func mergeEnvironmentMaps(base map[string]string, overrides map[string]string) map[string]string {
	if len(base) == 0 {
		return overrides
	}

	merged := make(map[string]string, len(base)+len(overrides))
	for key, value := range base {
		merged[key] = value
	}
	for key, value := range overrides {
		merged[key] = value
	}
	return merged
}

func resolveGenshinWorkingDirectory(bundleRoot string, workingDirectory string) string {
	if workingDirectory == "" || workingDirectory == "." {
		return bundleRoot
	}
	return resolveGenshinBundlePath(bundleRoot, workingDirectory)
}

func resolveGenshinBundlePath(bundleRoot string, path string) string {
	if filepath.IsAbs(path) {
		return filepath.Clean(path)
	}
	return filepath.Join(bundleRoot, filepath.FromSlash(path))
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

func mergeEnvironment(base []string, overrides map[string]string) []string {
	if len(overrides) == 0 {
		return base
	}

	values := make(map[string]string, len(base)+len(overrides))
	order := make([]string, 0, len(base)+len(overrides))
	for _, entry := range base {
		key, value, ok := strings.Cut(entry, "=")
		if !ok {
			continue
		}
		if _, exists := values[key]; !exists {
			order = append(order, key)
		}
		values[key] = value
	}
	for key, value := range overrides {
		if _, exists := values[key]; !exists {
			order = append(order, key)
		}
		values[key] = value
	}

	merged := make([]string, 0, len(values))
	for _, key := range order {
		merged = append(merged, key+"="+values[key])
	}
	return merged
}

func killProcess(cmd *exec.Cmd) error {
	if cmd == nil || cmd.Process == nil {
		return nil
	}
	if err := cmd.Process.Kill(); err != nil && !errors.Is(err, os.ErrProcessDone) {
		return err
	}
	return nil
}

func killGenshinServerProcessesByName() error {
	var errs []string
	for _, imageName := range []string{genshinGateProcessName, genshinDispatchProcessName} {
		if err := killProcessByImageName(imageName); err != nil {
			errs = append(errs, imageName+": "+err.Error())
		}
	}
	if len(errs) > 0 {
		return errors.New(strings.Join(errs, "; "))
	}
	return nil
}

func killProcessByImageName(imageName string) error {
	if !isProcessRunning(imageName) {
		return nil
	}
	cmd := exec.Command("taskkill", "/F", "/T", "/IM", imageName)
	cmd.SysProcAttr = &windows.SysProcAttr{
		HideWindow:       true,
		CreationFlags:    windows.CREATE_NO_WINDOW,
		NoInheritHandles: true,
	}
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("%w: %s", err, strings.TrimSpace(string(output)))
	}
	return nil
}

func watchGenshinProcess(cmd *exec.Cmd, token uint64) {
	if cmd == nil {
		return
	}
	_ = cmd.Wait()
	if genshinServerManager.clearIfCurrent(token) {
		application.Get().Event.Emit("server:exit")
	}
}

func watchGenshinGameProcess() {
	deadline := time.Now().Add(30 * time.Second)
	for time.Now().Before(deadline) {
		if isProcessRunning(genshinYuanShenProcessName) {
			for isProcessRunning(genshinYuanShenProcessName) {
				time.Sleep(2 * time.Second)
			}
			application.Get().Event.Emit("game:exit")
			return
		}
		time.Sleep(500 * time.Millisecond)
	}
	application.Get().Event.Emit("game:exit")
}

func isProcessRunning(imageName string) bool {
	cmd := exec.Command("tasklist", "/FI", "IMAGENAME eq "+imageName, "/NH")
	cmd.SysProcAttr = &windows.SysProcAttr{
		HideWindow:       true,
		CreationFlags:    windows.CREATE_NO_WINDOW,
		NoInheritHandles: true,
	}
	output, err := cmd.Output()
	if err != nil {
		return false
	}
	return strings.Contains(strings.ToLower(string(output)), strings.ToLower(imageName))
}

func (m *managedGenshinServer) isRunning() bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.running
}

func (m *managedGenshinServer) markRunning(dispatchCmd *exec.Cmd, gateCmd *exec.Cmd) uint64 {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.token++
	m.running = true
	m.dispatchCmd = dispatchCmd
	m.gateCmd = gateCmd
	return m.token
}

func (m *managedGenshinServer) snapshot() (*exec.Cmd, *exec.Cmd, uint64, bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.dispatchCmd, m.gateCmd, m.token, m.running
}

func (m *managedGenshinServer) clearIfCurrent(token uint64) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	if !m.running || m.token != token {
		return false
	}
	m.running = false
	m.dispatchCmd = nil
	m.gateCmd = nil
	return true
}
