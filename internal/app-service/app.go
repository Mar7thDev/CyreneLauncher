package appService

import (
	"firefly-launcher/pkg/constant"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type AppService struct{}

func (a *AppService) GetCurrentLauncherVersion() (bool, string) {
	return true, constant.CurrentLauncherVersion
}

func (a *AppService) CloseAppAfterTimeout(timeout int) (bool, string) {
	go func() {
		time.Sleep(time.Duration(timeout) * time.Second)
		application.Get().Quit()
	}()
	return true, ""
}

func (a *AppService) CloseApp() (bool, string) {
	application.Get().Quit()
	return true, ""
}

func (a *AppService) HideApp() (bool, string) {
	window := application.Get().Window.Current()
	if window == nil {
		return false, "not found window"
	}
	window.Hide()
	return true, ""
}

func (a *AppService) MinimizeApp() (bool, string) {
	window := application.Get().Window.Current()
	if window == nil {
		return false, "not found window"
	}
	window.Minimise()
	return true, ""
}

func (a *AppService) MaximizeApp() (bool, string) {
	window := application.Get().Window.Current()
	if window == nil {
		return false, "not found window"
	}
	window.Maximise()
	return true, ""
}

func (a *AppService) RestoreApp() (bool, string) {
	window := application.Get().Window.Current()
	if window == nil {
		return false, "not found window"
	}
	window.Restore()
	return true, ""
}

func (a *AppService) OpenURL(url string) (bool, string) {
	if url == "" {
		return false, "empty url"
	}
	application.Get().Browser.OpenURL(url)
	return true, ""
}
