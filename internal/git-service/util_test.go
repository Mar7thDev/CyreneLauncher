package gitService

import (
	"cyrene-launcher/pkg/constant"
	"cyrene-launcher/pkg/models"
	"testing"
)

func TestOrdinaryReleaseSkipsDraftsAndPrereleases(t *testing.T) {
	const asset = "cyrene-launcher.exe"
	releases := []*models.ReleaseType{
		{TagName: "1.2.0-beta", Prerelease: true, Assets: []models.AssetType{{Name: asset}}},
		{TagName: "1.1.9", Draft: true, Assets: []models.AssetType{{Name: asset}}},
		{TagName: "1.1.8", Assets: []models.AssetType{{Name: "other.zip"}}},
		{TagName: "1.1.7", Assets: []models.AssetType{{Name: asset}}},
	}

	tag, ok := findLatestReleaseTagWithAsset(releases, asset, isOrdinaryRelease)
	if !ok || tag != "1.1.7" {
		t.Fatalf("selected %q (ok=%t), want 1.1.7", tag, ok)
	}
}

func TestHoneyChannelsSelectOnlyTheirOwnReleases(t *testing.T) {
	releases := []*models.ReleaseType{
		{TagName: "prod-1.0.13", Prerelease: true, Assets: []models.AssetType{{Name: constant.HoneyServerAsset}}},
		{TagName: "1.0.15", Assets: []models.AssetType{{Name: constant.HoneyServerAsset}}},
		{TagName: "canary-1.0.16", Prerelease: true, Assets: []models.AssetType{{Name: constant.HoneyServerAsset}}},
		{TagName: "1.0.14", Draft: true, Assets: []models.AssetType{{Name: constant.HoneyServerAsset}}},
	}

	testTag, ok := findLatestReleaseTagWithAsset(releases, constant.HoneyServerAsset, isOrdinaryRelease)
	if !ok || testTag != "1.0.15" {
		t.Fatalf("test channel selected %q (ok=%t), want 1.0.15", testTag, ok)
	}

	prodTag, ok := findLatestReleaseTagWithAsset(releases, constant.HoneyServerAsset, isHoneyProductionRelease)
	if !ok || prodTag != "prod-1.0.13" {
		t.Fatalf("production channel selected %q (ok=%t), want prod-1.0.13", prodTag, ok)
	}
}

func TestHoneyProductionChannelRequiresProdPrerelease(t *testing.T) {
	releases := []*models.ReleaseType{
		{TagName: "1.0.15", Assets: []models.AssetType{{Name: constant.HoneyServerAsset}}},
		{TagName: "canary-1.0.16", Prerelease: true, Assets: []models.AssetType{{Name: constant.HoneyServerAsset}}},
		{TagName: "prod-1.0.14", Assets: []models.AssetType{{Name: constant.HoneyServerAsset}}},
	}

	if tag, ok := findLatestReleaseTagWithAsset(releases, constant.HoneyServerAsset, isHoneyProductionRelease); ok || tag != "" {
		t.Fatalf("production channel selected %q (ok=%t), want no release", tag, ok)
	}
}
