import useLauncherStore from "@/stores/launcherStore";
import useSettingStore, { type GameRegion } from "@/stores/settingStore";
import { FSService } from "@bindings/firefly-launcher/internal/fs-service";
import { GitService } from "@bindings/firefly-launcher/internal/git-service";
import { toast } from "react-toastify";

const SOURCE_NOT_CONFIGURED = "SOURCE_NOT_CONFIGURED"

// Region → on-disk DLL path. Must match constant.PatchDllFileFor in Go.
export function patchDllPathFor(region: GameRegion): string {
    return region === "cn" ? "./patch/Astrolabe_CN.dll" : "./patch/Astrolabe_OS.dll"
}

export async function CheckUpdatePatch(
    region: GameRegion,
    patchDllPath: string,
    patchDllVersion: string
): Promise<{ isUpdate: boolean; isExists: boolean; version: string }> {
    const [ok, latestVersion, error] = await GitService.GetLatestPatchVersion()
    const expectedPath = patchDllPath || patchDllPathFor(region)
    const isExists = !!region && await FSService.FileExists(expectedPath)

    if (!ok) {
        if (error === SOURCE_NOT_CONFIGURED) {
            toast.error("Patch source is not configured")
        } else {
            toast.error("Patch error: " + error)
        }
        return { isUpdate: false, isExists, version: "" }
    }

    const isUpdate = latestVersion !== patchDllVersion
    return { isUpdate, isExists, version: latestVersion }
}

export async function UpdatePatch(region: GameRegion, patchVersion: string): Promise<void> {
    const { setDownloadType } = useLauncherStore.getState()
    const { setPatchDllPath, setPatchDllVersion } = useSettingStore.getState()
    if (!region) {
        toast.error("Cannot download patch: game region is not set")
        return
    }
    setDownloadType("Downloading patch DLL...")
    const [ok, error] = await GitService.DownloadPatchProgress(region, patchVersion)
    if (ok) {
        setDownloadType("Download patch successfully")
        setPatchDllVersion(patchVersion)
        setPatchDllPath(patchDllPathFor(region))
    } else {
        if (error === SOURCE_NOT_CONFIGURED) {
            toast.error("Patch source is not configured")
        } else {
            toast.error(error)
        }
        setDownloadType("Download patch failed")
    }
}
