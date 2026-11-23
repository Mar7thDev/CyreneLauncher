import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { ArrowRight, Minus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Events } from "@wailsio/runtime";
import { AccountService } from "@bindings/cyrene-launcher/internal/account-service";
import { AppService } from "@bindings/cyrene-launcher/internal/app-service";
import useAccountStore, { type GateError } from "@/stores/accountStore";
import useSettingStore from "@/stores/settingStore";

const FALLBACK_BACKGROUND = "bg-17.jpg"
const drag = { '--wails-draggable': 'drag' } as CSSProperties
const noDrag = { '--wails-draggable': 'no-drag' } as CSSProperties
const inputClass = "input h-11 w-full rounded-lg border border-base-300 bg-white text-sm shadow-none placeholder:text-base-content/35 focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10"

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
    const background = useSettingStore((s) => s.background) || FALLBACK_BACKGROUND
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

    // The artwork the user picked for the home page fills the window; the sign-in form sits in a
    // plain panel on the right so the transition into the launcher keeps the same picture.
    return (
        <div className="fixed inset-0 z-100 flex bg-base-200" style={drag}>
            <img
                src={background}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_BACKGROUND }}
            />

            <aside className="relative ml-auto flex h-full w-[400px] flex-col border-l border-black/5 bg-white/95 shadow-[-16px_0_48px_rgba(30,20,40,0.12)] backdrop-blur-xl">
                <div className="flex justify-end gap-1 p-3" style={noDrag}>
                    <button
                        onClick={() => AppService.MinimizeApp()}
                        aria-label="Minimize"
                        className="btn btn-ghost btn-sm btn-square text-base-content/45 hover:bg-base-200 hover:text-base-content"
                    >
                        <Minus className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => AppService.CloseApp()}
                        aria-label="Close"
                        className="btn btn-ghost btn-sm btn-square text-base-content/45 hover:bg-base-200 hover:text-base-content"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex flex-1 flex-col justify-center px-11 pb-6">
                    <img src="/appicon.png" alt="" className="h-12 w-12 rounded-xl ring-1 ring-black/5" />
                    <h1 className="mt-5 text-[22px] font-semibold tracking-tight text-base-content">Cyrene Launcher</h1>
                    <p className="mt-1 text-sm text-base-content/50">{t("account.gate_hint")}</p>

                    <div className="mt-8" style={noDrag}>
                        {checking ? (
                            <div className="flex items-center gap-3 text-sm text-base-content/55">
                                <span className="loading loading-spinner loading-sm text-base-content/40" />
                                {t("account.connecting")}
                            </div>
                        ) : pending ? (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3 text-sm text-base-content/65">
                                    <span className="loading loading-spinner loading-sm text-base-content/40" />
                                    {t("account.waiting")}
                                </div>
                                <button onClick={handleCancel} className="btn h-11 w-full rounded-lg border border-base-300 bg-white font-medium text-base-content shadow-none hover:bg-base-200">
                                    {t("account.cancel")}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {errorKey && (
                                    <p role="alert" className="rounded-lg bg-error/8 px-3 py-2 text-sm text-error">{t(errorKey)}</p>
                                )}
                                <form onSubmit={handlePassword} className="flex flex-col gap-3">
                                    <input name="identifier" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false}
                                        required maxLength={254} aria-label={t("account.identifier")} placeholder={t("account.identifier")} className={inputClass} />
                                    <input name="password" type="password" autoComplete="current-password" required maxLength={200}
                                        aria-label={t("account.password")} placeholder={t("account.password")} className={inputClass} />
                                    <button type="submit" disabled={submitting}
                                        className="btn mt-1 h-11 w-full rounded-lg border-0 bg-base-content font-medium text-base-100 shadow-none hover:bg-base-content/85">
                                        {submitting && <span className="loading loading-spinner loading-xs" />}
                                        {t("account.password_sign_in")}
                                    </button>
                                </form>
                                <button onClick={handleLogin} disabled={submitting}
                                    className="btn h-11 w-full rounded-lg border border-base-300 bg-white font-medium text-base-content shadow-none hover:bg-base-200">
                                    {t("account.browser_sign_in")}
                                </button>
                                {gateError === "offline" && (
                                    <button onClick={restore} className="btn btn-ghost btn-sm self-start px-0 font-normal text-base-content/55 hover:bg-transparent hover:text-base-content">
                                        {t("account.retry")}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-base-200 px-11 py-5" style={noDrag}>
                    <button onClick={handleSkip} disabled={submitting}
                        className="group inline-flex items-center gap-1.5 text-sm text-base-content/50 transition-colors hover:text-base-content disabled:opacity-50">
                        {t("account.skip")}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                </div>
            </aside>
        </div>
    )
}
