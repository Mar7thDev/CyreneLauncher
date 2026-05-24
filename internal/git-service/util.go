package gitService

import (
	"archive/zip"
	"encoding/json"
	"firefly-launcher/pkg/models"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"sync"
	"time"

)

func HumanFormat(bytes float64) string {
	if math.IsNaN(bytes) || math.IsInf(bytes, 0) {
		return fmt.Sprintf("%v", bytes)
	}
	if bytes == 0 {
		return "0B"
	}

	neg := bytes < 0
	if neg {
		bytes = -bytes
	}

	units := []string{"B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"}
	i := 0
	for bytes >= 1024 && i < len(units)-1 {
		bytes /= 1024
		i++
	}

	res := fmt.Sprintf("%.1f%s", bytes, units[i])
	if neg {
		res = "-" + res
	}
	return res
}

type WriteCounter struct {
	Total     uint64
	StartTime time.Time
	OnEmit    func(percent float64, speed string)
	TotalSize int64
	mu        sync.Mutex
}

func NewWriteCounter(total int64, onEmit func(percent float64, speed string)) *WriteCounter {
	return &WriteCounter{
		StartTime: time.Now(),
		TotalSize: total,
		OnEmit:    onEmit,
	}
}

func (wc *WriteCounter) Add(n int) {
	wc.mu.Lock()
	defer wc.mu.Unlock()
	wc.Total += uint64(n)
	wc.PrintProgress()
}

func (wc *WriteCounter) PrintProgress() {
	elapsed := time.Since(wc.StartTime).Seconds()
	if elapsed < 0.001 {
		elapsed = 0.001
	}
	speed := float64(wc.Total) / elapsed
	percent := float64(wc.Total) / float64(wc.TotalSize) * 100
	if wc.OnEmit != nil {
		wc.OnEmit(percent, fmt.Sprintf("%s/s", HumanFormat(speed)))
	}
}

func (g *GitService) downloadFileParallel(filePath, url string, numParts int, onEmit func(percent float64, speed string)) (tmpPath string, err error) {
	resp, err := http.Head(url)
	if err != nil {
		return "", fmt.Errorf("failed to get head: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("bad status: %s", resp.Status)
	}

	size := resp.ContentLength
	tmpPath = filePath + ".tmp"

	out, err := os.Create(tmpPath)
	if err != nil {
		return "", fmt.Errorf("failed to create tmp file: %w", err)
	}
	defer out.Close()

	counter := NewWriteCounter(size, onEmit)
	partSize := size / int64(numParts)
	var wg sync.WaitGroup
	var mu sync.Mutex

	for i := 0; i < numParts; i++ {
		start := int64(i) * partSize
		end := start + partSize - 1
		if i == numParts-1 {
			end = size - 1
		}

		_ = start
		_ = end

		wg.Go(func() {
			req, _ := http.NewRequest("GET", url, nil)
			req.Header.Set("Range", fmt.Sprintf("bytes=%d-%d", start, end))
			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				return
			}
			defer resp.Body.Close()

			buf := make([]byte, 32*1024)
			var written int64
			for {
				n, err := resp.Body.Read(buf)
				if n > 0 {
					mu.Lock()
					out.Seek(start+written, 0)
					out.Write(buf[:n])
					mu.Unlock()
					written += int64(n)
					counter.Add(n)
				}
				if err == io.EOF {
					break
				}
				if err != nil {
					break
				}
			}
		})
	}

	wg.Wait()
	return tmpPath, nil
}

// --- Helper getReleaseAsset ---
func (g *GitService) getReleaseAsset(version, url, fileName string) (models.AssetType, bool) {
	resp, err := http.Get(url)
	if err != nil {
		return models.AssetType{}, false
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var releases []*models.ReleaseType
	if err := json.Unmarshal(body, &releases); err != nil || len(releases) == 0 {
		return models.AssetType{}, false
	}

	for _, release := range releases {
		if release.TagName == version {
			for _, asset := range release.Assets {
				if asset.Name == fileName {
					return asset, true
				}
			}
		}
	}
	return models.AssetType{}, false
}

func (g *GitService) unzipParallel(src string, dest string) error {
	numCPU := runtime.NumCPU()

	reserved := 1
	if numCPU > 4 {
		reserved = 2
	}
	maxWorkers := numCPU - reserved
	if maxWorkers < 1 {
		maxWorkers = 1
	}
	r, err := zip.OpenReader(src)
	if err != nil {
		return err
	}
	defer r.Close()

	err = os.MkdirAll(dest, 0755)
	if err != nil {
		return err
	}

	type job struct {
		f *zip.File
	}
	jobs := make(chan job)
	var wg sync.WaitGroup

	for i := 0; i < maxWorkers; i++ {

		wg.Go(func() {
			for j := range jobs {
				err := g.extractFile(j.f, dest)
				if err != nil {
					fmt.Printf("Error extracting %s: %v\n", j.f.Name, err)
				}
			}
		})
	}

	for _, f := range r.File {
		jobs <- job{f}
	}
	close(jobs)

	wg.Wait()

	return nil
}

func (g *GitService) extractFile(f *zip.File, dest string) error {
	fp := filepath.Join(dest, f.Name)

	if f.FileInfo().IsDir() {
		return os.MkdirAll(fp, f.Mode())
	}

	err := os.MkdirAll(filepath.Dir(fp), 0755)
	if err != nil {
		return err
	}

	rc, err := f.Open()
	if err != nil {
		return err
	}
	defer rc.Close()

	out, err := os.OpenFile(fp, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, rc)
	return err
}
