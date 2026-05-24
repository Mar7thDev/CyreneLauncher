package firefly

import (
	"firefly-launcher/pkg/firefly/pb"
	"fmt"
	"os"
	"path/filepath"

	"golang.org/x/exp/mmap"
)


func LDiffFile(data *pb.AssetManifest, assetName string, assetSize int64, ldiffsDir, outputDir string) error {
	path := filepath.Join(ldiffsDir, data.ChunkFileName)

	info, err := os.Stat(path)
	if err != nil {
		return fmt.Errorf("%s does not exist: %w", path, err)
	}

	fileSize := info.Size()
	var buffer []byte

	if fileSize > 10*1024*1024 && data.HdiffFileSize > 1*1024*1024 {
		// mmap for large files using x/exp/mmap
		reader, err := mmap.Open(path)
		if err != nil {
			// fallback to buffered read
			file, err := os.Open(path)
			if err != nil {
				return fmt.Errorf("error opening file %s: %w", path, err)
			}
			defer file.Close()
			buffer, err = ReadBuffer(file, data.HdiffFileInChunkOffset, data.HdiffFileSize)
			if err != nil {
				return err
			}
		} else {
			defer reader.Close()
			buffer = make([]byte, data.HdiffFileSize)
			_, err := reader.ReadAt(buffer, data.HdiffFileInChunkOffset)
			if err != nil {
				return fmt.Errorf("error reading mmap data: %w", err)
			}
		}
	} else {
		// small files, buffered read
		file, err := os.Open(path)
		if err != nil {
			return fmt.Errorf("error opening file %s: %w", path, err)
		}
		defer file.Close()

		buffer, err = ReadBuffer(file, data.HdiffFileInChunkOffset, data.HdiffFileSize)
		if err != nil {
			return err
		}
	}

	extension := ""
	if data.OriginalFileSize != 0 || assetSize != data.HdiffFileSize {
		extension = ".hdiff"
	}
	assetPath := filepath.Join(outputDir, assetName+extension)
	parentDir := filepath.Dir(assetPath)
	if _, err := os.Stat(parentDir); os.IsNotExist(err) {
		if err := os.MkdirAll(parentDir, 0o755); err != nil {
			return fmt.Errorf("error creating directory %s: %w", parentDir, err)
		}
	}

	if err := os.WriteFile(assetPath, buffer, 0o644); err != nil {
		return fmt.Errorf("error writing file %s: %w", assetPath, err)
	}

	return nil
}



func ReadBuffer(file *os.File, offset int64, size int64) ([]byte, error) {
	buffer := make([]byte, size)

	n, err := file.ReadAt(buffer, offset)
	if err != nil {
		return nil, fmt.Errorf("error reading data: %w", err)
	}
	if int64(n) != size {
		return nil, fmt.Errorf("expected %d bytes, but read %d bytes", size, n)
	}

	return buffer, nil
}

