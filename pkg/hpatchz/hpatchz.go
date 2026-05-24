package hpatchz

import (
	"firefly-launcher/pkg/constant"
	"fmt"
	"os/exec"
	"syscall"
)

func ApplyPatch(oldFile, diffFile, newFile string) error {
	cmd := exec.Command(constant.ToolHPatchzExe.String(), "-f", oldFile, diffFile, newFile)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to execute hpatchz: %w", err)
	}
	if cmd.ProcessState.ExitCode() != 0 {
		return fmt.Errorf("hpatchz failed: %s", string(output))
	}
	return nil
}

func ApplyPatchEmpty(diffFile, newFile string) error {
	cmd := exec.Command(constant.ToolHPatchzExe.String(), "-f", "", diffFile, newFile)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to execute hpatchz: %w", err)
	}
	if cmd.ProcessState.ExitCode() != 0 {
		return fmt.Errorf("hpatchz failed: %s", string(output))
	}
	return nil
}
