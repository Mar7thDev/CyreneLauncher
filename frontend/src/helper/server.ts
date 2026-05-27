import useLauncherStore from '@/stores/launcherStore';
import useSettingStore from '@/stores/settingStore';
import { FSService } from '@bindings/cyrene-launcher/internal/fs-service';
import { GitService } from '@bindings/cyrene-launcher/internal/git-service';
import { toast } from 'react-toastify';

const SOURCE_NOT_CONFIGURED = "SOURCE_NOT_CONFIGURED"

export async function CheckUpdateServer(
    serverPath: string,
    serverVersion: string
): Promise<{ isUpdate: boolean; isExists: boolean; version: string }> {
    const { serverSource } = useSettingStore.getState()
    const [ok, latestVersion, error] = await GitService.GetLatestServerVersion(serverSource)
    const isExists = await FSService.FileExists(serverPath)

    if (!ok) {
        if (error === SOURCE_NOT_CONFIGURED) {
            toast.error("Server source is not configured (custom mode)")
        } else {
            toast.error("Server error: " + error)
        }
        return { isUpdate: false, isExists, version: "" }
    }

    const isUpdate = latestVersion !== serverVersion
    return { isUpdate, isExists, version: latestVersion }
}


export async function UpdateServer(serverVersion: string) : Promise<void> {
    const { setDownloadType } = useLauncherStore.getState()
    const { setServerPath, setServerVersion, serverSource } = useSettingStore.getState()
    setDownloadType("Downloading server...")
    const [ok, error] = await GitService.DownloadServerProgress(serverSource, serverVersion)
    if (ok) {
        setDownloadType("Unzipping server...")
        GitService.UnzipServer()
        setDownloadType("Download server successfully")
        setServerVersion(serverVersion)
        setServerPath("./server/firefly-go_win.exe")
    } else {
        if (error === SOURCE_NOT_CONFIGURED) {
            toast.error("Server source is not configured (custom mode)")
        } else {
            toast.error(error)
        }
        setDownloadType("Download server failed")
    }
}
