package newsService

import (
	"cyrene-launcher/pkg/constant"
	"encoding/json"
	"fmt"
	"html"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"sort"
	"strconv"
	"strings"
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
	Pinned    bool   `json:"pinned"`    // server announcements only
}

// ───────── shared helpers ─────────

var (
	htmlTagRe    = regexp.MustCompile(`<[^>]*>`)
	whitespaceRe = regexp.MustCompile(`\s+`)
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

// GetCustomNews fetches server announcements from the Cyrene website API
// (constant.AnnouncementUrl), which returns a plain []NewsItem array with
// pinned posts first.
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
	sort.SliceStable(items, func(i, j int) bool {
		if items[i].Pinned != items[j].Pinned {
			return items[i].Pinned
		}
		return items[i].Timestamp > items[j].Timestamp
	})
	return true, items, ""
}
