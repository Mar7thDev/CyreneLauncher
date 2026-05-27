//go:build windows

// Package march7thhoneyService is the Wails-exposed service for the
// March7thHoney launch mode.
//
// The old approach (CreateProcess SUSPENDED + LoadLibraryW DLL injection) has
// been replaced by a Go-native HTTPS MITM proxy:
//
//  1. A local proxy is started on a random loopback port. It intercepts HTTPS
//     traffic to miHoYo domains and forwards it to the configured private server.
//  2. The proxy root CA is installed in the Windows trusted root store so the
//     game accepts our MITM TLS certificates.
//  3. The Windows system HTTP/HTTPS proxy is pointed at the local listener.
//  4. StarRail.exe is launched normally — no suspension or DLL needed.
//  5. When the game process exits, the system proxy is restored and "game:exit"
//     is emitted on the Wails event bus.
package march7thhoneyService

import (
	"cyrene-launcher/pkg/constant"
	patchproxy "cyrene-launcher/pkg/patch-proxy"
	"fmt"
	"os/exec"
	"path/filepath"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type March7thHoneyService struct{}

// Start patches the system proxy, launches gamePath, and returns immediately.
//
// targetURL is the private-server base URL (e.g. "https://march7th.hoyotoon.com").
// An empty string uses constant.DefaultPatchTargetURL.
//
// opts controls optional body patching. Zero value disables all patching;
// use patchproxy.DefaultPatchOptions() for the recommended defaults.
//
// Returns (true, "") on success, (false, errMsg) on failure.
func (m *March7thHoneyService) Start(gamePath, targetURL string, opts patchproxy.PatchOptions) (bool, string) {
	if targetURL == "" {
		targetURL = constant.DefaultPatchTargetURL
	}

	proxy, err := patchproxy.New(targetURL, opts)
	if err != nil {
		return false, "proxy init: " + err.Error()
	}

	// Best-effort: install the CA cert. Non-fatal — the cert may already be
	// trusted from a previous session, or certutil might not be on PATH.
	_ = proxy.CA().InstallTrust()

	port, err := proxy.Start()
	if err != nil {
		return false, "proxy start: " + err.Error()
	}

	prev := patchproxy.SaveState()
	if err := patchproxy.SetProxy(fmt.Sprintf("127.0.0.1:%d", port)); err != nil {
		proxy.Stop()
		return false, "set system proxy: " + err.Error()
	}

	absGame, err := filepath.Abs(gamePath)
	if err != nil {
		proxy.Stop()
		patchproxy.RestoreState(prev)
		return false, "resolve game path: " + err.Error()
	}

	cmd := exec.Command(absGame)
	cmd.Dir = filepath.Dir(absGame)
	if err := cmd.Start(); err != nil {
		proxy.Stop()
		patchproxy.RestoreState(prev)
		return false, "launch game: " + err.Error()
	}

	go func() {
		_ = cmd.Wait()
		proxy.Stop()
		patchproxy.RestoreState(prev)
		application.Get().Event.Emit("game:exit")
	}()

	return true, ""
}
