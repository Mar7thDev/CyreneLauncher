import useLauncherStore from "@/stores/launcherStore";
import { AppService,  } from "@bindings/firefly-launcher/internal/app-service";
import { toast } from "react-toastify";
import { sleep } from "./sleep";
import { GitService } from "@bindings/firefly-launcher/internal/git-service";

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

    const isUpdate = latestVersion !== currentVersion
    return { isUpdate, isExists: true, version: latestVersion }
}


export async function UpdateLauncher(launcherVersion: string) : Promise<void> {
    const {setDownloadType } = useLauncherStore.getState()
    setDownloadType("update:launcher:downloading")
    const [ok, error] = await GitService.UpdateLauncherProgress(launcherVersion)
    if (ok) {
        setDownloadType("update:launcher:success")

    } else {
        toast.error(error)
        setDownloadType("update:launcher:failed")
    }
    AppService.CloseAppAfterTimeout(5)
    await sleep(5000)
}