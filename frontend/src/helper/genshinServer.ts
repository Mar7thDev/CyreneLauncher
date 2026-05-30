import useLauncherStore from '@/stores/launcherStore';
import useSettingStore from '@/stores/settingStore';
import { FSService } from '@bindings/cyrene-launcher/internal/fs-service';
import { GitService } from '@bindings/cyrene-launcher/internal/git-service';
import { toast } from 'react-toastify';

const GENSHIN_SERVER_SOURCE = "genshin"

export const GENSHIN_SERVER_ROOT = "./server-packages/Columbina-GI"
export const GENSHIN_SERVER_MANIFEST = `${GENSHIN_SERVER_ROOT}/cyrene-manifest.json`
export const GENSHIN_INJECTOR_PATH = `${GENSHIN_SERVER_ROOT}/native/bin/YsrpgInjector.exe`

export async function CheckUpdateGenshinServer(
    genshinServerVersion: string
): Promise<{ isUpdate: boolean; isExists: boolean; version: string }> {
    const isExists = await FSService.FileExists(GENSHIN_SERVER_MANIFEST)
        && await FSService.FileExists(GENSHIN_INJECTOR_PATH)
    let ok = false
    let latestVersion = ""
    let error = ""
    try {
        ;[ok, latestVersion, error] = await GitService.GetLatestServerVersion(GENSHIN_SERVER_SOURCE)
    } catch (err: any) {
        error = String(err)
    }

    if (!ok) {
        toast.error("Genshin server package error: " + error)
        return { isUpdate: false, isExists, version: genshinServerVersion }
    }

    const isUpdate = isExists && latestVersion !== genshinServerVersion
    return { isUpdate, isExists, version: latestVersion }
}

export async function UpdateGenshinServer(serverVersion: string): Promise<boolean> {
    const { setDownloadType } = useLauncherStore.getState()
    const { setGenshinServerDir, setGenshinServerVersion } = useSettingStore.getState()

    setDownloadType("Downloading Genshin server package...")
    const [ok, error] = await GitService.DownloadServerProgress(GENSHIN_SERVER_SOURCE, serverVersion)
    if (!ok) {
        toast.error(error)
        setDownloadType("Download Genshin server package failed")
        return false
    }

    setDownloadType("Deploying Genshin server package...")
    await GitService.UnzipServer()
    const deployed = await FSService.FileExists(GENSHIN_SERVER_MANIFEST)
        && await FSService.FileExists(GENSHIN_INJECTOR_PATH)
    if (!deployed) {
        toast.error("Genshin server package was downloaded, but cyrene-manifest.json was not found after deployment.")
        setDownloadType("Deploy Genshin server package failed")
        return false
    }

    setGenshinServerVersion(serverVersion)
    setGenshinServerDir(GENSHIN_SERVER_ROOT)
    setDownloadType("Download Genshin server package successfully")
    return true
}
