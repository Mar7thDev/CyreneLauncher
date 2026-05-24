package languageService

import (
	"bytes"
	assetMeta "firefly-launcher/pkg/language-patch/asset-meta"
	excelLanguage "firefly-launcher/pkg/language-patch/excel-language"
	"firefly-launcher/pkg/models"
	"os"
	"path/filepath"
	"slices"
	"strings"
)

type LanguageService struct{}

func isValidLang(lang string) bool {
	valid := []string{"en", "jp", "cn", "kr"}
	return slices.Contains(valid, lang)
}

func (l *LanguageService) GetLanguage(path string) (bool, string, string, string) {
	currentVersionGame, err := models.ParseBinaryVersion(filepath.Join(path, "BinaryVersion.bytes"))
	if err != nil {
		return false, "", "", err.Error()
	}

	typeVersionGame := "os"
	if strings.Contains(currentVersionGame.Name, "CN") {
		typeVersionGame = "cn"
	}

	assetPath := filepath.Join(path, "DesignData\\Windows")

	indexHash, err := assetMeta.GetIndexHash(assetPath)
	if err != nil {
		return false, "", "", err.Error()
	}

	DesignIndex, err := assetMeta.DesignIndexFromBytes(assetPath, indexHash)
	if err != nil {
		return false, "", "", err.Error()
	}
	dataEntry, fileEntry, err := DesignIndex.FindDataAndFileByTarget(-515329346)
	if err != nil {
		return false, "", "", err.Error()
	}
	allowedLanguage := excelLanguage.NewExcelLanguage(assetPath, &dataEntry, &fileEntry)
	languageRows, err := allowedLanguage.Parse()
	if err != nil {
		return false, "", "", err.Error()
	}

	currentTextLang := ""
	currentVoiceLang := ""

	pairs := []struct {
		area string
		typ  *uint8
	}{
		{"os", nil},
		{"cn", func() *uint8 { v := uint8(1); return &v }()},
		{"os", func() *uint8 { v := uint8(1); return &v }()},
		{"cn", nil},
	}
	
	for _, p := range pairs {
		var found *excelLanguage.LanguageRow
		for i := range languageRows {
			if languageRows[i].Area != nil && *languageRows[i].Area == p.area {
				if (languageRows[i].Type == nil && p.typ == nil) ||
					(languageRows[i].Type != nil && p.typ != nil && *languageRows[i].Type == *p.typ) {
					found = &languageRows[i]
					break
				}
			}
		}
		if found == nil {
			continue
		}
		if found.DefaultLanguage != nil && found.Area != nil && *found.Area == typeVersionGame && found.Type == nil {
			currentTextLang = *found.DefaultLanguage
		}
		if found.DefaultLanguage != nil && found.Area != nil && *found.Area == typeVersionGame && found.Type != nil {
			currentVoiceLang = *found.DefaultLanguage
		}
	}

	if currentTextLang == "" || currentVoiceLang == "" || !isValidLang(currentTextLang) || !isValidLang(currentVoiceLang) {
		return false, "", "", "not found language"
	}
	
	return true, currentTextLang, currentVoiceLang, ""
}



func (l *LanguageService) SetLanguage(path string, text, voice string) (bool, string) {
	indexHash, err := assetMeta.GetIndexHash(path)
	if err != nil {
		return false, err.Error()
	}

	DesignIndex, err := assetMeta.DesignIndexFromBytes(path, indexHash)
	if err != nil {
		return false, err.Error()
	}
	dataEntry, fileEntry, err := DesignIndex.FindDataAndFileByTarget(-515329346)
	if err != nil {
		return false, err.Error()
	}
	allowedLanguage := excelLanguage.NewExcelLanguage(path, &dataEntry, &fileEntry)
	languageRows, err := allowedLanguage.Parse()
	if err != nil {
		return false, err.Error()
	}

	pairs := []struct {
		area string
		typ  *uint8
		lang string
	}{
		{"os", nil, text},
		{"cn", func() *uint8 { v := uint8(1); return &v }(), voice},
		{"os", func() *uint8 { v := uint8(1); return &v }(), voice},
		{"cn", nil, text},
	}
	
	for _, p := range pairs {
		var found *excelLanguage.LanguageRow
		for i := range languageRows {
			if languageRows[i].Area != nil && *languageRows[i].Area == p.area {
				if (languageRows[i].Type == nil && p.typ == nil) ||
					(languageRows[i].Type != nil && p.typ != nil && *languageRows[i].Type == *p.typ) {
					found = &languageRows[i]
					break
				}
			}
		}
		if found == nil {
			continue
		}
	
		found.DefaultLanguage = &p.lang
		found.LanguageList = []string{p.lang}
	}
	
	data, err := allowedLanguage.Unmarshal(languageRows)
	if err != nil {
		return false, err.Error()
	}
	
	filePath := filepath.Join(path, fileEntry.FileByteName+".bytes")
	
	f, err := os.OpenFile(filePath, os.O_RDWR, 0644)
	if err != nil {
		return false, err.Error()
	}
	defer f.Close()
	
	if _, err := f.Seek(int64(dataEntry.Offset), 0); err != nil {
		return false, err.Error()
	}
	if _, err := f.Write(data); err != nil {
		return false, err.Error()
	}
	
	if len(data) < int(dataEntry.Size) {
		remaining := int(dataEntry.Size) - len(data)
		zeros := bytes.Repeat([]byte{0}, remaining)
		if _, err := f.Write(zeros); err != nil {
			return false, err.Error()
		}
	}
	return true, "success"
}
