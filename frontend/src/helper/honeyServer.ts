import useLauncherStore from '@/stores/launcherStore';
import useSettingStore from '@/stores/settingStore';
import { FSService } from '@bindings/cyrene-launcher/internal/fs-service';
import { GitService } from '@bindings/cyrene-launcher/internal/git-service';
import { toast } from 'react-toastify';

const HONEY_SERVER_SOURCE = "honey"

export const HONEY_SERVER_ROOT = "./server"
export const HONEY_SERVER_EXE = `${HONEY_SERVER_ROOT}/March7thHoney.exe`

export async function CheckUpdateHoneyServer(
    honeyServerVersion: string
): Promise<{ isUpdate: boolean; isExists: boolean; version: string }> {
    const isExists = await FSService.FileExists(HONEY_SERVER_EXE)
    let ok = false
    let latestVersion = ""
    let error = ""
    try {
        ;[ok, latestVersion, error] = await GitService.GetLatestServerVersion(HONEY_SERVER_SOURCE)
    } catch (err: any) {
        error = String(err)
    }

    if (!ok) {
        toast.error("Local server error: " + error)
        return { isUpdate: false, isExists, version: honeyServerVersion }
    }

    const isUpdate = isExists && latestVersion !== honeyServerVersion
    return { isUpdate, isExists, version: latestVersion }
}

export async function UpdateHoneyServer(serverVersion: string): Promise<boolean> {
    const { setDownloadType } = useLauncherStore.getState()
    const { setHoneyServerVersion } = useSettingStore.getState()

    setDownloadType("Downloading local server...")
    const [ok, error] = await GitService.DownloadServerProgress(HONEY_SERVER_SOURCE, serverVersion)
    if (!ok) {
        toast.error(error)
        setDownloadType("Download local server failed")
        return false
    }

    setDownloadType("Deploying local server...")
    await GitService.UnzipServer()
    const deployed = await FSService.FileExists(HONEY_SERVER_EXE)
    if (!deployed) {
        toast.error("Local server was downloaded, but March7thHoney.exe was not found after deployment.")
        setDownloadType("Deploy local server failed")
        return false
    }

    setHoneyServerVersion(serverVersion)
    setDownloadType("Download local server successfully")
    return true
}
