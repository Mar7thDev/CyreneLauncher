//go:build windows

// Package march7thhoneyService is the Wails-exposed service for the
// March7thHoney launch mode.
//
// Flow:
//  1. A local HTTPS MITM proxy is started on a random loopback port. It
//     intercepts miHoYo-domain traffic and forwards it to the configured
//     private server.
//  2. The proxy root CA is installed in the Windows trusted root store so
//     the game accepts the MITM TLS certificates.
//  3. The game is launched suspended via CreateProcessW. CyreneHook.dll
//     (in-process hook DLL — RSA key replacement, WebView URL redirect,
//     and WinHTTP/WinINet proxy redirect) is injected via LoadLibraryW.
//     The local proxy port is passed in via the CYRENE_PROXY environment
//     variable, which the DLL also mirrors into HTTP_PROXY / HTTPS_PROXY
//     so libcurl-based code paths route through the same MITM proxy.
//  4. The main thread is resumed and we wait on the raw process handle —
//     when the game exits, the proxy is stopped and "game:exit" is emitted.
package march7thhoneyService

import (
	accountService "cyrene-launcher/internal/account-service"
	"cyrene-launcher/pkg/constant"
	"cyrene-launcher/pkg/injector"
	patchproxy "cyrene-launcher/pkg/patch-proxy"
	"errors"
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"golang.org/x/sys/windows"
)

const (
	dllStoragePath  = "./patch/CyreneHook.dll"
	ec2bStoragePath = "./patch/ClientSecretKey.bin"
	envProxyKey     = "CYRENE_PROXY"
	envEc2bKey      = "CYRENE_EC2B_FILE"
	envWebTargetKey = "CYRENE_WEB_TARGET"
)

// March7thHoneyService is constructed via New so the embedded CyreneHook.dll
// bytes can be supplied from main.
type March7thHoneyService struct {
	dllBytes []byte
	acct     *accountService.AccountService
}

// New returns a service that will extract the given DLL bytes to
// ./patch/CyreneHook.dll on first launch. dllBytes may be empty — in that
// case the service refuses to launch (and reports a clear error to the UI).
// acct supplies the login token/device id handed to a local server.
func New(dllBytes []byte, acct *accountService.AccountService) *March7thHoneyService {
	return &March7thHoneyService{dllBytes: dllBytes, acct: acct}
}

// Start launches gamePath with the local proxy + CyreneHook injection.
//
// targetURL is the private-server base URL (e.g. "https://march7th.hoyotoon.com").
// An empty string uses constant.DefaultPatchTargetURL.
//
// preferredPort is the loopback port the proxy tries to bind. 0 (or an
// unavailable port) falls back to a random free port.
//
// Returns (true, "") on success, (false, errMsg) on failure.
func (m *March7thHoneyService) Start(gamePath, targetURL string, preferredPort int, opts patchproxy.PatchOptions) (bool, string) {
	if targetURL == "" {
		targetURL = constant.DefaultPatchTargetURL
	}

	dllPath, err := m.ensureDLL()
	if err != nil {
		return false, err.Error()
	}

	proxy, err := patchproxy.New(targetURL, opts)
	if err != nil {
		return false, "proxy init: " + err.Error()
	}

	// Hand-off path for the Ec2b key: the proxy captures it from query_gateway
	// and the injected DLL's game relay reads it back (the DLL can't see the
	// MITM'd HTTP). Absolute + env-passed so it is independent of the game dir.
	ec2bPath, err := filepath.Abs(ec2bStoragePath)
	if err != nil {
		return false, "resolve ec2b path: " + err.Error()
	}
	_ = os.Remove(ec2bPath) // drop any stale key from a previous run
	proxy.SetEc2bFile(ec2bPath)

	// Best-effort: install the CA cert. Non-fatal — the cert may already be
	// trusted from a previous session, or certutil might not be on PATH.
	_ = proxy.CA().InstallTrust()

	port, err := proxy.Start(preferredPort)
	if err != nil {
		return false, "proxy start: " + err.Error()
	}

	env := map[string]string{
		envProxyKey:     fmt.Sprintf("127.0.0.1:%d", port),
		envEc2bKey:      ec2bPath,
		// In-game register/webview redirect target: the patch rewrites the SDK
		// webview URL to this base so the page loads from the configured server
		// during remote play (instead of the build-time local default).
		envWebTargetKey: targetURL,
	}

	proc, err := injector.Launch(gamePath, dllPath, env)
	if err != nil {
		proxy.Stop()
		return false, "launch game: " + err.Error()
	}

	go func() {
		proc.Wait()
		proc.Close()
		proxy.Stop()
		application.Get().Event.Emit("game:exit")
	}()

	return true, ""
}

// ensureDLL writes the embedded DLL bytes to disk if missing, then returns
// the absolute path. Returns an error if no DLL bytes were embedded.
func (m *March7thHoneyService) ensureDLL() (string, error) {
	if len(m.dllBytes) == 0 {
		return "", errors.New("CyreneHook.dll is missing from this build — place a compiled DLL at assets/CyreneHook.dll and rebuild")
	}

	abs, err := filepath.Abs(dllStoragePath)
	if err != nil {
		return "", fmt.Errorf("resolve dll path: %w", err)
	}
	if err := os.MkdirAll(filepath.Dir(abs), 0755); err != nil {
		return "", fmt.Errorf("mkdir patch dir: %w", err)
	}

	if info, err := os.Stat(abs); err == nil && info.Size() == int64(len(m.dllBytes)) {
		return abs, nil
	}
	if err := os.WriteFile(abs, m.dllBytes, 0644); err != nil {
		return "", fmt.Errorf("write dll: %w", err)
	}
	return abs, nil
}

// StartLocalServer launches the bundled public server in its own console via `cmd /c start` (token/device id via env, no browser), probing the dispatch port for readiness; the user stops it by closing the window.
func (m *March7thHoneyService) StartLocalServer() (bool, string) {
	if portOpen(constant.LocalServerProbeAddr) {
		return true, "" // already running
	}

	token := ""
	if m.acct != nil {
		token = m.acct.ServerToken()
	}
	if token == "" {
		return false, "not_logged_in"
	}

	exePath, err := filepath.Abs(constant.LocalServerExe)
	if err != nil {
		return false, "resolve server path: " + err.Error()
	}
	if info, statErr := os.Stat(exePath); statErr != nil {
		return false, "server_not_found"
	} else if info.IsDir() {
		return false, "server path is a directory: " + exePath
	}

	// Empty "" is the window title (else `start` misreads the exe as title); the hidden cmd exits at once while `start` opens honey's own console.
	cmd := exec.Command("cmd", "/c", "start", "", exePath)
	cmd.Dir = filepath.Dir(exePath)
	envv := append(os.Environ(),
		"M7H_ACTIVATION_TOKEN="+token,
		"M7H_LAUNCHER_MODE=1",
	)
	if id := m.acct.DeviceID(); id != "" {
		envv = append(envv, "M7H_DEVICE_ID="+id)
	}
	cmd.Env = envv
	cmd.SysProcAttr = &windows.SysProcAttr{HideWindow: true, CreationFlags: windows.CREATE_NO_WINDOW}

	if err := cmd.Run(); err != nil {
		return false, "start server: " + err.Error()
	}

	if !waitPort(constant.LocalServerProbeAddr, 40*time.Second) {
		return false, "server_not_ready"
	}
	return true, ""
}

// IsLocalServerRunning reports whether a local March7thHoney server is up.
func (m *March7thHoneyService) IsLocalServerRunning() bool {
	return portOpen(constant.LocalServerProbeAddr)
}

// portOpen reports whether something is accepting TCP connections on addr.
func portOpen(addr string) bool {
	conn, err := net.DialTimeout("tcp", addr, time.Second)
	if err != nil {
		return false
	}
	conn.Close()
	return true
}

// waitPort polls addr until it accepts a connection or the timeout elapses.
func waitPort(addr string, timeout time.Duration) bool {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if portOpen(addr) {
			return true
		}
		time.Sleep(500 * time.Millisecond)
	}
	return false
}
