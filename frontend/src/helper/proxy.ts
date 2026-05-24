import useLauncherStore from "@/stores/launcherStore";
import useSettingStore from "@/stores/settingStore";
import { FSService } from "@bindings/firefly-launcher/internal/fs-service";
import { GitService } from "@bindings/firefly-launcher/internal/git-service";
import { toast } from "react-toastify";

const SOURCE_NOT_CONFIGURED = "SOURCE_NOT_CONFIGURED"

export async function CheckUpdateProxy(proxyPath: string, proxyVersion: string) : Promise<{isUpdate: boolean, isExists: boolean, version: string}> {
    const { serverSource } = useSettingStore.getState()
    const [ok, latestVersion, error] = await GitService.GetLatestProxyVersion(serverSource)
    const isExists = await FSService.FileExists(proxyPath)

    if (!ok) {
        if (error === SOURCE_NOT_CONFIGURED) {
            toast.error("Proxy source is not configured (custom mode)")
        } else {
            toast.error("Proxy error: " + error)
        }
        return { isUpdate: false, isExists, version: "" }
    }

    const isUpdate = latestVersion !== proxyVersion
    return { isUpdate, isExists, version: latestVersion }
}

export async function UpdateProxy(proxyVersion: string) : Promise<void> {
    const { setDownloadType } = useLauncherStore.getState()
    const { setProxyPath, setProxyVersion, serverSource } = useSettingStore.getState()
    setDownloadType("Downloading proxy...")
    const [ok, error] = await GitService.DownloadProxyProgress(serverSource, proxyVersion)
    if (ok) {
        setDownloadType("Download proxy successfully")
        setProxyVersion(proxyVersion)
        setProxyPath("./proxy/firefly-go-proxy.exe")
    } else {
        if (error === SOURCE_NOT_CONFIGURED) {
            toast.error("Proxy source is not configured (custom mode)")
        } else {
            toast.error(error)
        }
        setDownloadType("Download proxy failed")
    }
}
