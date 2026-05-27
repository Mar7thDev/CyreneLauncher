//go:build windows

package patchproxy

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"golang.org/x/sys/windows"
	"golang.org/x/sys/windows/registry"
)

const regInetSettings = `Software\Microsoft\Windows\CurrentVersion\Internet Settings`

// ProxyState captures the Windows system proxy configuration so it can be
// restored after the game session ends.
type ProxyState struct {
	Enabled uint64
	Server  string
}

// SaveState reads and returns the current Windows system proxy settings.
func SaveState() ProxyState {
	k, err := registry.OpenKey(registry.CURRENT_USER, regInetSettings, registry.QUERY_VALUE)
	if err != nil {
		return ProxyState{}
	}
	defer k.Close()
	enabled, _, _ := k.GetIntegerValue("ProxyEnable")
	server, _, _ := k.GetStringValue("ProxyServer")
	return ProxyState{Enabled: enabled, Server: server}
}

// SetProxy points the Windows system HTTP/HTTPS proxy at addr
// (e.g. "127.0.0.1:8080") and notifies WinHTTP/WinInet to reload.
func SetProxy(addr string) error {
	k, err := registry.OpenKey(registry.CURRENT_USER, regInetSettings, registry.SET_VALUE)
	if err != nil {
		return fmt.Errorf("open registry: %w", err)
	}
	defer k.Close()
	if err := k.SetStringValue("ProxyServer", addr); err != nil {
		return err
	}
	if err := k.SetDWordValue("ProxyEnable", 1); err != nil {
		return err
	}
	notifyProxyChange()
	return nil
}

// RestoreState writes back the previously-saved proxy settings.
func RestoreState(state ProxyState) {
	k, err := registry.OpenKey(registry.CURRENT_USER, regInetSettings, registry.SET_VALUE)
	if err != nil {
		return
	}
	defer k.Close()
	enabled := uint32(0)
	if state.Enabled != 0 {
		enabled = 1
	}
	_ = k.SetDWordValue("ProxyEnable", enabled)
	_ = k.SetStringValue("ProxyServer", state.Server)
	notifyProxyChange()
}

var (
	modWininet            = windows.NewLazySystemDLL("wininet.dll")
	procInternetSetOption = modWininet.NewProc("InternetSetOptionW")
)

const (
	inetOptionSettingsChanged = 39
	inetOptionRefresh         = 37
)

// notifyProxyChange tells WinHTTP/WinInet to re-read the proxy configuration
// without requiring a process restart.
func notifyProxyChange() {
	_, _, _ = procInternetSetOption.Call(0, inetOptionSettingsChanged, 0, 0)
	_, _, _ = procInternetSetOption.Call(0, inetOptionRefresh, 0, 0)
}

// InstallTrust adds the proxy root CA certificate to the Windows trusted root
// store so the game accepts our MITM TLS certificates.
// Safe to call multiple times — certutil is idempotent for the same thumbprint.
func (ca *caState) InstallTrust() error {
	absPath, err := filepath.Abs(caCertFile)
	if err != nil {
		return err
	}
	// Ensure the cert file is on disk (it should already be from getCA, but
	// write it again to be safe).
	if _, err := os.Stat(absPath); os.IsNotExist(err) {
		if err := os.MkdirAll(filepath.Dir(absPath), 0755); err != nil {
			return err
		}
		if err := os.WriteFile(absPath, ca.certPEM, 0644); err != nil {
			return err
		}
	}
	// Try machine store first (requires admin, which the launcher typically has).
	if err := exec.Command("certutil", "-addstore", "Root", absPath).Run(); err == nil {
		return nil
	}
	// Fallback to current-user store.
	out, err := exec.Command("certutil", "-addstore", "-user", "Root", absPath).CombinedOutput()
	if err != nil {
		return fmt.Errorf("certutil: %s", out)
	}
	return nil
}
