package assetMeta

import (
	"encoding/binary"
	"io"
)

type DataEntry struct {
	NameHash uint64
	Size     uint32
	Offset   uint32
}

func readNameHash(r io.Reader, indexVersion uint32) (uint64, error) {
	if indexVersion >= 4 {
		var hash uint64
		err := binary.Read(r, binary.BigEndian, &hash)
		return hash, err
	}

	var hash uint32
	err := binary.Read(r, binary.BigEndian, &hash)
	return uint64(hash), err
}

func DataEntryFromBytes(r io.Reader, indexVersion uint32) (*DataEntry, error) {
	var d DataEntry

	nameHash, err := readNameHash(r, indexVersion)
	if err != nil {
		return nil, err
	}
	d.NameHash = nameHash
	if err := binary.Read(r, binary.BigEndian, &d.Size); err != nil {
		return nil, err
	}
	if err := binary.Read(r, binary.BigEndian, &d.Offset); err != nil {
		return nil, err
	}

	return &d, nil
}
