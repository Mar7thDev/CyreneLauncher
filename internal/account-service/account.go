// Package accountService links the launcher to a Cyrene website account via
// an OAuth-style device flow:
//
//  1. StartLogin requests a device code from the website and opens the
//     verification page in the system browser (OAuth providers don't allow
//     embedded webviews).
//  2. A background goroutine polls the token endpoint until the user approves
//     the device on the website, then stores the launcher token encrypted on
//     disk (DPAPI) and emits "account:login:success".
//  3. While logged in, a heartbeat ticker reports the launcher version and OS
//     so the website can show online status. A 401/403 response (revoked or
//     banned) clears the local token and emits "account:logout".
package accountService

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"runtime"
	"strings"
	"sync"
	"time"

	"cyrene-launcher/pkg/constant"

	"github.com/wailsapp/wails/v3/pkg/application"
)

const heartbeatInterval = 4 * time.Minute

type Profile struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Image string `json:"image"`
	Role  string `json:"role"`
}

type AccountService struct {
	baseURL string
	client  *http.Client

	mu          sync.Mutex
	token       string
	profile     *Profile
	cancelLogin chan struct{}
	stopBeat    chan struct{}
}

func New(baseURL string) *AccountService {
	return &AccountService{
		baseURL: baseURL,
		client: &http.Client{Timeout: 15 * time.Second, CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
			return http.ErrUseLastResponse
		}},
	}
}

// GetWebBaseURL lets the frontend build website links (profile page etc.).
func (a *AccountService) GetWebBaseURL() string {
	return a.baseURL
}

type loginResult struct {
	Token string  `json:"token"`
	User  Profile `json:"user"`
	Error string  `json:"error"`
}

// LoginWithPassword authenticates against the account website, never the selected game server.
func (a *AccountService) LoginWithPassword(identifier, password string) (bool, Profile, string) {
	identifier = strings.TrimSpace(identifier)
	if identifier == "" || password == "" {
		return false, Profile{}, "bad_credentials"
	}
	if a.baseURL != constant.WebBaseURL {
		return false, Profile{}, "invalid_origin"
	}
	attempt := a.beginLogin()
	if attempt == nil {
		return false, Profile{}, "busy"
	}
	defer a.finishLogin(attempt)
	host, _ := os.Hostname()
	var res loginResult
	status, err := a.doJSON("POST", "/api/launcher/login", "", map[string]string{
		"identifier": identifier, "password": password, "hostname": host, "device_id": deviceID(),
	}, &res)
	if err != nil {
		return false, Profile{}, "offline"
	}
	if status != http.StatusOK {
		switch res.Error {
		case "bad_credentials", "rate_limited", "account_banned", "account_pending":
			return false, Profile{}, res.Error
		}
		return false, Profile{}, "failed"
	}
	if !a.acceptLogin(attempt, res) {
		return false, Profile{}, "failed"
	}
	return true, res.User, ""
}

func (a *AccountService) IsLoggedIn() bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.profile != nil
}

// ServerToken returns the persisted launcher token for a launcher-managed local March7thHoney server.
func (a *AccountService) ServerToken() string {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.token == "" {
		a.token, _ = loadToken()
	}
	return a.token
}

// DeviceID exposes the machine fingerprint so the local server presents the same device identity to the backend.
func (a *AccountService) DeviceID() string {
	return deviceID()
}

// GetProfile validates the stored token against the website and returns the
// account profile. Called on app start to restore the session.
func (a *AccountService) GetProfile() (bool, Profile, string) {
	a.mu.Lock()
	if a.profile != nil {
		p := *a.profile
		a.mu.Unlock()
		return true, p, ""
	}
	if a.token == "" {
		a.token, _ = loadToken()
	}
	token := a.token
	a.mu.Unlock()

	if token == "" {
		return false, Profile{}, ""
	}

	var resp struct {
		User Profile `json:"user"`
	}
	status, err := a.doJSON("GET", "/api/launcher/me", token, nil, &resp)
	if err != nil {
		return false, Profile{}, err.Error()
	}
	if status == http.StatusUnauthorized || status == http.StatusForbidden {
		a.clearSession()
		return false, Profile{}, ""
	}
	if status != http.StatusOK {
		return false, Profile{}, fmt.Sprintf("HTTP %d", status)
	}

	a.mu.Lock()
	a.profile = &resp.User
	a.mu.Unlock()
	a.startHeartbeat()
	return true, resp.User, ""
}

// StartLogin begins the device flow and returns once the browser is opened.
// The result arrives via the "account:login:success" / "account:login:failed"
// events.
func (a *AccountService) StartLogin() (bool, string) {
	cancel := a.beginLogin()
	if cancel == nil {
		return false, "login already in progress"
	}

	hostname, _ := os.Hostname()
	var code struct {
		DeviceCode      string `json:"device_code"`
		UserCode        string `json:"user_code"`
		VerificationURI string `json:"verification_uri_complete"`
		ExpiresIn       int    `json:"expires_in"`
		Interval        int    `json:"interval"`
		Error           string `json:"error"`
	}
	status, err := a.doJSON("POST", "/api/launcher/device/code", "", map[string]string{
		"version":   constant.CurrentLauncherVersion,
		"os":        runtime.GOOS,
		"hostname":  hostname,
		"device_id": deviceID(),
	}, &code)
	if err != nil || status != http.StatusOK {
		a.finishLogin(cancel)
		if err != nil {
			return false, err.Error()
		}
		if code.Error != "" {
			return false, code.Error
		}
		return false, fmt.Sprintf("HTTP %d", status)
	}

	approval, err := url.Parse(code.VerificationURI)
	if err != nil || approval.Scheme != "https" || approval.Host != constant.WebHost || approval.User != nil ||
		approval.Path != "/activate" || code.DeviceCode == "" {
		a.finishLogin(cancel)
		return false, "invalid approval response"
	}
	application.Get().Browser.OpenURL(approval.String())
	go a.pollToken(code.DeviceCode, code.Interval, code.ExpiresIn, cancel)
	return true, ""
}

func (a *AccountService) CancelLogin() {
	a.mu.Lock()
	if a.cancelLogin != nil {
		close(a.cancelLogin)
		a.cancelLogin = nil
	}
	a.mu.Unlock()
}

func (a *AccountService) Logout() (bool, string) {
	a.mu.Lock()
	token := a.token
	a.mu.Unlock()
	if token != "" {
		// Best effort — the local session is cleared regardless.
		a.doJSON("POST", "/api/launcher/logout", token, struct{}{}, nil)
	}
	a.clearSession()
	return true, ""
}

func (a *AccountService) pollToken(deviceCode string, interval, expiresIn int, cancel chan struct{}) {
	defer a.finishLogin(cancel)
	if interval <= 0 {
		interval = 5
	}
	deadline := time.Now().Add(time.Duration(expiresIn) * time.Second)
	ticker := time.NewTicker(time.Duration(interval) * time.Second)
	defer ticker.Stop()

	fail := func(reason string) {
		application.Get().Event.Emit("account:login:failed", map[string]string{"error": reason})
	}

	for {
		select {
		case <-cancel:
			return
		case <-ticker.C:
		}
		if time.Now().After(deadline) {
			fail("expired")
			return
		}

		var resp loginResult
		status, err := a.doJSON("POST", "/api/launcher/device/token", "", map[string]string{
			"device_code": deviceCode,
		}, &resp)
		if err != nil {
			continue // transient network error — keep polling
		}

		switch {
		case status == http.StatusOK && resp.Token != "":
			if a.acceptLogin(cancel, resp) {
				application.Get().Event.Emit("account:login:success", map[string]any{"user": resp.User})
			}
			return
		case resp.Error == "authorization_pending" || resp.Error == "slow_down":
			continue
		default:
			fail(resp.Error)
			return
		}
	}
}

func (a *AccountService) beginLogin() chan struct{} {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.cancelLogin != nil {
		return nil
	}
	a.cancelLogin = make(chan struct{})
	return a.cancelLogin
}

func (a *AccountService) finishLogin(attempt chan struct{}) {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.cancelLogin == attempt {
		a.cancelLogin = nil
	}
}

func (a *AccountService) acceptLogin(attempt chan struct{}, result loginResult) bool {
	a.mu.Lock()
	if a.cancelLogin != attempt || result.User.ID == "" || result.Token == "" {
		a.mu.Unlock()
		return false
	}
	a.token, a.profile = result.Token, &result.User
	if err := saveToken(result.Token); err != nil {
		fmt.Println("account: could not persist device session")
	}
	a.mu.Unlock()
	a.startHeartbeat()
	return true
}

func (a *AccountService) startHeartbeat() {
	a.mu.Lock()
	if a.stopBeat != nil {
		a.mu.Unlock()
		return
	}
	stop := make(chan struct{})
	a.stopBeat = stop
	a.mu.Unlock()

	go func() {
		a.beat()
		ticker := time.NewTicker(heartbeatInterval)
		defer ticker.Stop()
		for {
			select {
			case <-stop:
				return
			case <-ticker.C:
				a.beat()
			}
		}
	}()
}

func (a *AccountService) beat() {
	a.mu.Lock()
	token := a.token
	a.mu.Unlock()
	if token == "" {
		return
	}
	status, err := a.doJSON("POST", "/api/launcher/heartbeat", token, map[string]string{
		"version":   constant.CurrentLauncherVersion,
		"os":        runtime.GOOS,
		"device_id": deviceID(),
	}, nil)
	if err != nil {
		return
	}
	if status == http.StatusUnauthorized || status == http.StatusForbidden {
		a.clearSession()
		application.Get().Event.Emit("account:logout")
	}
}

func (a *AccountService) clearSession() {
	a.mu.Lock()
	a.token = ""
	a.profile = nil
	if a.stopBeat != nil {
		close(a.stopBeat)
		a.stopBeat = nil
	}
	a.mu.Unlock()
	clearToken()
}

// doJSON sends a JSON request and decodes the JSON response (if out != nil).
// The HTTP status is returned for non-2xx handling; decode errors on error
// bodies are ignored.
func (a *AccountService) doJSON(method, path, token string, in, out any) (int, error) {
	var body *bytes.Reader
	if in != nil {
		data, err := json.Marshal(in)
		if err != nil {
			return 0, err
		}
		body = bytes.NewReader(data)
	} else {
		body = bytes.NewReader(nil)
	}

	req, err := http.NewRequest(method, a.baseURL+path, body)
	if err != nil {
		return 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "CyreneLauncher/"+constant.CurrentLauncherVersion)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := a.client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	if out != nil {
		_ = json.NewDecoder(resp.Body).Decode(out)
	}
	return resp.StatusCode, nil
}
