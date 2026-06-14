package fsService

import (
	"cyrene-launcher/pkg/sevenzip"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/application"
	"golang.org/x/sys/windows"
)

type FSService struct{}

func (f *FSService) PickFolder() (string, error) {
	dialog := application.Get().Dialog.OpenFile().
		CanChooseDirectories(true).
		CanCreateDirectories(true).
		ResolvesAliases(true)
	if runtime.GOOS == "darwin" {
		dialog.SetMessage("Select a file/directory")
	} else {
		dialog.SetTitle("Select a file/directory")
	}
	if path, err := dialog.PromptForSingleSelection(); err == nil {
		return path, nil
	}
	return "", nil
}

func (f *FSService) PickFile(filter string) (string, error) {
	dialog := application.Get().Dialog.OpenFile().
		CanChooseFiles(true).
		ResolvesAliases(true)
	if runtime.GOOS == "darwin" {
		dialog.SetMessage("Select a file/directory")
	} else {
		dialog.SetTitle("Select a file/directory")
	}
	if filter == "exe" {
		dialog.AddFilter("Executable Files (*.exe)", "*.exe")
	}
	if path, err := dialog.PromptForSingleSelection(); err == nil {
		return path, nil
	}
	return "", nil
}

func (f *FSService) DirExists(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return info.IsDir()
}

func (f *FSService) FileExists(path string) bool {
	if info, err := os.Stat(path); err == nil {
		return info.Mode().IsRegular()
	}
	return false
}

func (f *FSService) GetGameVersion(gamePath string) string {
	gamePath = strings.TrimSpace(gamePath)
	if gamePath == "" {
		return ""
	}

	gameDir := filepath.Dir(gamePath)
	gameName := strings.TrimSuffix(filepath.Base(gamePath), filepath.Ext(gamePath))
	streamingAssets := filepath.Join(gameDir, gameName+"_Data", "StreamingAssets")

	if raw, err := os.ReadFile(filepath.Join(streamingAssets, "asb_settings.json")); err == nil {
		var settings struct {
			Variance string `json:"variance"`
		}
		if json.Unmarshal(raw, &settings) == nil {
			if version := normalizeGameVersion(settings.Variance); version != "" {
				return version
			}
		}
	}

	if raw, err := os.ReadFile(filepath.Join(streamingAssets, "BinaryVersion.bytes")); err == nil {
		return normalizeGameVersion(string(raw))
	}

	return ""
}

func normalizeGameVersion(raw string) string {
	raw = strings.TrimSpace(strings.ReplaceAll(raw, "\x00", ""))
	if raw == "" {
		return ""
	}

	versionMatch := regexp.MustCompile(`(?i)v?(\d+)\.(\d+)(?:[._](\d+))?`).FindStringSubmatch(raw)
	if versionMatch == nil {
		return ""
	}

	major, errMajor := strconv.Atoi(versionMatch[1])
	minor, errMinor := strconv.Atoi(versionMatch[2])
	if errMajor != nil || errMinor != nil {
		return ""
	}

	release := 0
	hasRelease := versionMatch[3] != ""
	if hasRelease {
		if parsed, err := strconv.Atoi(versionMatch[3]); err == nil {
			release = parsed
		} else {
			hasRelease = false
		}
	}

	if hasRelease && release != 0 {
		return "V" + strconv.Itoa(major) + "." + strconv.Itoa(minor) + "." + strconv.Itoa(release)
	}
	return "V" + strconv.Itoa(major) + "." + strconv.Itoa(minor)
}

func (f *FSService) GetDir(path string) string {
	return filepath.Dir(path)
}

func (f *FSService) Join(paths ...string) string {
	return filepath.Join(paths...)
}

func (f *FSService) RemoveFile(path string) error {
	return os.Remove(path)
}

func (f *FSService) StartApp(path string) (bool, string) {
	dir := filepath.Dir(path)
	cmd := exec.Command(path)
	cmd.Dir = dir

	err := cmd.Start()
	if err != nil {
		// If the target binary's manifest requires elevation, our non-elevated
		// CreateProcess call fails with ERROR_ELEVATION_REQUIRED (740). Retry
		// via ShellExecuteEx + "runas" verb so Windows shows the UAC consent
		// prompt and starts the process elevated.
		if isElevationRequired(err) {
			handle, eErr := runElevated(path)
			if eErr != nil {
				return false, "elevation failed: " + eErr.Error()
			}
			go func() {
				_, _ = windows.WaitForSingleObject(handle, windows.INFINITE)
				windows.CloseHandle(handle)
				if strings.HasSuffix(path, "StarRail.exe") {
					application.Get().Event.Emit("game:exit")
				}
			}()
			return true, ""
		}
		return false, err.Error()
	}

	if isGameProcess(path) {
		go func() {
			_ = cmd.Wait()
			application.Get().Event.Emit("game:exit")
		}()
	}

	return true, ""
}

func isGameProcess(path string) bool {
	return strings.HasSuffix(path, "StarRail.exe") || strings.HasSuffix(path, "YuanShen.exe")
}

func (f *FSService) OpenFolder(path string) (bool, string) {
	absPath, err := filepath.Abs(path)
	if err != nil {
		return false, "failed to resolve absolute path: " + err.Error()
	}

	if !f.DirExists(absPath) {
		return false, "directory not found: " + absPath
	}

	url := "file:///" + filepath.ToSlash(absPath)
	application.Get().Browser.OpenURL(url)

	return true, ""
}

func (f *FSService) FileExistsInZip(archivePath, fileInside string) (bool, string) {
	exists, err := sevenzip.IsFileIn7z(archivePath, fileInside)
	if err != nil {
		return false, err.Error()
	}
	return exists, ""
}
