// Package march7thhoneyService is the Wails-exposed surface for the
// March7thHoney launch mode. It thinly wraps pkg/march7thhoney so the React
// frontend can trigger a patched game launch (CreateProcess(SUSPENDED) +
// CreateRemoteThread(LoadLibraryW) + ResumeThread).
package march7thhoneyService

import (
	"firefly-launcher/pkg/march7thhoney"
	"firefly-launcher/pkg/models"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/application"
	"golang.org/x/sys/windows"
)

type March7thHoneyService struct{}

// DetectRegion inspects gameDir/BinaryVersion.bytes to figure out whether the
// installed StarRail client is the OS (global / HoYoPlay) build or the CN
// (国服 / miHoYo Launcher) build. Returns one of "os", "cn", or "" when the
// region can't be determined — in that case the frontend should prompt the
// user to pick a region manually.
//
// Region detection is conservative: we only return "os"/"cn" when the
// BinaryVersion name contains the matching marker. Anything else (file
// missing, parse error, unrecognised name) returns "".
func (m *March7thHoneyService) DetectRegion(gameDir string) string {
	if gameDir == "" {
		return ""
	}
	bv, err := models.ParseBinaryVersion(filepath.Join(gameDir, "BinaryVersion.bytes"))
	if err != nil {
		return ""
	}
	name := strings.ToUpper(bv.Name)
	if strings.Contains(name, "CN") {
		return "cn"
	}
	if strings.Contains(name, "OS") {
		return "os"
	}
	return ""
}

// Start launches gamePath suspended, injects dllPath, and resumes the main
// thread. Returns (ok, errMessage). Emits "game:exit" via the Wails event bus
// when the patched game process terminates, matching the convention used by
// FSService.StartApp.
func (m *March7thHoneyService) Start(gamePath, dllPath string) (bool, string) {
	hProcess, _, err := march7thhoney.LaunchAndInject(gamePath, dllPath)
	if err != nil {
		return false, err.Error()
	}

	go func() {
		windows.WaitForSingleObject(hProcess, windows.INFINITE)
		windows.CloseHandle(hProcess)
		application.Get().Event.Emit("game:exit")
	}()

	return true, ""
}
