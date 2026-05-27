package diffService

import (
	"cyrene-launcher/pkg/constant"
	"cyrene-launcher/pkg/sevenzip"
	"io"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v3/pkg/application"
)

func (h *DiffService) DataExtract(gamePath, patchPath string) (bool, string) {
	os.RemoveAll(constant.TempUrl)
	if _, err := os.Stat(gamePath); err != nil {
		return false, err.Error()
	}

	if _, err := os.Stat(patchPath); err != nil {
		return false, err.Error()
	}

	if _, err := os.Stat(constant.TempUrl); os.IsNotExist(err) {
		if err := os.MkdirAll(constant.TempUrl, os.ModePerm); err != nil {
			return false, err.Error()
		}
	}

	if err := sevenzip.ExtractAllFilesFromZip(patchPath, constant.TempUrl); err != nil {
		os.RemoveAll(constant.TempUrl)
		return false, err.Error()
	}
	return true, "extract completed"
}

func (h *DiffService) CutData(gamePath string) (bool, string) {
	if _, err := os.Stat(constant.TempUrl); os.IsNotExist(err) {
		return false, err.Error()
	}

	err := filepath.Walk(constant.TempUrl, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		relPath, err := filepath.Rel(constant.TempUrl, path)
		if err != nil {
			return err
		}
		destPath := filepath.Join(gamePath, relPath)
		application.Get().Event.Emit("diff:message", map[string]string{"message": destPath})
		if info.IsDir() {
			return os.MkdirAll(destPath, os.ModePerm)
		}

		if err := os.MkdirAll(filepath.Dir(destPath), os.ModePerm); err != nil {
			return err
		}

		if err := os.Rename(path, destPath); err != nil {
			srcFile, err := os.Open(path)
			if err != nil {
				return err
			}
			defer srcFile.Close()

			dstFile, err := os.Create(destPath)
			if err != nil {
				return err
			}
			defer dstFile.Close()

			if _, err := io.Copy(dstFile, srcFile); err != nil {
				return err
			}
			os.Remove(path)
		}
		return nil
	})

	if err != nil {
		os.RemoveAll(constant.TempUrl)
		return false, err.Error()
	}
	os.RemoveAll(constant.TempUrl)
	return true, "cut completed"
}
