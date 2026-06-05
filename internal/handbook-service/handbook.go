package handbookService

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

// HandbookService fetches the GM handbook from a March7thHoney server and
// answers id/name lookups locally. The big text is kept here (cached per
// server+language) so the UI only ever receives the matching entries.
type HandbookService struct {
	mu    sync.Mutex
	cache map[string]string
}

const defaultServerURL = "https://march7th.hoyotoon.com"

func normalizeBase(serverURL string) string {
	base := strings.TrimRight(strings.TrimSpace(serverURL), "/")
	if base == "" {
		base = defaultServerURL
	}
	return base
}

func httpGet(reqURL string) ([]byte, error) {
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Get(reqURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		msg := strings.TrimSpace(string(body))
		if msg == "" {
			msg = fmt.Sprintf("HTTP %d", resp.StatusCode)
		}
		return nil, fmt.Errorf("%s", msg)
	}
	return body, nil
}

// Languages returns the handbook languages available on the server.
func (h *HandbookService) Languages(serverURL string) (bool, []string, string) {
	body, err := httpGet(normalizeBase(serverURL) + "/handbook/languages")
	if err != nil {
		return false, nil, err.Error()
	}
	var parsed struct {
		Languages []string `json:"languages"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return false, nil, err.Error()
	}
	return true, parsed.Languages, ""
}

func (h *HandbookService) content(base, lang string) (string, error) {
	key := base + "\x00" + lang

	h.mu.Lock()
	if h.cache == nil {
		h.cache = map[string]string{}
	}
	if c, ok := h.cache[key]; ok {
		h.mu.Unlock()
		return c, nil
	}
	h.mu.Unlock()

	body, err := httpGet(base + "/handbook/content?lang=" + url.QueryEscape(lang))
	if err != nil {
		return "", err
	}
	text := string(body)

	h.mu.Lock()
	h.cache[key] = text
	h.mu.Unlock()
	return text, nil
}

// Search fetches (and caches) the handbook for a language and returns every line
// containing the query (case-insensitive) — a plain full-text search over the
// whole handbook: commands, items, ids, names, everything.
func (h *HandbookService) Search(serverURL, lang, query string) (bool, []string, string) {
	text, err := h.content(normalizeBase(serverURL), lang)
	if err != nil {
		return false, nil, err.Error()
	}

	q := strings.ToLower(strings.TrimSpace(query))
	if q == "" {
		return true, []string{}, ""
	}

	const maxResults = 1000
	results := make([]string, 0, 64)
	for _, raw := range strings.Split(text, "\n") {
		line := strings.TrimRight(raw, "\r")
		if strings.TrimSpace(line) == "" {
			continue
		}
		if strings.Contains(strings.ToLower(line), q) {
			results = append(results, line)
			if len(results) >= maxResults {
				break
			}
		}
	}

	return true, results, ""
}
