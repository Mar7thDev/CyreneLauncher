import useLauncherStore from "@/stores/launcherStore";
import { AppService,  } from "@bindings/cyrene-launcher/internal/app-service";
import { toast } from "react-toastify";
import { sleep } from "./sleep";
import { GitService } from "@bindings/cyrene-launcher/internal/git-service";

export async function CheckUpdateLauncher(): Promise<{ isUpdate: boolean; isExists: boolean; version: string }> {
    const [currentOk, currentVersion] = await AppService.GetCurrentLauncherVersion()
    if (!currentOk) {
        toast.error("Launcher error: cannot get current version")
        return { isUpdate: false, isExists: true, version: "" }
    }

    const [latestOk, latestVersion, latestError] = await GitService.GetLatestLauncherVersion()
    if (!latestOk) {
        toast.error("Launcher error: " + latestError)
        return { isUpdate: false, isExists: true, version: currentVersion }
    }

    const isUpdate = compareLauncherVersions(latestVersion, currentVersion) > 0
    return { isUpdate, isExists: true, version: latestVersion }
}

function compareLauncherVersions(remoteVersion: string, localVersion: string): number {
    const remote = parseLauncherVersion(remoteVersion)
    const local = parseLauncherVersion(localVersion)

    if (!remote || !local) {
        return normalizeVersion(remoteVersion).localeCompare(normalizeVersion(localVersion), undefined, { numeric: true })
    }

    for (let i = 0; i < Math.max(remote.length, local.length); i++) {
        const diff = (remote[i] ?? 0) - (local[i] ?? 0)
        if (diff !== 0) return diff
    }

    return 0
}

function parseLauncherVersion(version: string): number[] | null {
    const normalized = normalizeVersion(version)
    const match = normalized.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[.-].*)?$/)
    if (!match) return null

    return match.slice(1).filter(Boolean).map(Number)
}

function normalizeVersion(version: string): string {
    return version.trim().replace(/^v/i, "")
}


export async function UpdateLauncher(launcherVersion: string) : Promise<void> {
    const {setDownloadType } = useLauncherStore.getState()
    setDownloadType("update:launcher:downloading")
    const [ok, error] = await GitService.UpdateLauncherProgress(launcherVersion)
    if (ok) {
        setDownloadType("update:launcher:success")
        AppService.CloseAppAfterTimeout(5)
        await sleep(5000)
    } else {
        toast.error(error)
        setDownloadType("update:launcher:failed")
    }
}
