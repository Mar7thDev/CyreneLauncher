//go:build windows

package fsService

import (
	"path/filepath"
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"
)

// ERROR_ELEVATION_REQUIRED — returned by CreateProcess when the target binary's
// manifest declares `requireAdministrator` and the caller isn't elevated.
const errorElevationRequired = syscall.Errno(740)

var (
	modShell32          = windows.NewLazySystemDLL("shell32.dll")
	procShellExecuteExW = modShell32.NewProc("ShellExecuteExW")
)

const (
	seeMaskNoCloseProcess = 0x00000040
	swShowNormal          = 1
)

// shellExecuteInfoW mirrors SHELLEXECUTEINFOW from <shellapi.h>.
// Field order and types are load-bearing for the syscall.
type shellExecuteInfoW struct {
	cbSize         uint32
	fMask          uint32
	hwnd           windows.Handle
	lpVerb         *uint16
	lpFile         *uint16
	lpParameters   *uint16
	lpDirectory    *uint16
	nShow          int32
	hInstApp       windows.Handle
	lpIDList       uintptr
	lpClass        *uint16
	hkeyClass      windows.Handle
	dwHotKey       uint32
	hIconOrMonitor windows.Handle
	hProcess       windows.Handle
}

// runElevated launches `path` via the Windows shell with the "runas" verb,
// which triggers the UAC consent prompt. Returns a process handle the caller
// can WaitForSingleObject on, or an error if the user cancels UAC / the call
// fails (e.g. file missing).
func runElevated(path string) (windows.Handle, error) {
	verb, err := windows.UTF16PtrFromString("runas")
	if err != nil {
		return 0, err
	}
	file, err := windows.UTF16PtrFromString(path)
	if err != nil {
		return 0, err
	}
	cwd, err := windows.UTF16PtrFromString(filepath.Dir(path))
	if err != nil {
		return 0, err
	}

	info := shellExecuteInfoW{
		fMask:       seeMaskNoCloseProcess,
		lpVerb:      verb,
		lpFile:      file,
		lpDirectory: cwd,
		nShow:       swShowNormal,
	}
	info.cbSize = uint32(unsafe.Sizeof(info))

	ret, _, callErr := procShellExecuteExW.Call(uintptr(unsafe.Pointer(&info)))
	if ret == 0 {
		// Last-error is set by ShellExecuteEx when it returns FALSE.
		return 0, callErr
	}
	return info.hProcess, nil
}

// isElevationRequired returns true when the OS rejected a CreateProcess call
// because the target needs administrator rights.
func isElevationRequired(err error) bool {
	if err == nil {
		return false
	}
	var errno syscall.Errno
	if asErrno(err, &errno) {
		return errno == errorElevationRequired
	}
	return false
}

// asErrno walks the error chain looking for a syscall.Errno.
func asErrno(err error, target *syscall.Errno) bool {
	for err != nil {
		if e, ok := err.(syscall.Errno); ok {
			*target = e
			return true
		}
		type unwrapper interface{ Unwrap() error }
		u, ok := err.(unwrapper)
		if !ok {
			return false
		}
		err = u.Unwrap()
	}
	return false
}
