package models

import (
	"errors"
	"fmt"
	"os"
	"regexp"
	"strconv"
)

type BinaryVersion struct {
	Name  string
	Major int
	Minor int
	Patch int
	Data  []byte
}

func ParseBinaryVersion(path string) (*BinaryVersion, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	content := string(data)
	fmt.Println(content)

	re := regexp.MustCompile(`([A-Za-z]+)(\d+)(?:\.(\d+))?(?:\.(\d+))?`)
	matches := re.FindStringSubmatch(content)
	if len(matches) < 2 {
		return nil, errors.New("invalid version format")
	}

	binaryVersion := BinaryVersion{
		Name: matches[1],
	}
	if matches[2] != "" {
		binaryVersion.Major, _ = strconv.Atoi(matches[2])
	}
	if len(matches) > 3 && matches[3] != "" {
		binaryVersion.Minor, _ = strconv.Atoi(matches[3])
	}
	if len(matches) > 4 && matches[4] != "" {
		binaryVersion.Patch, _ = strconv.Atoi(matches[4])
	}

	binaryVersion.Data = data
	return &binaryVersion, nil
}

func (v *BinaryVersion) String() string {
	return fmt.Sprintf("%s-%d.%d.%d", v.Name, v.Major, v.Minor, v.Patch)
}

func (v BinaryVersion) ToInt() int {
	return v.Major*100 + v.Minor*10 + v.Patch
}

func (v BinaryVersion) Subtract(other *BinaryVersion) int {
	return v.ToInt() - other.ToInt()
}
