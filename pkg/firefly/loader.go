package firefly

import (
	"bufio"
	"cyrene-launcher/pkg/firefly/pb"
	"io"
	"os"

	"github.com/klauspost/compress/zstd"
	"google.golang.org/protobuf/proto"
)

func LoadChunkProto(path string) (*pb.ChunkProto, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	reader := bufio.NewReader(file)
	decoder, err := zstd.NewReader(reader)
	if err != nil {
		return nil, err
	}
	defer decoder.Close()

	data, err := io.ReadAll(decoder)
	if err != nil {
		return nil, err
	}

	var chunk pb.ChunkProto
	if err := proto.Unmarshal(data, &chunk); err != nil {
		return nil, err
	}

	return &chunk, nil
}

// Load ManifestProto từ file Zstd + Protobuf
func LoadManifestProto(path string) (*pb.ManifestProto, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	reader := bufio.NewReader(file)
	decoder, err := zstd.NewReader(reader)
	if err != nil {
		return nil, err
	}
	defer decoder.Close()

	data, err := io.ReadAll(decoder)
	if err != nil {
		return nil, err
	}

	var manifest pb.ManifestProto
	if err := proto.Unmarshal(data, &manifest); err != nil {
		return nil, err
	}

	return &manifest, nil
}