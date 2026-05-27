//go:build windows

// Package march7thhoney implements the March7thHoney launch path: it launches
// StarRail.exe in a suspended state, injects the Astrolabe patch DLL into the
// game process via CreateRemoteThread(LoadLibraryW), then resumes the main
// thread so the game starts with the patch already loaded.
//
// The patch DLL itself is responsible for all in-game hook work (URL rewriting,
// RSA bypass). This package only handles process creation + injection.
package march7thhoney

import (
	"fmt"
	"path/filepath"
	"unsafe"

	"golang.org/x/sys/windows"
)

var (
	modKernel32              = windows.NewLazySystemDLL("kernel32.dll")
	procCreateRemoteThread   = modKernel32.NewProc("CreateRemoteThread")
	procVirtualAllocEx       = modKernel32.NewProc("VirtualAllocEx")
	procVirtualFreeEx        = modKernel32.NewProc("VirtualFreeEx")
	procWriteProcessMemory   = modKernel32.NewProc("WriteProcessMemory")
	procGetExitCodeThread    = modKernel32.NewProc("GetExitCodeThread")
)

const (
	memCommit     = 0x00001000
	memReserve    = 0x00002000
	memRelease    = 0x00008000
	pageReadWrite = 0x04
)

// LaunchAndInject starts gameExe suspended, injects dllPath via LoadLibraryW
// in the target process, then resumes the main thread. Returns the OS process
// handle (so the caller can WaitForSingleObject on game exit) plus the pid.
//
// The returned handle must be closed by the caller via windows.CloseHandle.
func LaunchAndInject(gameExe, dllPath string) (windows.Handle, uint32, error) {
	absGame, err := filepath.Abs(gameExe)
	if err != nil {
		return 0, 0, fmt.Errorf("resolve game path: %w", err)
	}
	absDll, err := filepath.Abs(dllPath)
	if err != nil {
		return 0, 0, fmt.Errorf("resolve dll path: %w", err)
	}

	gameUtf16, err := windows.UTF16PtrFromString(absGame)
	if err != nil {
		return 0, 0, fmt.Errorf("encode game path: %w", err)
	}
	cwdUtf16, err := windows.UTF16PtrFromString(filepath.Dir(absGame))
	if err != nil {
		return 0, 0, fmt.Errorf("encode cwd: %w", err)
	}

	si := &windows.StartupInfo{}
	si.Cb = uint32(unsafe.Sizeof(*si))
	pi := &windows.ProcessInformation{}

	// CREATE_SUSPENDED so we get a chance to inject before any game code runs.
	if err := windows.CreateProcess(
		nil,
		gameUtf16,
		nil, nil, false,
		windows.CREATE_SUSPENDED,
		nil,
		cwdUtf16,
		si, pi,
	); err != nil {
		return 0, 0, fmt.Errorf("CreateProcess: %w", err)
	}

	// Ensure we don't leak the suspended process on injection failure.
	cleanup := func() {
		windows.TerminateProcess(pi.Process, 1)
		windows.CloseHandle(pi.Thread)
		windows.CloseHandle(pi.Process)
	}

	if err := injectLoadLibrary(pi.Process, absDll); err != nil {
		cleanup()
		return 0, 0, err
	}

	if _, err := windows.ResumeThread(pi.Thread); err != nil {
		cleanup()
		return 0, 0, fmt.Errorf("ResumeThread: %w", err)
	}
	windows.CloseHandle(pi.Thread)

	return pi.Process, pi.ProcessId, nil
}

// injectLoadLibrary writes the DLL path into the remote process and calls
// LoadLibraryW(thatPath) via CreateRemoteThread. Returns when the remote
// thread finishes (i.e. when LoadLibraryW returns in the target process).
func injectLoadLibrary(hProcess windows.Handle, dllPath string) error {
	dllUtf16, err := windows.UTF16FromString(dllPath)
	if err != nil {
		return fmt.Errorf("encode dll path: %w", err)
	}
	dllBytes := unsafe.Slice((*byte)(unsafe.Pointer(&dllUtf16[0])), len(dllUtf16)*2)

	remoteAddr, _, callErr := procVirtualAllocEx.Call(
		uintptr(hProcess),
		0,
		uintptr(len(dllBytes)),
		uintptr(memCommit|memReserve),
		uintptr(pageReadWrite),
	)
	if remoteAddr == 0 {
		return fmt.Errorf("VirtualAllocEx: %w", callErr)
	}
	defer procVirtualFreeEx.Call(uintptr(hProcess), remoteAddr, 0, uintptr(memRelease))

	var written uintptr
	ok, _, callErr := procWriteProcessMemory.Call(
		uintptr(hProcess),
		remoteAddr,
		uintptr(unsafe.Pointer(&dllBytes[0])),
		uintptr(len(dllBytes)),
		uintptr(unsafe.Pointer(&written)),
	)
	if ok == 0 {
		return fmt.Errorf("WriteProcessMemory: %w", callErr)
	}

	loadLibrary, err := loadLibraryWAddr()
	if err != nil {
		return err
	}

	hThread, _, callErr := procCreateRemoteThread.Call(
		uintptr(hProcess),
		0, 0,
		loadLibrary,
		remoteAddr,
		0, 0,
	)
	if hThread == 0 {
		return fmt.Errorf("CreateRemoteThread: %w", callErr)
	}
	defer windows.CloseHandle(windows.Handle(hThread))

	if _, err := windows.WaitForSingleObject(windows.Handle(hThread), windows.INFINITE); err != nil {
		return fmt.Errorf("WaitForSingleObject(thread): %w", err)
	}

	var exitCode uint32
	procGetExitCodeThread.Call(hThread, uintptr(unsafe.Pointer(&exitCode)))
	if exitCode == 0 {
		// LoadLibraryW returns the HMODULE; 0 means it failed.
		return fmt.Errorf("LoadLibraryW returned 0 in target process (DLL load failed)")
	}
	return nil
}

// loadLibraryWAddr returns the address of LoadLibraryW in the local kernel32.
// On Windows, kernel32 is loaded at the same base in every process (ASLR is
// per-boot, not per-process), so this address is also valid in the remote.
func loadLibraryWAddr() (uintptr, error) {
	k32, err := windows.LoadLibrary("kernel32.dll")
	if err != nil {
		return 0, fmt.Errorf("load kernel32: %w", err)
	}
	addr, err := windows.GetProcAddress(k32, "LoadLibraryW")
	if err != nil {
		return 0, fmt.Errorf("GetProcAddress(LoadLibraryW): %w", err)
	}
	return addr, nil
}

