package gitService

import (
	"archive/zip"
	"cyrene-launcher/pkg/constant"
	"cyrene-launcher/pkg/models"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
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
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("bad status: %s", resp.Status)
	}

	size := resp.ContentLength
	if size <= 0 || numParts <= 0 {
		return "", fmt.Errorf("invalid download size %d or part count %d", size, numParts)
	}
	if size < int64(numParts) {
		numParts = int(size)
	}

	out, err := os.Create(filePath + ".tmp")
	if err != nil {
		return "", fmt.Errorf("failed to create tmp file: %w", err)
	}
	defer func() {
		if closeErr := out.Close(); err == nil && closeErr != nil {
			err = closeErr
		}
		if err != nil {
			os.Remove(out.Name())
			tmpPath = ""
		}
	}()

	counter := NewWriteCounter(size, onEmit)
	partSize := size / int64(numParts)
	var wg sync.WaitGroup
	var firstFailure sync.Once
	var downloadErr error

	for i := 0; i < numParts; i++ {
		start := int64(i) * partSize
		end := start + partSize - 1
		if i == numParts-1 {
			end = size - 1
		}

		wg.Go(func() {
			writer := downloadWriter{io.NewOffsetWriter(out, start), counter}
			if err := downloadRange(url, start, end, size, writer); err != nil {
				firstFailure.Do(func() {
					downloadErr = fmt.Errorf("download bytes %d-%d: %w", start, end, err)
				})
			}
		})
	}

	wg.Wait()
	return out.Name(), downloadErr
}

type downloadWriter struct {
	io.Writer
	counter *WriteCounter
}

func (w downloadWriter) Write(p []byte) (int, error) {
	n, err := w.Writer.Write(p)
	w.counter.Add(n)
	return n, err
}

func downloadRange(url string, start, end, size int64, writer io.Writer) error {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Range", fmt.Sprintf("bytes=%d-%d", start, end))
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusPartialContent {
		return fmt.Errorf("expected partial content, got %s", resp.Status)
	}
	expectedRange := fmt.Sprintf("bytes %d-%d/%d", start, end, size)
	if actualRange := resp.Header.Get("Content-Range"); actualRange != expectedRange {
		return fmt.Errorf("expected Content-Range %q, got %q", expectedRange, actualRange)
	}
	if _, err := io.CopyN(writer, resp.Body, end-start+1); err != nil {
		return err
	}
	var extra [1]byte
	if _, err := io.ReadFull(resp.Body, extra[:]); err != io.EOF {
		if err == nil {
			return fmt.Errorf("response exceeded Content-Range %q", expectedRange)
		}
		return err
	}
	return nil
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

// getLatestReleaseTagWithAsset selects the newest ordinary release with the requested asset.
func (g *GitService) getLatestReleaseTagWithAsset(url, fileName string) (string, bool) {
	return g.getLatestReleaseTagWithAssetMatching(url, fileName, isOrdinaryRelease)
}

// getLatestHoneyProductionReleaseTag selects the newest prod-* prerelease with the requested asset.
func (g *GitService) getLatestHoneyProductionReleaseTag(url, fileName string) (string, bool) {
	return g.getLatestReleaseTagWithAssetMatching(url, fileName, isHoneyProductionRelease)
}

func (g *GitService) getLatestReleaseTagWithAssetMatching(url, fileName string, matches func(*models.ReleaseType) bool) (string, bool) {
	resp, err := http.Get(url)
	if err != nil {
		return "", false
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var releases []*models.ReleaseType
	if err := json.Unmarshal(body, &releases); err != nil {
		return "", false
	}

	return findLatestReleaseTagWithAsset(releases, fileName, matches)
}

func findLatestReleaseTagWithAsset(releases []*models.ReleaseType, fileName string, matches func(*models.ReleaseType) bool) (string, bool) {
	for _, release := range releases {
		if !matches(release) {
			continue
		}
		for _, asset := range release.Assets {
			if asset.Name == fileName {
				return release.TagName, true
			}
		}
	}
	return "", false
}

func isOrdinaryRelease(release *models.ReleaseType) bool {
	return !release.Draft && !release.Prerelease
}

func isHoneyProductionRelease(release *models.ReleaseType) bool {
	return !release.Draft && release.Prerelease && strings.HasPrefix(release.TagName, constant.HoneyServerProdTagPrefix)
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
