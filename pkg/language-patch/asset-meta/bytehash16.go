package assetMeta

import (
	"fmt"
	"io"
)

type ByteHash16 []byte

func ByteHash16FromBytes(r io.ReadSeeker) (ByteHash16, error) {
	fullHash := make([]byte, 16)
	buf := make([]byte, 4)
	for i := 0; i < 4; i++ {
		if _, err := io.ReadFull(r, buf); err != nil {
			return nil, err
		}
		for j := 0; j < 4; j++ {
			fullHash[i*4+j] = buf[3-j]
		}
	}
	return ByteHash16(fullHash), nil
}

func (b ByteHash16) String() string {
	s := ""
	for _, v := range b {
		s += fmt.Sprintf("%02x", v)
	}
	return s
}
