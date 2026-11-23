import { useEffect, useRef, useState, type FormEvent } from "react";
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
    if (code === "bad_credentials" || code === "rate_limited" || code === "offline") return code;
    return "failed";
}

// Fullscreen overlay that blocks the app until the user is signed in.
// Owns all account events; AccountButton only renders the store state.
export default function LoginGate() {
    const { t } = useTranslation()
    const { user, pending, checking, skipped, gateError, setUser, setPending, setChecking, setSkipped, setGateError } = useAccountStore()
    const [submitting, setSubmitting] = useState(false)
    const attempt = useRef(0)

    // 每次打开 launcher 自动恢复登录态:连不上服务器则在 2 分钟内持续重试,期间显示带"暂不登录"的连接页,拿到 profile 即登录,未登录(401)则显示登录页。
    const restore = async () => {
        setGateError("")
        setChecking(true)
        const deadline = Date.now() + 2 * 60 * 1000
        while (true) {
            const st = useAccountStore.getState()
            if (st.user || st.skipped) { setChecking(false); return }
            try {
                const [ok, profile, err] = await AccountService.GetProfile()
                if (ok) { setUser(profile); setChecking(false); return }
                if (!err) { setChecking(false); return } // 未登录(401/无 token):显示登录页
            } catch { /* 连不上,继续重试 */ }
            if (Date.now() >= deadline) { setGateError("offline"); setChecking(false); return }
            await new Promise((r) => setTimeout(r, 5000))
        }
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

    // 点登录后拿设备码:连不上则在 2 分钟内重试(期间显示连接页),拿到设备码即打开浏览器进入等待;被封禁/待激活则直接提示。
    const handleLogin = async () => {
        const id = ++attempt.current
        setGateError("")
        setChecking(true)
        const deadline = Date.now() + 2 * 60 * 1000
        while (true) {
            const st = useAccountStore.getState()
            if (id !== attempt.current || st.user || st.skipped) { setChecking(false); return }
            try {
                const [ok, err] = await AccountService.StartLogin()
                if (id !== attempt.current) { setChecking(false); return }
                if (ok) { setChecking(false); setPending(true); return }
                const mapped = err ? mapError(err) : ""
                if (mapped === "banned" || mapped === "pending") { setChecking(false); setGateError(mapped); return }
            } catch { /* 连不上,继续重试 */ }
            if (Date.now() >= deadline) { setChecking(false); setGateError("offline"); return }
            await new Promise((r) => setTimeout(r, 5000))
        }
    }

    const handleCancel = async () => {
        try { await AccountService.CancelLogin() } catch { }
        setPending(false)
    }

    const handlePassword = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (submitting) return
        const form = event.currentTarget
        const data = new FormData(form)
        const id = ++attempt.current
        setSubmitting(true)
        setGateError("")
        try {
            const [ok, profile, err] = await AccountService.LoginWithPassword(String(data.get("identifier")), String(data.get("password")))
            if (id !== attempt.current) return
            if (ok) { form.reset(); setUser(profile); toast.success(t("account.login_success")) }
            else setGateError(mapError(err))
        } catch { if (id === attempt.current) setGateError("offline") }
        finally { if (id === attempt.current) setSubmitting(false) }
    }

    const handleSkip = () => {
        ++attempt.current
        void AccountService.CancelLogin().catch(() => {})
        setSubmitting(false)
        setPending(false)
        setSkipped(true)
        toast.info(t("account.skip_reminder"))
    }

    if (user || skipped) return null

    const errorKey =
        gateError === "banned" ? "account.banned" :
        gateError === "pending" ? "account.pending" :
        gateError === "offline" ? "account.offline" :
        gateError === "failed" ? "account.login_failed" : gateError ? `account.${gateError}` : ""

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
                    <div className="flex flex-col items-center gap-4" style={{ '--wails-draggable': 'no-drag' } as any}>
                        <p className="text-base-content/55 text-sm">{t("account.connecting")}</p>
                        <span className="loading loading-spinner loading-md text-pink-400" />
                    </div>
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
                        {errorKey && <p role="alert" className="text-error text-sm">{t(errorKey)}</p>}
                        <form onSubmit={handlePassword} className="grid w-72 gap-2">
                            <input name="identifier" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false}
                                required maxLength={254} aria-label={t("account.identifier")} placeholder={t("account.identifier")} className="input w-full" />
                            <input name="password" type="password" autoComplete="current-password" required maxLength={200}
                                aria-label={t("account.password")} placeholder={t("account.password")} className="input w-full" />
                            <button type="submit" disabled={submitting} className="btn btn-primary w-full">{t("account.password_sign_in")}</button>
                        </form>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleLogin}
                                disabled={submitting}
                                className="btn btn-ghost btn-sm"
                            >
                                {t("account.browser_sign_in")}
                            </button>
                            {gateError === "offline" && (
                                <button onClick={restore} className="btn btn-ghost text-base-content/55">
                                    {t("account.retry")}
                                </button>
                            )}
                        </div>
                    </div>
                )}
                <button onClick={handleSkip} disabled={submitting} style={{ '--wails-draggable': 'no-drag' } as any}
                    className="btn btn-ghost btn-sm text-base-content/60">{t("account.skip")}</button>
            </div>
        </div>
    )
}
