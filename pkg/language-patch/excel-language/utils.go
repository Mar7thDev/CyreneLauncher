package excelLanguage

import (
	"bytes"
	"encoding/binary"
	"io"
)

func writeI8Varint(buf *bytes.Buffer, v int8) error {
	uv := uint64((uint32(v) << 1) ^ uint32(v>>7)) // zigzag encode
	b := make([]byte, binary.MaxVarintLen64)
	n := binary.PutUvarint(b, uv)
	_, err := buf.Write(b[:n])
	return err
}

func readI8Varint(r *bytes.Reader) (int, error) {
	uv, err := binary.ReadUvarint(r)
	if err != nil {
		return 0, err
	}
	// zigzag decode
	v := int((uv >> 1) ^ uint64((int64(uv&1)<<63)>>63))
	return v, nil
}

func readString(r *bytes.Reader) (string, error) {
	l, err := r.ReadByte()
	if err != nil {
		return "", err
	}
	buf := make([]byte, l)
	if _, err := io.ReadFull(r, buf); err != nil {
		return "", err
	}
	return string(buf), nil
}

func readStringArray(r *bytes.Reader) ([]string, error) {
	length, err := readI8Varint(r)
	if err != nil {
		return nil, err
	}
	arr := make([]string, 0, length)
	for i := 0; i < length; i++ {
		s, err := readString(r)
		if err != nil {
			return nil, err
		}
		arr = append(arr, s)
	}
	return arr, nil
}