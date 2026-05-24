package models

type ReleaseType struct {
	ID              int         `json:"id"`
	TagName         string      `json:"tag_name"`
	TargetCommitish string      `json:"target_commitish"`
	Name            string      `json:"name"`
	Body            string      `json:"body"`
	URL             string      `json:"url"`
	HTMLURL         string      `json:"html_url"`
	TarballURL      string      `json:"tarball_url"`
	ZipballURL      string      `json:"zipball_url"`
	UploadURL       string      `json:"upload_url"`
	Draft           bool        `json:"draft"`
	Prerelease      bool        `json:"prerelease"`
	CreatedAt       string      `json:"created_at"`
	PublishedAt     string      `json:"published_at"`
	Author          AuthorType  `json:"author"`
	Assets          []AssetType `json:"assets"`
}

type AuthorType struct {
	ID                int    `json:"id"`
	Login             string `json:"login"`
	LoginName         string `json:"login_name"`
	SourceID          int    `json:"source_id"`
	FullName          string `json:"full_name"`
	Email             string `json:"email"`
	AvatarURL         string `json:"avatar_url"`
	HTMLURL           string `json:"html_url"`
	Language          string `json:"language"`
	IsAdmin           bool   `json:"is_admin"`
	LastLogin         string `json:"last_login"`
	Created           string `json:"created"`
	Restricted        bool   `json:"restricted"`
	Active            bool   `json:"active"`
	ProhibitLogin     bool   `json:"prohibit_login"`
	Location          string `json:"location"`
	Website           string `json:"website"`
	Description       string `json:"description"`
	Visibility        string `json:"visibility"`
	FollowersCount    int    `json:"followers_count"`
	FollowingCount    int    `json:"following_count"`
	StarredReposCount int    `json:"starred_repos_count"`
	Username          string `json:"username"`
}

type AssetType struct {
	ID                 int    `json:"id"`
	Name               string `json:"name"`
	Size               int    `json:"size"`
	DownloadCount      int    `json:"download_count"`
	CreatedAt          string `json:"created_at"`
	UUID               string `json:"uuid"`
	BrowserDownloadURL string `json:"browser_download_url"`
}
