package consoleService

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// ConsoleService talks to a March7thHoney server's /console/* endpoints so the
// launcher can run in-game commands and self-reset without opening the chat.
// Authentication is per-player (UID + password), same as in-game chat.
type ConsoleService struct{}

const defaultServerURL = "https://march7th.hoyotoon.com"

type execRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Command  string `json:"command"`
}

type selfResetRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Confirm  bool   `json:"confirm"`
}

type execResponse struct {
	Retcode int    `json:"retcode"`
	Message string `json:"message"`
	Output  string `json:"output"`
}

func postJSON(serverURL, path string, payload any) (bool, string, string) {
	base := strings.TrimRight(strings.TrimSpace(serverURL), "/")
	if base == "" {
		base = defaultServerURL
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return false, "", err.Error()
	}

	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequest("POST", base+path, bytes.NewReader(body))
	if err != nil {
		return false, "", err.Error()
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return false, "", err.Error()
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)

	var parsed execResponse
	if jsonErr := json.Unmarshal(raw, &parsed); jsonErr != nil {
		msg := strings.TrimSpace(string(raw))
		if msg == "" {
			msg = fmt.Sprintf("HTTP %d", resp.StatusCode)
		}
		return false, "", msg
	}

	if parsed.Retcode != 0 {
		return false, "", parsed.Message
	}
	return true, parsed.Output, ""
}

// Execute POSTs a command to the server and returns (ok, output, error).
// An empty command performs a credential check only (used by "Connect").
func (c *ConsoleService) Execute(serverURL string, uid int, password string, command string) (bool, string, string) {
	return postJSON(serverURL, "/console/exec", execRequest{
		Username: strconv.Itoa(uid),
		Password: password,
		Command:  command,
	})
}

// SelfReset wipes the authenticated player's own gameplay data (account kept).
// Destructive — the caller must confirm with the user first.
func (c *ConsoleService) SelfReset(serverURL string, uid int, password string) (bool, string, string) {
	return postJSON(serverURL, "/console/self-reset", selfResetRequest{
		Username: strconv.Itoa(uid),
		Password: password,
		Confirm:  true,
	})
}
