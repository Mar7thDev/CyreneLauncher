import { ExternalLink, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AccountService } from "@bindings/cyrene-launcher/internal/account-service";
import useAccountStore from "@/stores/accountStore";

// Avatar dropdown in the header. Session restore, login and account events
// all live in LoginGate — by the time this renders, the user is signed in.
export default function AccountButton() {
    const { t } = useTranslation()
    const { user, setUser } = useAccountStore()

    const handleLogout = async () => {
        try { await AccountService.Logout() } catch { }
        setUser(null)
    }

    const openProfile = async () => {
        const base = await AccountService.GetWebBaseURL()
        const { AppService } = await import("@bindings/cyrene-launcher/internal/app-service")
        await AppService.OpenURL(base + "/profile")
    }

    if (!user) return null

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
