package gitService

import (
	"cyrene-launcher/pkg/constant"
	"cyrene-launcher/pkg/models"
	"testing"
)

func TestReleaseChannelsSelectOnlyTheirOwnAssets(t *testing.T) {
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

func TestProductionChannelRequiresProdPrerelease(t *testing.T) {
	releases := []*models.ReleaseType{
		{TagName: "1.0.15", Assets: []models.AssetType{{Name: constant.HoneyServerAsset}}},
		{TagName: "canary-1.0.16", Prerelease: true, Assets: []models.AssetType{{Name: constant.HoneyServerAsset}}},
		{TagName: "prod-1.0.14", Assets: []models.AssetType{{Name: constant.HoneyServerAsset}}},
	}

	if tag, ok := findLatestReleaseTagWithAsset(releases, constant.HoneyServerAsset, isHoneyProductionRelease); ok || tag != "" {
		t.Fatalf("production channel selected %q (ok=%t), want no release", tag, ok)
	}
}
