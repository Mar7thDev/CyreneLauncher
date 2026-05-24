package assetMeta

import (
	"encoding/binary"
	"io"
)

type DataEntry struct {
	NameHash int32
	Size     uint32
	Offset   uint32
}

func DataEntryFromBytes(r io.Reader) (*DataEntry, error) {
	var d DataEntry

	if err := binary.Read(r, binary.BigEndian, &d.NameHash); err != nil {
		return nil, err
	}
	if err := binary.Read(r, binary.BigEndian, &d.Size); err != nil {
		return nil, err
	}
	if err := binary.Read(r, binary.BigEndian, &d.Offset); err != nil {
		return nil, err
	}

	return &d, nil
}
