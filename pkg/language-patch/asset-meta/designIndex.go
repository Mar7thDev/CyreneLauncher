package assetMeta

import (
	"bytes"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)


type DesignIndex struct {
	Magic           uint32
	Version         uint32
	FileCount       uint32
	DesignDataCount uint32
	FileList        []FileEntry
}



func (d *DesignIndex) FindAllowedLanguage() (DataEntry, FileEntry, error) {
	targets := map[uint32]uint64{
		3: 0xe148b2be,
		4: 0xb804dbc76d81fb75,
	}
	target, ok := targets[d.Version]
	if !ok {
		return DataEntry{}, FileEntry{}, fmt.Errorf("unsupported DesignV version: %d", d.Version)
	}
	for _, file := range d.FileList {
		for _, entry := range file.DataEntries {
			if entry.NameHash == target {
				return entry, file, nil
			}
		}
	}
	return DataEntry{}, FileEntry{}, errors.New("not found")
}


func DesignIndexFromBytes(assetFolder string, indexHash string) (*DesignIndex, error) {
	path := filepath.Join(assetFolder, fmt.Sprintf("DesignV_%s.bytes", indexHash))
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	r := bytes.NewReader(data)

	var d DesignIndex

	if err := binary.Read(r, binary.BigEndian, &d.Magic); err != nil {
		return nil, err
	}
	if err := binary.Read(r, binary.BigEndian, &d.Version); err != nil {
		return nil, err
	}
	if err := binary.Read(r, binary.BigEndian, &d.FileCount); err != nil {
		return nil, err
	}
	if err := binary.Read(r, binary.BigEndian, &d.DesignDataCount); err != nil {
		return nil, err
	}

	if d.Magic != 0xff || d.FileCount > 4096 || d.DesignDataCount > 4_000_000 {
		return nil, errors.New("invalid DesignV index")
	}
	if d.Version != 3 && d.Version != 4 {
		return nil, fmt.Errorf("unsupported DesignV version: %d", d.Version)
	}

	d.FileList = make([]FileEntry, 0, int(d.FileCount))
	for i := uint32(0); i < d.FileCount; i++ {
		entry, err := FileEntryFromBytes(r, d.Version, d.DesignDataCount)
		if err != nil {
			return nil, err
		}
		d.FileList = append(d.FileList, *entry)
	}

	return &d, nil
}


func GetIndexHash(assetFolder string) (string, error) {
	path := filepath.Join(assetFolder, "M_DesignV.bytes")

	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	_, err = f.Seek(0x1C, 0)
	if err != nil {
		return "", err
	}

	hash := make([]byte, 0x10)
	index := 0
	for i := 0; i < 4; i++ {
		chunk := make([]byte, 4)
		_, err := f.Read(chunk)
		if err != nil {
			return "", err
		}

		for bytePos := 3; bytePos >= 0; bytePos-- {
			hash[index] = chunk[bytePos]
			index++
		}
	}

	return hex.EncodeToString(hash), nil
}