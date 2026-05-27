// useGlobalEvents.ts
import { useEffect } from "react";
import { Events } from "@wailsio/runtime";
import { toast } from "react-toastify";
import useSettingStore from "@/stores/settingStore";
import { AppService } from "@bindings/cyrene-launcher/internal/app-service";
import useModalStore from "@/stores/modalStore";
import useDiffStore from "@/stores/diffStore";
import useLauncherStore from "@/stores/launcherStore";

export function useGlobalEvents() {
    const { setIsOpenCloseModal } = useModalStore()
    const { setGameRunning, setServerRunning, setProxyRunning, setProgressDownload, setDownloadSpeed } = useLauncherStore()
    const { setProgressUpdate, setMaxProgressUpdate, setMessageUpdate, setStageType } = useDiffStore()

    useEffect(() => {
        const onGameExit = () => setGameRunning(false);
        const onServerExit = () => setServerRunning(false);
        const onProxyExit = () => setProxyRunning(false);

        const onDownload = (event: any) => {
            const { percent, speed } = event.data;
            setProgressDownload(Number(percent));
            setDownloadSpeed(speed);
        };

        const onUpdateProgress = (event: any) => {
            console.log(event)
            const { progress, maxProgress } = event.data;
            setProgressUpdate(Number(progress));
            setMaxProgressUpdate(Number(maxProgress));
        };

        const onMessageUpdate = (event: any) => {
            const { message } = event.data;
            setMessageUpdate(message);
        };

        const onStageUpdate = (event: any) => {
            const { stage } = event.data;
            setStageType(stage);
        };

        Events.On("download:server", onDownload);
        Events.On("download:proxy", onDownload);
        Events.On("download:patch", onDownload);
        Events.On("game:exit", onGameExit);
        Events.On("server:exit", onServerExit);
        Events.On("proxy:exit", onProxyExit);
        Events.On("diff:progress", onUpdateProgress);
        Events.On("diff:message", onMessageUpdate);
        Events.On("diff:stage", onStageUpdate);
        Events.On("diff:error", (event: any) => {
            const { message } = event.data;
            toast.error(message);
        });
        Events.On("window:close", async () => {
            const option = useSettingStore.getState().closingOption
            if (option.isAsk) {
                setIsOpenCloseModal(true);
                return
            } 
            if (option.isMinimize) {
                const [success, message] = await AppService.MinimizeApp()
                if (!success) toast.error(message)
            } else {
                const [success, message] = await AppService.CloseApp()
                if (!success) toast.error(message)
            }
        });

        return () => {
            Events.Off("download:server");
            Events.Off("download:proxy");
            Events.Off("download:patch");
            Events.Off("game:exit");
            Events.Off("server:exit");
            Events.Off("proxy:exit");
            Events.Off("diff:progress")
            Events.Off("diff:message");
            Events.Off("diff:stage");
            Events.Off("version:check");
            Events.Off("window:close");
        };
    }, []);
}
