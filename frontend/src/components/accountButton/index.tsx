import { ExternalLink, LogIn, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AccountService } from "@bindings/cyrene-launcher/internal/account-service";
import useAccountStore from "@/stores/accountStore";
import { launcherConfig } from "@/config/launcher";

// Avatar dropdown in the header. Session restore, login and account events
// all live in LoginGate — by the time this renders, the user is signed in.
export default function AccountButton() {
    const { t } = useTranslation()
    const { user, skipped, setUser, setSkipped } = useAccountStore()
    const brandedChrome = launcherConfig.brandedChrome
    const dropdownPanelClass = brandedChrome
        ? "launcher-dark-panel"
        : "launcher-menu"
    const menuItemClass = brandedChrome
        ? "launcher-panel-hover"
        : ""

    const handleLogout = async () => {
        try { await AccountService.Logout() } catch { }
        setUser(null)
    }

    const openProfile = async () => {
        const base = await AccountService.GetWebBaseURL()
        const { AppService } = await import("@bindings/cyrene-launcher/internal/app-service")
        await AppService.OpenURL(base + "/profile")
    }

    // Skipped the gate: offer a way back in.
    if (!user && skipped) return (
        <button onClick={() => setSkipped(false)} className="btn btn-ghost btn-sm gap-1 text-base-content/60">
            <LogIn size={15} /> {t("account.sign_in")}
        </button>
    )

    if (!user) return null

    return (
        <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-8 rounded-full ring-2 launcher-soft-ring">
                    <img
                        src={user.image || launcherConfig.appIcon}
                        alt={user.name}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = launcherConfig.appIcon }}
                    />
                </div>
            </div>
            <ul tabIndex={0} className={`menu dropdown-content ${dropdownPanelClass} rounded-xl z-52 mt-3 w-48 p-2`}>
                <li className="menu-title truncate">{user.name}</li>
                <li>
                    <button onClick={openProfile} className={`flex items-center gap-2 ${menuItemClass}`}>
                        <ExternalLink size={15} /> {t("account.profile")}
                    </button>
                </li>
                <li>
                    <button onClick={handleLogout} className="flex items-center gap-2 launcher-status-text-error">
                        <LogOut size={15} /> {t("account.sign_out")}
                    </button>
                </li>
            </ul>
        </div>
    )
}
