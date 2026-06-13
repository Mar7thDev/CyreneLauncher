import { useEffect } from "react";
import { Minus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Events } from "@wailsio/runtime";
import { AccountService } from "@bindings/cyrene-launcher/internal/account-service";
import { AppService } from "@bindings/cyrene-launcher/internal/app-service";
import useAccountStore, { type GateError } from "@/stores/accountStore";

function mapError(code: string): GateError {
    if (code.includes("banned")) return "banned";
    if (code.includes("pending")) return "pending";
    return "failed";
}

// Fullscreen overlay that blocks the app until the user is signed in.
// Owns all account events; AccountButton only renders the store state.
export default function LoginGate() {
    const { t } = useTranslation()
    const { user, pending, checking, skipped, gateError, setUser, setPending, setChecking, setSkipped, setGateError } = useAccountStore()

    const restore = async () => {
        setChecking(true)
        setGateError("")
        try {
            const [ok, profile, err] = await AccountService.GetProfile()
            if (ok) setUser(profile)
            else if (err) setGateError("offline")
        } catch {
            setGateError("offline")
        }
        setChecking(false)
    }

    useEffect(() => {
        restore()

        const offSuccess = Events.On("account:login:success", (event: any) => {
            setUser(event.data?.user ?? event.data)
            toast.success(t("account.login_success"))
        })
        const offFailed = Events.On("account:login:failed", (event: any) => {
            setPending(false)
            setGateError(mapError(String(event.data?.error ?? "")))
        })
        const offLogout = Events.On("account:logout", () => {
            setUser(null)
            toast.info(t("account.logged_out"))
        })
        return () => { offSuccess(); offFailed(); offLogout() }
    }, [])

    const handleLogin = async () => {
        setGateError("")
        try {
            const [ok, err] = await AccountService.StartLogin()
            if (!ok) { setGateError(err ? mapError(err) : "offline"); return }
            setPending(true)
        } catch {
            setGateError("offline")
        }
    }

    const handleCancel = async () => {
        try { await AccountService.CancelLogin() } catch { }
        setPending(false)
    }

    const handleSkip = () => {
        setSkipped(true)
        toast.info(t("account.skip_reminder"))
    }

    if (user || skipped) return null

    const errorKey =
        gateError === "banned" ? "account.banned" :
        gateError === "pending" ? "account.pending" :
        gateError === "offline" ? "account.offline" :
        gateError === "failed" ? "account.login_failed" : ""

    return (
        <div
            className="fixed inset-0 z-100 flex flex-col bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50"
            style={{ '--wails-draggable': 'drag' } as any}
        >
            <div className="flex justify-end gap-1 p-2" style={{ '--wails-draggable': 'no-drag' } as any}>
                <button
                    onClick={() => AppService.MinimizeApp()}
                    className="btn btn-ghost btn-sm btn-circle hover:bg-pink-100"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <button
                    onClick={() => AppService.CloseApp()}
                    className="btn btn-ghost btn-sm btn-circle hover:bg-pink-100"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-5 -mt-10 px-6">
                <img src="/appicon.png" alt="" className="w-20 h-20 rounded-2xl shadow-xl shadow-pink-200/60" />
                <h1 className="text-3xl font-bold">
                    <span className="bg-clip-text text-transparent bg-linear-to-r from-pink-500 via-violet-500 to-sky-500">
                        Cyrene Launcher
                    </span>
                </h1>

                {checking ? (
                    <span className="loading loading-spinner loading-md text-pink-400 mt-2" />
                ) : pending ? (
                    <div className="flex flex-col items-center gap-4" style={{ '--wails-draggable': 'no-drag' } as any}>
                        <p className="text-base-content/55 text-sm">{t("account.waiting")}</p>
                        <span className="loading loading-spinner loading-md text-pink-400" />
                        <button onClick={handleCancel} className="btn btn-ghost btn-sm text-base-content/50">
                            {t("account.cancel")}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4" style={{ '--wails-draggable': 'no-drag' } as any}>
                        <p className="text-base-content/55 text-sm">{t("account.gate_hint")}</p>
                        {errorKey && <p className="text-error text-sm">{t(errorKey)}</p>}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleLogin}
                                className="btn bg-linear-to-r from-pink-500 via-violet-500 to-sky-500 border-none text-white shadow-lg shadow-pink-300/50 px-8"
                            >
                                {t("account.sign_in")}
                            </button>
                            {gateError === "offline" && (
                                <button onClick={restore} className="btn btn-ghost text-base-content/55">
                                    {t("account.retry")}
                                </button>
                            )}
                        </div>
                        <button onClick={handleSkip} className="btn btn-ghost btn-sm text-base-content/40">
                            {t("account.skip")}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
