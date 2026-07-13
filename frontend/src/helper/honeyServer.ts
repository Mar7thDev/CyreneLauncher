import useLauncherStore from '@/stores/launcherStore';
import useSettingStore, { type HoneyServerChannel } from '@/stores/settingStore';
import { FSService } from '@bindings/cyrene-launcher/internal/fs-service';
import { GitService } from '@bindings/cyrene-launcher/internal/git-service';
import { toast } from 'react-toastify';

const HONEY_SERVER_SOURCES: Record<HoneyServerChannel, string> = {
    test: "honey_test",
    prod: "honey_prod",
}

export const HONEY_TEST_SERVER_ROOT = "./server"
export const HONEY_PROD_SERVER_ROOT = "./server_prod"

export function honeyServerRoot(channel: HoneyServerChannel): string {
    return channel === "test" ? HONEY_TEST_SERVER_ROOT : HONEY_PROD_SERVER_ROOT
}

export function honeyServerExe(channel: HoneyServerChannel): string {
    return `${honeyServerRoot(channel)}/March7thHoney.exe`
}

export async function CheckUpdateHoneyServer(
    channel: HoneyServerChannel,
    honeyServerVersion: string
): Promise<{ isUpdate: boolean; isExists: boolean; version: string }> {
    const isExists = await FSService.FileExists(honeyServerExe(channel))
    let ok = false
    let latestVersion = ""
    let error = ""
    try {
        ;[ok, latestVersion, error] = await GitService.GetLatestServerVersion(HONEY_SERVER_SOURCES[channel])
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

export async function UpdateHoneyServer(serverVersion: string, channel: HoneyServerChannel): Promise<boolean> {
    const { setDownloadType } = useLauncherStore.getState()
    const { setHoneyTestServerVersion, setHoneyProdServerVersion } = useSettingStore.getState()

    setDownloadType("Downloading local server...")
    const [ok, error] = await GitService.DownloadServerProgress(HONEY_SERVER_SOURCES[channel], serverVersion)
    if (!ok) {
        toast.error(error)
        setDownloadType("Download local server failed")
        return false
    }

    setDownloadType("Deploying local server...")
    await GitService.UnzipServer()
    const deployed = await FSService.FileExists(honeyServerExe(channel))
    if (!deployed) {
        toast.error("Local server was downloaded, but March7thHoney.exe was not found after deployment.")
        setDownloadType("Deploy local server failed")
        return false
    }

    if (channel === "test") setHoneyTestServerVersion(serverVersion)
    else setHoneyProdServerVersion(serverVersion)
    setDownloadType("Download local server successfully")
    return true
}
