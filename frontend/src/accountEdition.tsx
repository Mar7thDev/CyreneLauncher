import { createRoot } from "react-dom/client";
import { ToastContainer, toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { AppService } from "@bindings/cyrene-launcher/internal/app-service";
import { LocalGame } from "@bindings/cyrene-launcher/accountclient";
import LoginGate from "@/components/loginGate";
import AccountButton from "@/components/accountButton";
import "./styles/index.css";
import "./i18n";

function AccountEdition() {
    const { i18n } = useTranslation();
    const zh = i18n.language?.startsWith("zh");
    return <main className="grid min-h-screen content-center justify-items-center gap-5 bg-linear-to-br from-pink-50 via-white to-sky-50 px-8 text-center">
        <div className="absolute right-6 top-4"><AccountButton /></div>
        <img alt="" src="/appicon.png" className="size-16 rounded-2xl" />
        <p className="text-xs font-semibold tracking-widest text-pink-700">Cyrene Launcher · Account Edition</p>
        <h1 className="text-3xl font-bold">{zh ? "账号与本地游戏" : "Your account and local game"}</h1>
        <p className="max-w-md text-sm text-base-content/70">{zh ? "账号版只按客户端原有配置启动游戏，不修改游戏或切换服务器。" : "Starts the selected game with its existing configuration. This edition does not patch the game or switch servers."}</p>
        <button className="btn btn-primary" onClick={() => LocalGame.Start().catch(() => toast.error(zh ? "无法启动所选游戏" : "Could not start the selected game"))}>
            {zh ? "选择并启动 StarRail.exe" : "Select and start StarRail.exe"}
        </button>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
            <button className="link" onClick={() => AppService.OpenURL("https://launcher.march7th.cc/profile#bind")}>{zh ? "绑定原游戏账号" : "Link an existing UID"}</button>
            <button className="link" onClick={() => AppService.OpenURL("https://launcher.march7th.cc/docs/lua")}>{zh ? "Lua 使用指南" : "Lua guide"}</button>
        </div>
        <LoginGate /><ToastContainer />
    </main>
}

createRoot(document.getElementById("root")!).render(<AccountEdition />);
