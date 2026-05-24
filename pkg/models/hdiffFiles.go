package models

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
)

type HDiffFiles struct {
	RemoteFile string `json:"remoteName"`
}
func (h *HDiffFiles) ToHDiffData() *HDiffData {
	return &HDiffData{
		SourceFileName: h.RemoteFile,
		TargetFileName: h.RemoteFile,
		PatchFileName:  fmt.Sprintf("%s.hdiff", h.RemoteFile),
	}
}

func LoadHDiffFiles(path string) ([]*HDiffFiles, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var results []*HDiffFiles
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		var item HDiffFiles
		if err := json.Unmarshal([]byte(line), &item); err == nil {
			results = append(results, &item)
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return results, nil
}
