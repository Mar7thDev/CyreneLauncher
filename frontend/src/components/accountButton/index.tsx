import { useEffect } from "react";
import { CircleUserRound, ExternalLink, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Events } from "@wailsio/runtime";
import { AccountService } from "@bindings/cyrene-launcher/internal/account-service";
import useAccountStore from "@/stores/accountStore";

export default function AccountButton() {
    const { t } = useTranslation()
    const { user, pending, setUser, setPending } = useAccountStore()

    useEffect(() => {
        // Restore the persisted session on app start.
        AccountService.GetProfile()
            .then(([ok, profile]) => { if (ok) setUser(profile) })
            .catch(() => { })

        Events.On("account:login:success", (event: any) => {
            setUser(event.data?.user ?? event.data)
            toast.success(t("account.login_success"))
        })
        Events.On("account:login:failed", () => {
            setPending(false)
            toast.error(t("account.login_failed"))
        })
        Events.On("account:logout", () => {
            setUser(null)
            toast.info(t("account.logged_out"))
        })
        return () => {
            Events.Off("account:login:success")
            Events.Off("account:login:failed")
            Events.Off("account:logout")
        }
    }, [])

    const handleLogin = async () => {
        try {
            const [ok, err] = await AccountService.StartLogin()
            if (!ok) { toast.error(t("account.login_failed") + (err ? ": " + err : "")); return }
            setPending(true)
        } catch (e: any) {
            toast.error(t("account.login_failed") + ": " + e)
        }
    }

    const handleCancel = async () => {
        try { await AccountService.CancelLogin() } catch { }
        setPending(false)
    }

    const handleLogout = async () => {
        try { await AccountService.Logout() } catch { }
        setUser(null)
    }

    const openProfile = async () => {
        const base = await AccountService.GetWebBaseURL()
        const { AppService } = await import("@bindings/cyrene-launcher/internal/app-service")
        await AppService.OpenURL(base + "/profile")
    }

    if (pending) {
        return (
            <div className="tooltip tooltip-bottom" data-tip={t("account.waiting")}>
                <button
                    onClick={handleCancel}
                    className="btn btn-ghost btn-circle hover:bg-pink-100 transition-colors"
                >
                    <span className="loading loading-spinner loading-sm text-pink-500" />
                </button>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="tooltip tooltip-bottom" data-tip={t("account.sign_in")}>
                <button
                    onClick={handleLogin}
                    className="btn btn-ghost btn-circle hover:bg-pink-100 hover:text-pink-600 transition-colors"
                >
                    <CircleUserRound className="w-5 h-5" />
                </button>
            </div>
        )
    }

    return (
        <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-8 rounded-full ring-2 ring-pink-200">
                    <img
                        src={user.image || "/appicon.png"}
                        alt={user.name}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/appicon.png" }}
                    />
                </div>
            </div>
            <ul tabIndex={0} className="menu dropdown-content bg-white/95 backdrop-blur-xl border border-pink-100 rounded-xl z-52 mt-3 w-48 p-2 shadow-xl">
                <li className="menu-title truncate">{user.name}</li>
                <li>
                    <button onClick={openProfile} className="flex items-center gap-2">
                        <ExternalLink size={15} /> {t("account.profile")}
                    </button>
                </li>
                <li>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-error">
                        <LogOut size={15} /> {t("account.sign_out")}
                    </button>
                </li>
            </ul>
        </div>
    )
}
