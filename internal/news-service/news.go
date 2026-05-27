package newsService

import (
	"encoding/json"
	"firefly-launcher/pkg/constant"
	"fmt"
	"html"
	"io"
	"net/http"
	"net/url"
	"path"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

type NewsService struct{}

// NewsItem is the unified shape returned for all news sources.
type NewsItem struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Intro     string `json:"intro"`
	Image     string `json:"image"`
	URL       string `json:"url"`
	Time      string `json:"time"`      // formatted YYYY-MM-DD
	Timestamp int64  `json:"timestamp"` // unix seconds, for sorting
	Type      string `json:"type"`      // "notice" / "event" / "info" / "" (server)
}

// ───────── shared helpers ─────────

var (
	htmlTagRe    = regexp.MustCompile(`<[^>]*>`)
	whitespaceRe = regexp.MustCompile(`\s+`)

	// Cheap markdown stripper (covers headers, emphasis, links, images, code)
	mdCodeBlockRe  = regexp.MustCompile("```[\\s\\S]*?```")
	mdInlineCodeRe = regexp.MustCompile("`([^`]+)`")
	mdImageRe      = regexp.MustCompile(`!\[[^\]]*\]\([^)]+\)`)
	mdLinkRe       = regexp.MustCompile(`\[([^\]]+)\]\([^)]+\)`)
	mdBoldRe       = regexp.MustCompile(`\*\*([^*]+)\*\*|__([^_]+)__`)
	mdItalicRe     = regexp.MustCompile(`(?:\*|_)([^*_]+)(?:\*|_)`)
	mdHeaderRe     = regexp.MustCompile(`(?m)^#+\s+`)
	mdListRe       = regexp.MustCompile(`(?m)^[-*+]\s+`)
)

func stripHTML(s string) string {
	if s == "" {
		return ""
	}
	s = strings.NewReplacer(
		"<br>", " ", "<br/>", " ", "<br />", " ",
		"</p>", " ", "</div>", " ", "</li>", " ",
	).Replace(s)
	s = htmlTagRe.ReplaceAllString(s, "")
	s = html.UnescapeString(s)
	s = whitespaceRe.ReplaceAllString(s, " ")
	return strings.TrimSpace(s)
}

func stripMarkdown(s string) string {
	if s == "" {
		return ""
	}
	s = mdCodeBlockRe.ReplaceAllString(s, " ")
	s = mdImageRe.ReplaceAllString(s, " ")
	s = mdLinkRe.ReplaceAllString(s, "$1")
	s = mdBoldRe.ReplaceAllString(s, "$1$2")
	s = mdItalicRe.ReplaceAllString(s, "$1")
	s = mdInlineCodeRe.ReplaceAllString(s, "$1")
	s = mdHeaderRe.ReplaceAllString(s, "")
	s = mdListRe.ReplaceAllString(s, "")
	s = strings.ReplaceAll(s, "\r", "")
	s = strings.ReplaceAll(s, "\n", " ")
	s = whitespaceRe.ReplaceAllString(s, " ")
	return strings.TrimSpace(s)
}

func httpGet(reqURL string, headers map[string]string) ([]byte, error) {
	client := &http.Client{Timeout: 12 * time.Second}
	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil, err
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d", resp.StatusCode)
	}
	return io.ReadAll(resp.Body)
}

// ───────── HoYoPlay (HYP) Game Content API ─────────

type hypContentResp struct {
	Retcode int    `json:"retcode"`
	Message string `json:"message"`
	Data    struct {
		Content struct {
			Banners []struct {
				ID    string `json:"id"`
				Image struct {
					URL  string `json:"url"`
					Link string `json:"link"`
				} `json:"image"`
			} `json:"banners"`
			Posts []struct {
				ID    string `json:"id"`
				Type  string `json:"type"`
				Title string `json:"title"`
				Link  string `json:"link"`
				Date  string `json:"date"` // "MM/DD" — year is implicit
			} `json:"posts"`
		} `json:"content"`
	} `json:"data"`
}

// Map HYP POST_TYPE_X → our internal short type.
var postTypeMap = map[string]string{
	"POST_TYPE_ANNOUNCE": "notice",
	"POST_TYPE_ACTIVITY": "event",
	"POST_TYPE_INFO":     "info",
}

// parseMonthDay turns a "MM/DD" string into a unix timestamp + ISO date.
// HYP drops the year, so we infer: assume current year, but if the resulting
// date is more than a month in the future, treat it as last year (e.g. "12/30"
// returned in January).
func parseMonthDay(s string) (int64, string) {
	if s == "" {
		return 0, ""
	}
	parts := strings.Split(s, "/")
	if len(parts) != 2 {
		return 0, s
	}
	month, err1 := strconv.Atoi(parts[0])
	day, err2 := strconv.Atoi(parts[1])
	if err1 != nil || err2 != nil || month < 1 || month > 12 || day < 1 || day > 31 {
		return 0, s
	}
	now := time.Now()
	year := now.Year()
	candidate := time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.UTC)
	if candidate.Sub(now) > 31*24*time.Hour {
		candidate = candidate.AddDate(-1, 0, 0)
	}
	return candidate.Unix(), candidate.Format("2006-01-02")
}

// GetOfficialNews fetches the HoYoPlay content for HSR (banners + 3-type posts)
// in a single HTTP request. Frontend filters posts by type for each tab.
func (n *NewsService) GetOfficialNews(lang string) (bool, []NewsItem, string) {
	if lang == "" {
		lang = "en-us"
	}

	q := url.Values{}
	q.Set("launcher_id", constant.HSRLauncherID)
	q.Set("game_id", constant.HSRGameID)
	q.Set("language", lang)
	apiURL := constant.HSRLauncherContentURL + "?" + q.Encode()

	body, err := httpGet(apiURL, nil)
	if err != nil {
		return false, nil, err.Error()
	}

	var result hypContentResp
	if err := json.Unmarshal(body, &result); err != nil {
		return false, nil, "parse error: " + err.Error()
	}
	if result.Retcode != 0 {
		return false, nil, fmt.Sprintf("API error %d: %s", result.Retcode, result.Message)
	}

	// Use first banner image as shared cover fallback — posts have no per-item image.
	bannerImg := ""
	if len(result.Data.Content.Banners) > 0 {
		bannerImg = result.Data.Content.Banners[0].Image.URL
	}

	items := make([]NewsItem, 0, len(result.Data.Content.Posts))
	for _, p := range result.Data.Content.Posts {
		ourType, ok := postTypeMap[p.Type]
		if !ok {
			continue
		}
		ts, isoDate := parseMonthDay(p.Date)
		items = append(items, NewsItem{
			ID:        p.ID,
			Title:     stripHTML(p.Title),
			Intro:     "",
			Image:     bannerImg,
			URL:       p.Link,
			Time:      isoDate,
			Timestamp: ts,
			Type:      ourType,
		})
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].Timestamp > items[j].Timestamp
	})

	return true, items, ""
}

// ───────── Custom / Server announcements ─────────

// Gitea API release format (https://docs.gitea.com)
type giteaRelease struct {
	ID          int64  `json:"id"`
	TagName     string `json:"tag_name"`
	Name        string `json:"name"`
	Body        string `json:"body"`
	CreatedAt   string `json:"created_at"`
	PublishedAt string `json:"published_at"`
	HTMLURL     string `json:"html_url"`
	Prerelease  bool   `json:"prerelease"`
	Draft       bool   `json:"draft"`
}

// GetCustomNews fetches markdown announcements from a GitHub repo directory.
// AnnouncementUrl points at /contents/<dir>; each *.md inside becomes a card.
//
// Filename convention: YYYY-MM-DD-slug.md (date prefix used for sorting and
// for the displayed time). An optional YAML-ish frontmatter block at the top
// of each file may override the title:
//
//	---
//	title: 自定义标题
//	---
//	正文 markdown...
//
// Without frontmatter, the slug part of the filename (with dashes turned into
// spaces) is used as the title.
//
// Falls back to the legacy Gitea releases / []NewsItem auto-detection if the
// configured URL doesn't look like a Contents API response — keeps existing
// custom-source deployments working.
func (n *NewsService) GetCustomNews() (bool, []NewsItem, string) {
	src := constant.AnnouncementUrl
	if src == "" {
		return false, nil, "ANNOUNCEMENT_URL_NOT_CONFIGURED"
	}

	body, err := httpGet(src, map[string]string{
		"Accept":     "application/json",
		"User-Agent": "CyreneLauncher/" + constant.CurrentLauncherVersion,
	})
	if err != nil {
		return false, nil, err.Error()
	}

	trimmed := strings.TrimSpace(string(body))

	// GitHub Contents API: array of entries with `download_url`.
	if strings.HasPrefix(trimmed, "[") && strings.Contains(trimmed, "\"download_url\"") {
		var entries []ghContentEntry
		if err := json.Unmarshal(body, &entries); err == nil {
			return true, fetchMarkdownAnnouncements(entries, src), ""
		}
	}

	// Legacy: Gitea release feed.
	if strings.HasPrefix(trimmed, "[") && strings.Contains(trimmed, "\"tag_name\"") {
		var releases []giteaRelease
		if err := json.Unmarshal(body, &releases); err == nil {
			return true, mapGiteaReleases(releases), ""
		}
	}

	// Fall through: assume []NewsItem
	var items []NewsItem
	if err := json.Unmarshal(body, &items); err != nil {
		return false, nil, "unsupported response format: " + err.Error()
	}
	for i := range items {
		items[i].Title = stripHTML(items[i].Title)
		items[i].Intro = stripHTML(items[i].Intro)
		if items[i].Timestamp == 0 && items[i].Time != "" {
			if t, err := time.Parse("2006-01-02", items[i].Time); err == nil {
				items[i].Timestamp = t.Unix()
			}
		}
	}
	sort.Slice(items, func(i, j int) bool {
		return items[i].Timestamp > items[j].Timestamp
	})
	return true, items, ""
}

// ───────── GitHub Contents API markdown announcements ─────────

type ghContentEntry struct {
	Name        string `json:"name"`
	Path        string `json:"path"`
	Type        string `json:"type"`         // "file" / "dir" / "symlink"
	DownloadURL string `json:"download_url"` // null for dirs
	HTMLURL     string `json:"html_url"`
}

// filenameDateRe matches the YYYY-MM-DD prefix used as the sort key + display
// date. Submatches: year, month, day, slug.
var filenameDateRe = regexp.MustCompile(`^(\d{4})-(\d{2})-(\d{2})-(.+?)\.md$`)

// fetchMarkdownAnnouncements pulls every *.md file referenced by entries in
// parallel (raw.githubusercontent.com doesn't count against the API rate
// limit) and turns each into a NewsItem.
func fetchMarkdownAnnouncements(entries []ghContentEntry, sourceURL string) []NewsItem {
	type fetched struct {
		entry ghContentEntry
		body  []byte
	}

	jobs := make([]ghContentEntry, 0, len(entries))
	for _, e := range entries {
		if e.Type == "file" && strings.HasSuffix(strings.ToLower(e.Name), ".md") && e.DownloadURL != "" {
			jobs = append(jobs, e)
		}
	}

	results := make([]fetched, len(jobs))
	var wg sync.WaitGroup
	for i, e := range jobs {
		wg.Add(1)
		go func(i int, e ghContentEntry) {
			defer wg.Done()
			body, err := httpGet(e.DownloadURL, map[string]string{
				"User-Agent": "CyreneLauncher/" + constant.CurrentLauncherVersion,
			})
			if err != nil {
				return
			}
			results[i] = fetched{entry: e, body: body}
		}(i, e)
	}
	wg.Wait()

	items := make([]NewsItem, 0, len(results))
	for _, r := range results {
		if r.body == nil {
			continue
		}
		items = append(items, markdownToNewsItem(r.entry, r.body, sourceURL))
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].Timestamp > items[j].Timestamp
	})
	return items
}

func markdownToNewsItem(entry ghContentEntry, body []byte, sourceURL string) NewsItem {
	meta, content := parseFrontmatter(string(body))

	// Date + slug from filename (YYYY-MM-DD-slug.md).
	var ts int64
	var dateStr, slug string
	if m := filenameDateRe.FindStringSubmatch(entry.Name); m != nil {
		if t, err := time.Parse("2006-01-02", fmt.Sprintf("%s-%s-%s", m[1], m[2], m[3])); err == nil {
			ts = t.Unix()
			dateStr = t.Format("2006-01-02")
		}
		slug = m[4]
	} else {
		slug = strings.TrimSuffix(entry.Name, path.Ext(entry.Name))
	}

	title := strings.TrimSpace(meta["title"])
	if title == "" {
		title = strings.ReplaceAll(slug, "-", " ")
	}

	url := entry.HTMLURL
	if url == "" {
		url = sourceURL
	}

	return NewsItem{
		ID:        entry.Path,
		Title:     title,
		Intro:     stripMarkdown(content),
		Image:     strings.TrimSpace(meta["image"]),
		URL:       url,
		Time:      dateStr,
		Timestamp: ts,
		Type:      "",
	}
}

// parseFrontmatter reads an optional YAML-ish header delimited by `---` lines.
// Only flat `key: value` pairs are recognised — good enough for title/image.
var utf8BOM = string([]byte{0xEF, 0xBB, 0xBF})

func parseFrontmatter(src string) (map[string]string, string) {
	meta := map[string]string{}
	src = strings.TrimPrefix(src, utf8BOM)
	lines := strings.SplitN(src, "\n", 2)
	if len(lines) < 2 || strings.TrimSpace(lines[0]) != "---" {
		return meta, src
	}
	rest := lines[1]
	end := strings.Index(rest, "\n---")
	if end < 0 {
		return meta, src
	}
	header := rest[:end]
	body := strings.TrimPrefix(rest[end+len("\n---"):], "\n")
	body = strings.TrimPrefix(body, "\r\n")
	for _, line := range strings.Split(header, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		colon := strings.Index(line, ":")
		if colon < 0 {
			continue
		}
		key := strings.TrimSpace(line[:colon])
		val := strings.TrimSpace(line[colon+1:])
		val = strings.Trim(val, `"'`)
		meta[key] = val
	}
	return meta, body
}

func mapGiteaReleases(releases []giteaRelease) []NewsItem {
	items := make([]NewsItem, 0, len(releases))
	for _, r := range releases {
		if r.Draft {
			continue
		}
		title := r.Name
		if strings.TrimSpace(title) == "" {
			title = r.TagName
		}
		publishedAt := r.PublishedAt
		if publishedAt == "" {
			publishedAt = r.CreatedAt
		}
		var ts int64
		var timeStr string
		if t, err := time.Parse(time.RFC3339, publishedAt); err == nil {
			ts = t.Unix()
			timeStr = t.Format("2006-01-02")
		}
		items = append(items, NewsItem{
			ID:        fmt.Sprintf("%d", r.ID),
			Title:     title,
			Intro:     stripMarkdown(r.Body),
			Image:     "",
			URL:       r.HTMLURL,
			Time:      timeStr,
			Timestamp: ts,
			Type:      "",
		})
	}
	sort.Slice(items, func(i, j int) bool {
		return items[i].Timestamp > items[j].Timestamp
	})
	return items
}
