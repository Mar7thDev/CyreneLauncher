package excelLanguage

import (
	"bytes"
	"errors"
)

type LanguageRow struct {
	Area            *string
	Type            *uint8
	LanguageList    []string
	DefaultLanguage *string
}

func (r *LanguageRow) Unmarshal() ([]byte, error) {
	buf := new(bytes.Buffer)

	var bitmask uint8
	if r.Area != nil {
		bitmask |= 1 << 0
	}
	if r.Type != nil {
		bitmask |= 1 << 1
	}
	if len(r.LanguageList) > 0 {
		bitmask |= 1 << 2
	}
	if r.DefaultLanguage != nil {
		bitmask |= 1 << 3
	}

	if err := buf.WriteByte(bitmask); err != nil {
		return nil, err
	}

	if r.Area != nil {
		if err := writeString(buf, *r.Area); err != nil {
			return nil, err
		}
	}
	if r.Type != nil {
		if err := buf.WriteByte(*r.Type); err != nil {
			return nil, err
		}
	}
	if len(r.LanguageList) > 0 {
		if err := writeStringArray(buf, r.LanguageList); err != nil {
			return nil, err
		}
	}
	if r.DefaultLanguage != nil {
		if err := writeString(buf, *r.DefaultLanguage); err != nil {
			return nil, err
		}
	}

	return buf.Bytes(), nil
}

func writeString(buf *bytes.Buffer, s string) error {
	if len(s) > 255 {
		return errors.New("string too long")
	}
	if err := buf.WriteByte(uint8(len(s))); err != nil {
		return err
	}
	_, err := buf.Write([]byte(s))
	return err
}

func writeStringArray(buf *bytes.Buffer, arr []string) error {
	if err := writeI8Varint(buf, int8(len(arr))); err != nil {
		return err
	}
	for _, s := range arr {
		if err := writeString(buf, s); err != nil {
			return err
		}
	}
	return nil
}
