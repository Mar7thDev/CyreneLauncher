package assetMeta

import (
	"encoding/binary"
	"io"
)

type MiniAsset struct {
	RevisionID      uint32
	DesignIndexHash ByteHash16
}

func MiniAssetFromBytes(r io.ReadSeeker) (*MiniAsset, error) {
	if _, err := r.Seek(6*4, io.SeekCurrent); err != nil {
		return nil, err
	}

	var revID uint32
	if err := binary.Read(r, binary.LittleEndian, &revID); err != nil {
		return nil, err
	}

	hash, err := ByteHash16FromBytes(r)
	if err != nil {
		return nil, err
	}

	return &MiniAsset{
		RevisionID:      revID,
		DesignIndexHash: hash,
	}, nil
}
