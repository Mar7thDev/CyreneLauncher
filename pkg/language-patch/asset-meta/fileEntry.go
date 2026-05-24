package assetMeta

import (
	"encoding/binary"
	"fmt"
	"io"
)

type FileEntry struct {
	NameHash       int32
	FileByteName   string
	Size           int64
	DataCount      int32
	DataEntries    []DataEntry
	Unk            uint8
}

func FileEntryFromBytes(r io.Reader) (*FileEntry, error) {
	var f FileEntry

	if err := binary.Read(r, binary.BigEndian, &f.NameHash); err != nil {
		return nil, err
	}

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

	f.DataEntries = make([]DataEntry, 0, f.DataCount)
	for i := int32(0); i < f.DataCount; i++ {
		entry, err := DataEntryFromBytes(r)
		if err != nil {
			return nil, err
		}
		f.DataEntries = append(f.DataEntries, *entry)
	}

	// read 1 byte
	b := make([]byte, 1)
	if _, err := r.Read(b); err != nil {
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
