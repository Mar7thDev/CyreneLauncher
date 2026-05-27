package diffService

import (
	"bufio"
	"encoding/json"
	"cyrene-launcher/pkg/constant"
	"cyrene-launcher/pkg/hpatchz"
	"cyrene-launcher/pkg/models"
	"cyrene-launcher/pkg/sevenzip"
	"cyrene-launcher/pkg/verifier"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type DiffService struct{}

func (h *DiffService) CheckTypeHDiff(patchPath string) (bool, string, string) {
	if ok, err := sevenzip.IsFileIn7z(patchPath, "hdifffiles.txt"); err == nil && ok {
		return true, "hdifffiles.txt", ""
	}
	if ok, err := sevenzip.IsFileIn7z(patchPath, "hdifffiles.json"); err == nil && ok {
		return true, "hdifffiles.json", ""
	}
	if ok, err := sevenzip.IsFileIn7z(patchPath, "hdiffmap.json"); err == nil && ok {
		return true, "hdiffmap.json", ""
	}
	if ok, err := sevenzip.IsFileIn7z(patchPath, "manifest"); err == nil && ok {
		return true, "manifest", ""
	}

	return false, "", "not found hdifffiles.txt or hdiffmap.json"
}

func (h *DiffService) VersionValidate(gamePath, patchPath string) (bool, string) {
	oldBinPath := filepath.Join(gamePath, "StarRail_Data\\StreamingAssets\\BinaryVersion.bytes")
	if _, err := os.Stat(oldBinPath); err != nil {
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

	okFull, errFull := sevenzip.IsFileIn7z(patchPath, "StarRail_Data\\StreamingAssets\\BinaryVersion.bytes")
	okDiff, errDiff := sevenzip.IsFileIn7z(patchPath, "StarRail_Data\\StreamingAssets\\BinaryVersion.bytes.hdiff")

	if (errFull != nil && errDiff != nil) || (!okFull && !okDiff) {
		return false, "BinaryVersion file not found in patch"
	}

	var tempBinFile string

	if okFull {
		if err := sevenzip.ExtractAFileFromZip(patchPath, "StarRail_Data\\StreamingAssets\\BinaryVersion.bytes", constant.TempUrl); err != nil {
			return false, err.Error()
		}
		tempBinFile = filepath.Join(constant.TempUrl, "BinaryVersion.bytes")
	} else {
		if err := sevenzip.ExtractAFileFromZip(patchPath, "StarRail_Data\\StreamingAssets\\BinaryVersion.bytes.hdiff", constant.TempUrl); err != nil {
			return false, err.Error()
		}
		
		patchBinFile := filepath.Join(constant.TempUrl, "BinaryVersion.bytes.hdiff")
		sourceBinFile := oldBinPath
		tempBinFile = filepath.Join(constant.TempUrl, "BinaryVersion.bytes")
		
		if err := hpatchz.ApplyPatch(sourceBinFile, patchBinFile, tempBinFile); err != nil {
			os.Remove(patchBinFile)
			return false, err.Error()
		}
		os.Remove(patchBinFile)
	}

	okFullPkg, err1 := sevenzip.IsFileIn7z(patchPath, "pkg_version")
	okDiffPkg, err2 := sevenzip.IsFileIn7z(patchPath, "pkg_version.hdiff")
	if err1 != nil && err2 != nil {
		return false, err1.Error()
	}
	if okFullPkg {
		if err := sevenzip.ExtractAFileFromZip(patchPath, "pkg_version", constant.TempUrl); err != nil {
			return false, err.Error()
		}
	}
	if okDiffPkg {
		if err := sevenzip.ExtractAFileFromZip(patchPath, "pkg_version.hdiff", constant.TempUrl); err != nil {
			return false, err.Error()
		}
		patchPkgFile := filepath.Join(constant.TempUrl, "pkg_version.hdiff")
		sourcePkgFile := filepath.Join(gamePath, "pkg_version")
		tempPkgFile := filepath.Join(constant.TempUrl, "pkg_version")
		if err := hpatchz.ApplyPatch(sourcePkgFile, patchPkgFile, tempPkgFile); err != nil {
			os.Remove(patchPkgFile)
			os.Remove(tempPkgFile)
			return false, err.Error()
		}
		os.Remove(patchPkgFile)
	}

	tempPkgFile := filepath.Join(constant.TempUrl, "pkg_version")
	pkgDataList, err := models.LoadPkgVersion(tempPkgFile)
	if err != nil {
		os.Remove(tempPkgFile)
		return false, err.Error()
	}
	os.Remove(tempPkgFile)

	// MD5 check BinaryVersion
	flags := false
	for _, pkgData := range pkgDataList {
		if filepath.ToSlash(pkgData.RemoteFile) == "StarRail_Data/StreamingAssets/BinaryVersion.bytes" {
			flags = true
			md5, err := verifier.FileMD5(tempBinFile)
			if err != nil {
				os.Remove(tempBinFile)
				return false, err.Error()
			}
			if md5 != pkgData.MD5 {
				os.Remove(tempBinFile)
				return false, fmt.Sprintf("md5 mismatch for %s: expected %s, got %s",
					tempBinFile, pkgData.MD5, md5)
			}
			break
		}
	}
	if !flags {
		os.Remove(tempBinFile)
		return false, "BinaryVersion file not found in patch"
	}
	_, err = models.ParseBinaryVersion(tempBinFile)
	if err != nil {
		os.Remove(tempBinFile)
		return false, err.Error()
	}

	os.Remove(tempBinFile)
	return true, "validated"
}

func (h *DiffService) HDiffPatchData(gamePath string) (bool, string) {
	hdiffMapPath := filepath.Join(gamePath, "hdiffmap.json")
	hdiffFilesPath := filepath.Join(gamePath, "hdifffiles.txt")
	hdifffilesJsonPath := filepath.Join(gamePath, "hdifffiles.json")

	var jsonData struct {
		DiffMap []*models.HDiffData `json:"diff_map"`
	}

	if _, err := os.Stat(hdiffMapPath); err == nil {
		data, err := os.ReadFile(hdiffMapPath)
		if err != nil {
			return false, err.Error()
		}

		var jsonDataDiffMap struct {
			DiffMap []*models.DiffMapType `json:"diff_map"`
		}
		if err := json.Unmarshal(data, &jsonDataDiffMap); err != nil {
			return false, err.Error()
		}
		for _, entry := range jsonDataDiffMap.DiffMap {
			jsonData.DiffMap = append(jsonData.DiffMap, entry.ToHDiffData())
		}
	} else if _, err := os.Stat(hdifffilesJsonPath); err == nil {
		data, err := os.ReadFile(hdifffilesJsonPath)
		if err != nil {
			return false, err.Error()
		}
		var hdiffJson []*models.HDiffData
		if err := json.Unmarshal(data, &hdiffJson); err != nil {
			return false, err.Error()
		}
		jsonData.DiffMap = append(jsonData.DiffMap, hdiffJson...)
	} else if _, err := os.Stat(hdiffFilesPath); err == nil {
		files, err := models.LoadHDiffFiles(hdiffFilesPath)
		if err != nil {
			return false, err.Error()
		}
		for _, entry := range files {
			jsonData.DiffMap = append(jsonData.DiffMap, entry.ToHDiffData())
		}
	} else {
		return false, "no hdiff entries map exist"
	}

	application.Get().Event.Emit("diff:stage", map[string]string{"stage": "Patching HDiff"})

	for i, entry := range jsonData.DiffMap {
		application.Get().Event.Emit(
			"diff:progress", map[string]int{
				"progress":    i,
				"maxProgress": len(jsonData.DiffMap),
			})

		sourceFile := filepath.Join(gamePath, entry.SourceFileName)
		patchFile := filepath.Join(gamePath, entry.PatchFileName)
		targetFile := filepath.Join(gamePath, entry.TargetFileName)

		if _, err := os.Stat(patchFile); os.IsNotExist(err) {
			continue
		}

		if entry.SourceFileName == "" {
			hpatchz.ApplyPatchEmpty(patchFile, targetFile)
			os.Remove(patchFile)
			continue
		}

		if _, err := os.Stat(sourceFile); os.IsNotExist(err) {
			continue
		}

		hpatchz.ApplyPatch(sourceFile, patchFile, targetFile)
		if entry.SourceFileName != entry.TargetFileName {
			os.Remove(sourceFile)
		}
		os.Remove(patchFile)
	}

	os.Remove(filepath.Join(gamePath, "hdiffmap.json"))
	os.Remove(filepath.Join(gamePath, "hdifffiles.txt"))
	os.Remove(filepath.Join(gamePath, "hdifffiles.json"))
	return true, "patching completed"
}

func (h *DiffService) DeleteFiles(gamePath string) (bool, string) {
	var deleteFiles []string

	file, err := os.Open(filepath.Join(gamePath, "deletefiles.txt"))
	if err != nil {
		return false, ""
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line != "" {
			deleteFiles = append(deleteFiles, line)
		}
	}

	if err := scanner.Err(); err != nil {
		file.Close()
		return false, "no delete files exist"
	}

	file.Close()

	for i, file := range deleteFiles {
		os.Remove(filepath.Join(gamePath, file))
		application.Get().Event.Emit("diff:progress", map[string]int{"progress": i, "maxProgress": len(deleteFiles)})
	}
	os.Remove(filepath.Join(gamePath, "deletefiles.txt"))
	return true, ""
}
