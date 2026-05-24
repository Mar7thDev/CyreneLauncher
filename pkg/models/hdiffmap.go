package models

type DiffMapType struct {
	SourceFileName string `json:"source_file_name"`
	SourceFileMD5  string `json:"source_file_md5"`
	SourceFileSize int64  `json:"source_file_size"`

	TargetFileName string `json:"target_file_name"`
	TargetFileMD5  string `json:"target_file_md5"`
	TargetFileSize int64  `json:"target_file_size"`

	PatchFileName string `json:"patch_file_name"`
	PatchFileMD5  string `json:"patch_file_md5"`
	PatchFileSize int64  `json:"patch_file_size"`
}

type HDiffData struct {
	SourceFileName string `json:"source_file_name"`
	TargetFileName string `json:"target_file_name"`
	PatchFileName  string `json:"patch_file_name"`
}

func (d *DiffMapType) ToHDiffData() *HDiffData {
	return &HDiffData{
		SourceFileName: d.SourceFileName,
		TargetFileName: d.TargetFileName,
		PatchFileName:  d.PatchFileName,
	}
}