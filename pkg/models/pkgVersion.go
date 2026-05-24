package models

import (
	"bufio"
	"encoding/json"
	"os"
)

type PkgVersion struct {
	RemoteFile string `json:"remoteName"`
	MD5        string `json:"md5"`
}

func LoadPkgVersion(path string) ([]*PkgVersion, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var results []*PkgVersion
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		var item PkgVersion
		if err := json.Unmarshal([]byte(line), &item); err == nil {
			results = append(results, &item)
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return results, nil
}
