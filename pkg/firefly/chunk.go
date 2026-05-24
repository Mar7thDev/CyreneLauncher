package firefly

import (
	"fmt"
	"io"
	"os"
	"path/filepath"

	"golang.org/x/exp/mmap"
)

type ChunkInfo struct {
	Name   string
	Offset int64
	Size   int64
}

func ProcessWithBufReader(path string, chunks []ChunkInfo) {
	file, err := os.Open(path)
	if err != nil {
		fmt.Printf("Error opening file %s: %v\n", path, err)
		return
	}
	defer file.Close()

	for _, chunk := range chunks {
		buffer, err := ReadChunkData(file, chunk.Offset, chunk.Size)
		if err != nil {
			fmt.Printf("Error reading chunk %s: %v\n", chunk.Name, err)
			continue
		}

		assetPath := filepath.Join("chunk_tmp", chunk.Name)
		parentDir := filepath.Dir(assetPath)
		if _, err := os.Stat(parentDir); os.IsNotExist(err) {
			if err := os.MkdirAll(parentDir, 0o755); err != nil {
				fmt.Printf("Error creating directory %s: %v\n", parentDir, err)
				continue
			}
		}

		if err := os.WriteFile(assetPath, buffer, 0o644); err != nil {
			fmt.Printf("Error writing chunk file %s: %v\n", assetPath, err)
		}
	}
}

func ReadChunkData(file *os.File, offset, size int64) ([]byte, error) {
	info, err := file.Stat()
	if err != nil {
		return nil, fmt.Errorf("error getting file info: %w", err)
	}

	if info.Size() > 1024*1024 && size > 1024*1024 {
		mmapReader, err := mmap.Open(file.Name())
		if err == nil {
			defer mmapReader.Close()
			buffer := make([]byte, size)
			_, err := mmapReader.ReadAt(buffer, offset)
			if err != nil && err != io.EOF {
				return nil, fmt.Errorf("error reading mmap: %w", err)
			}
			return buffer, nil
		}
	}

	buffer := make([]byte, size)
	_, err = file.ReadAt(buffer, offset)
	if err != nil && err != io.EOF {
		return nil, fmt.Errorf("error reading buffered: %w", err)
	}
	return buffer, nil
}