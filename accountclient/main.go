package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"os/exec"
	"path/filepath"
	"strings"

	accountService "cyrene-launcher/internal/account-service"
	appService "cyrene-launcher/internal/app-service"
	"cyrene-launcher/pkg/constant"
	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:ui
var ui embed.FS

type LocalGame struct{}

// Start only the game selected in the native picker, as the current user, with no patches or proxy.
func (*LocalGame) Start() error {
	path, err := application.Get().Dialog.OpenFile().CanChooseFiles(true).
		AddFilter("Star Rail", "StarRail.exe").PromptForSingleSelection()
	if err != nil || path == "" {
		return err
	}
	if !filepath.IsAbs(path) || strings.HasPrefix(path, `\\`) || !strings.EqualFold(filepath.Base(path), "StarRail.exe") {
		return fmt.Errorf("Select a local StarRail.exe")
	}
	game := exec.Command(path)
	game.Dir = filepath.Dir(path)
	if err := game.Start(); err != nil {
		return err
	}
	return game.Process.Release()
}

func main() {
	assets, err := fs.Sub(ui, "ui")
	if err != nil {
		log.Fatal(err)
	}
	app := application.New(application.Options{
		Name: "Cyrene Launcher - Account Edition",
		Services: []application.Service{
			application.NewService(accountService.New(constant.WebBaseURL)),
			application.NewService(&appService.AppService{}), application.NewService(&LocalGame{}),
		},
		Assets: application.AssetOptions{Handler: application.AssetFileServerFS(assets)},
	})
	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title: "Cyrene Launcher " + constant.CurrentLauncherVersion + " - Account Edition",
		Width: 840, Height: 660, URL: "/",
	})
	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
