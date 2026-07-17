package assetMeta

import (
	"encoding/binary"
	"fmt"
	"io"
)

type FileEntry struct {
	NameHash     uint64
	FileByteName string
	Size         uint64
	DataCount    uint32
	DataEntries  []DataEntry
	Lang         string
	Unk          uint8
}

func FileEntryFromBytes(r io.Reader, indexVersion, maxDataCount uint32) (*FileEntry, error) {
	var f FileEntry

	nameHash, err := readNameHash(r, indexVersion)
	if err != nil {
		return nil, err
	}
	f.NameHash = nameHash

	buf := make([]byte, 16)
	if _, err := io.ReadFull(r, buf); err != nil {
		return nil, err
	}
	f.FileByteName = toHex(buf)

	if err := binary.Read(r, binary.BigEndian, &f.Size); err != nil {
		return nil, err
	}
	if err := binary.Read(r, binary.BigEndian, &f.DataCount); err != nil {
		return nil, err
	}
	if f.DataCount > maxDataCount {
		return nil, fmt.Errorf("invalid DesignV data count: %d", f.DataCount)
	}

	f.DataEntries = make([]DataEntry, 0, int(f.DataCount))
	for i := uint32(0); i < f.DataCount; i++ {
		entry, err := DataEntryFromBytes(r, indexVersion)
		if err != nil {
			return nil, err
		}
		f.DataEntries = append(f.DataEntries, *entry)
	}

	// length-prefixed language tag (e.g. "jp"/"kr"/"cn"/"en"; empty for most files)
	var langLen uint16
	if err := binary.Read(r, binary.BigEndian, &langLen); err != nil {
		return nil, err
	}
	if langLen > 0 {
		langBuf := make([]byte, langLen)
		if _, err := io.ReadFull(r, langBuf); err != nil {
			return nil, err
		}
		f.Lang = string(langBuf)
	}

	// trailing flag byte
	b := make([]byte, 1)
	if _, err := io.ReadFull(r, b); err != nil {
		return nil, err
	}
	f.Unk = b[0]

	return &f, nil
}

func toHex(buf []byte) string {
	s := ""
	for _, b := range buf {
		s += fmt.Sprintf("%02x", b)
	}
	return s
}
