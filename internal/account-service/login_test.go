//go:build windows

package accountService

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"
	"testing"

	"cyrene-launcher/pkg/constant"
)

type mockTransport func(*http.Request) (*http.Response, error)

func (r mockTransport) RoundTrip(req *http.Request) (*http.Response, error) { return r(req) }

func TestPasswordLogin(t *testing.T) {
	t.Setenv("APPDATA", t.TempDir())
	s := New(constant.WebBaseURL)
	const password = "test-password-only"
	const token = "clt_fixture"
	s.client.Transport = mockTransport(func(r *http.Request) (*http.Response, error) {
		code, body := 200, `{}`
		if r.URL.Host != constant.WebHost || r.URL.Scheme != "https" {
			t.Errorf("unexpected origin")
		}
		switch r.URL.Path {
		case "/api/launcher/login":
			var credentials map[string]string
			if err := json.NewDecoder(r.Body).Decode(&credentials); err != nil {
				t.Error(err)
			}
			if credentials["identifier"] != "fixture@example.test" || credentials["device_id"] == "" {
				t.Error("missing identifier/device")
			}
			if credentials["password"] == password {
				body = `{"user":{"id":"fixture","name":"Player"},"token":"` + token + `"}`
			} else {
				code, body = 401, `{"error":"bad_credentials"}`
			}
		case "/api/launcher/me":
			if r.Header.Get("Authorization") != "Bearer "+token {
				t.Error("wrong restore token")
			}
			body = `{"user":{"id":"fixture","name":"Player"}}`
		case "/api/launcher/logout", "/api/launcher/heartbeat":
		default:
			t.Errorf("unexpected path %s", r.URL.Path)
		}
		return &http.Response{StatusCode: code, Header: make(http.Header), Body: io.NopCloser(strings.NewReader(body))}, nil
	})
	if ok, _, err := s.LoginWithPassword("fixture@example.test", "wrong"); ok || err != "bad_credentials" || s.IsLoggedIn() {
		t.Fatal("failed sign-in established session")
	}
	if ok, p, _ := s.LoginWithPassword(" fixture@example.test ", password); !ok || p.ID != "fixture" {
		t.Fatal("correct password refused")
	}
	path, _ := tokenPath()
	raw, err := os.ReadFile(path)
	if err != nil || strings.Contains(string(raw), password) || strings.Contains(string(raw), token) {
		t.Fatal("session not stored safely")
	}
	restarted := New(constant.WebBaseURL)
	restarted.client.Transport = s.client.Transport
	if ok, p, _ := restarted.GetProfile(); !ok || p.ID != "fixture" {
		t.Fatal("could not restore DPAPI session")
	}
	restarted.Logout()
	s.Logout()
	if _, err := os.Stat(path); !os.IsNotExist(err) {
		t.Fatal("logout retained session file")
	}
	if ok, _, _ := New("https://example.invalid").LoginWithPassword("fixture", password); ok {
		t.Fatal("accepted a different origin")
	}
}
