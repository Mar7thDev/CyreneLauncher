//go:build windows

// Package injector launches a Windows process suspended, injects a DLL via
// LoadLibraryW, then resumes it. The returned Process value exposes the raw
// process handle so the caller can WaitForSingleObject on it — that is the
// only reliable way to detect game exit when the target may spawn or
// re-parent helper processes.
package injector

import (
	"fmt"
	"path/filepath"
	"syscall"
	"unicode/utf16"
	"unsafe"

	"golang.org/x/sys/windows"
)

const createSuspended = 0x00000004

var (
	modKernel32        = windows.NewLazySystemDLL("kernel32.dll")
	procVirtualAllocEx = modKernel32.NewProc("VirtualAllocEx")
	procVirtualFreeEx  = modKernel32.NewProc("VirtualFreeEx")
	procCreateRemoteTh = modKernel32.NewProc("CreateRemoteThread")
)

const (
	memCommit     = 0x00001000
	memReserve    = 0x00002000
	memRelease    = 0x00008000
	pageReadWrite = 0x04
)

// Process is a launched (and possibly DLL-injected) Windows process.
// The caller owns the process handle and must call Close when done.
type Process struct {
	handle windows.Handle
	pid    uint32
}

// Pid returns the OS process id.
func (p *Process) Pid() uint32 { return p.pid }

// Wait blocks until the process exits.
func (p *Process) Wait() {
	if p.handle == 0 {
		return
	}
	_, _ = windows.WaitForSingleObject(p.handle, windows.INFINITE)
}

// Close releases the process handle.
func (p *Process) Close() {
	if p.handle != 0 {
		_ = windows.CloseHandle(p.handle)
		p.handle = 0
	}
}

// Launch starts exePath suspended, optionally injects dllPath via
// LoadLibraryW, then resumes the main thread. extraEnv entries are added to
// (or override) the parent's environment for the new process.
//
// dllPath may be empty — in that case the process is just launched with the
// extended environment, no injection.
func Launch(exePath, dllPath string, extraEnv map[string]string) (*Process, error) {
	absExe, err := filepath.Abs(exePath)
	if err != nil {
		return nil, fmt.Errorf("resolve exe: %w", err)
	}

	exeUTF16, err := syscall.UTF16PtrFromString(absExe)
	if err != nil {
		return nil, fmt.Errorf("encode exe path: %w", err)
	}
	cmdLineUTF16, err := syscall.UTF16PtrFromString(`"` + absExe + `"`)
	if err != nil {
		return nil, fmt.Errorf("encode cmd line: %w", err)
	}
	workDir := filepath.Dir(absExe)
	workDirUTF16, err := syscall.UTF16PtrFromString(workDir)
	if err != nil {
		return nil, fmt.Errorf("encode work dir: %w", err)
	}

	envBlock := buildEnvBlock(extraEnv)
	var envPtr *uint16
	if len(envBlock) > 0 {
		envPtr = &envBlock[0]
	}

	si := windows.StartupInfo{}
	si.Cb = uint32(unsafe.Sizeof(si))
	pi := windows.ProcessInformation{}

	// CREATE_UNICODE_ENVIRONMENT (0x00000400) is required since envBlock is UTF-16.
	const createUnicodeEnv = 0x00000400
	if err := windows.CreateProcess(
		exeUTF16,
		cmdLineUTF16,
		nil, nil,
		false,
		createSuspended|createUnicodeEnv,
		envPtr,
		workDirUTF16,
		&si,
		&pi,
	); err != nil {
		return nil, fmt.Errorf("CreateProcess: %w", err)
	}

	defer windows.CloseHandle(pi.Thread)

	if dllPath != "" {
		if err := injectDLL(pi.Process, dllPath); err != nil {
			_ = windows.TerminateProcess(pi.Process, 1)
			_ = windows.CloseHandle(pi.Process)
			return nil, err
		}
	}

	if _, err := windows.ResumeThread(pi.Thread); err != nil {
		_ = windows.TerminateProcess(pi.Process, 1)
		_ = windows.CloseHandle(pi.Process)
		return nil, fmt.Errorf("ResumeThread: %w", err)
	}

	return &Process{handle: pi.Process, pid: pi.ProcessId}, nil
}

// injectDLL writes dllPath into the target process's memory and calls
// LoadLibraryW via CreateRemoteThread. The remote LoadLibraryW call is
// awaited so the DLL is loaded (and DllMain has run) before we return.
func injectDLL(hProcess windows.Handle, dllPath string) error {
	absDLL, err := filepath.Abs(dllPath)
	if err != nil {
		return fmt.Errorf("resolve dll: %w", err)
	}

	dllUTF16, err := syscall.UTF16FromString(absDLL)
	if err != nil {
		return fmt.Errorf("encode dll path: %w", err)
	}
	bufLen := uintptr(len(dllUTF16) * 2)

	r, _, e := procVirtualAllocEx.Call(
		uintptr(hProcess),
		0,
		bufLen,
		memReserve|memCommit,
		pageReadWrite,
	)
	if r == 0 {
		return fmt.Errorf("VirtualAllocEx: %w", e)
	}
	remoteAddr := r
	defer procVirtualFreeEx.Call(uintptr(hProcess), remoteAddr, 0, memRelease)

	var written uintptr
	if err := windows.WriteProcessMemory(
		hProcess,
		remoteAddr,
		(*byte)(unsafe.Pointer(&dllUTF16[0])),
		bufLen,
		&written,
	); err != nil {
		return fmt.Errorf("WriteProcessMemory: %w", err)
	}

	kernel32, err := windows.LoadLibrary("kernel32.dll")
	if err != nil {
		return fmt.Errorf("LoadLibrary(kernel32): %w", err)
	}
	loadLibraryW, err := windows.GetProcAddress(kernel32, "LoadLibraryW")
	if err != nil {
		return fmt.Errorf("GetProcAddress(LoadLibraryW): %w", err)
	}

	hThread, _, e := procCreateRemoteTh.Call(
		uintptr(hProcess),
		0, 0,
		loadLibraryW,
		remoteAddr,
		0, 0,
	)
	if hThread == 0 {
		return fmt.Errorf("CreateRemoteThread: %w", e)
	}
	remoteHandle := windows.Handle(hThread)
	defer windows.CloseHandle(remoteHandle)

	if _, err := windows.WaitForSingleObject(remoteHandle, windows.INFINITE); err != nil {
		return fmt.Errorf("WaitForSingleObject(remote): %w", err)
	}
	return nil
}

// buildEnvBlock returns a UTF-16 environment block (each entry NULL-terminated,
// double-NULL at the end) merging os.Environ with overrides.
func buildEnvBlock(overrides map[string]string) []uint16 {
	merged := map[string]string{}
	for _, e := range syscall.Environ() {
		k, v, ok := splitEnv(e)
		if ok {
			merged[k] = v
		}
	}
	for k, v := range overrides {
		merged[k] = v
	}

	var out []uint16
	for k, v := range merged {
		entry := k + "=" + v
		out = append(out, utf16.Encode([]rune(entry))...)
		out = append(out, 0)
	}
	out = append(out, 0)
	return out
}

func splitEnv(e string) (string, string, bool) {
	for i := 0; i < len(e); i++ {
		if e[i] == '=' && i > 0 {
			return e[:i], e[i+1:], true
		}
	}
	return "", "", false
}
