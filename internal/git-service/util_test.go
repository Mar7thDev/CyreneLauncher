package gitService

import (
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
