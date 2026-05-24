package sevenzip

import (
	"bytes"
	"firefly-launcher/pkg/constant"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

func IsFileIn7z(archivePath, fileInside string) (bool, error) {
	cmd := exec.Command(constant.Tool7zaExe.String(), "l", archivePath)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out

	if err := cmd.Run(); err != nil {
		return false, fmt.Errorf("7za list failed: %v\nOutput: %s", err, out.String())
	}

	lines := strings.Split(out.String(), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		parts := strings.Fields(line)
		if len(parts) > 0 {
			path := parts[len(parts)-1]
			if path == fileInside {
				return true, nil
			}
		}

	}

	return false, fmt.Errorf("%s not found in %s", fileInside, archivePath)
}

func ListFilesInZip(archivePath string) ([]string, error) {
	cmd := exec.Command(constant.Tool7zaExe.String(), "l", archivePath)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("7za list failed: %v\nOutput: %s", err, out.String())
	}

	lines := strings.Split(out.String(), "\n")
	var files []string
	foundTable := false

	for _, line := range lines {
		if strings.HasPrefix(line, "----------") {
			if foundTable {
				break 
			}
			foundTable = true
			continue
		}

		if foundTable {
			fields := strings.Fields(line)
			if len(fields) >= 6 {
				fileName := strings.Join(fields[5:], " ")
				files = append(files, fileName)
			}
		}
	}

	return files, nil
}

func ExtractAFileFromZip(archivePath, fileInside, outDir string) error {
	cmd := exec.Command(constant.Tool7zaExe.String(), "e", archivePath, fileInside, "-o"+outDir, "-y")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func ExtractAllFilesFromZip(archivePath, outDir string) error {
	cmd := exec.Command(constant.Tool7zaExe.String(), "x", archivePath, "-o"+outDir, "-y")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}
