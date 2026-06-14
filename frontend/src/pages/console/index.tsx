import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Terminal, Plug, PlugZap, Send, Eraser, ChevronRight, BookText, Search, AlertTriangle, Trash2 } from "lucide-react";
import useSettingStore from "@/stores/settingStore";
import { ConsoleService } from "@bindings/cyrene-launcher/internal/console-service";
import { HandbookService } from "@bindings/cyrene-launcher/internal/handbook-service";
import { launcherConfig, resolvePatchServerUrl } from "@/config/launcher";

const DEFAULT_SERVER = launcherConfig.defaultPatchUrl;
const LANG_MAP: Record<string, string> = { zh: "CHS", en: "EN", ja: "JP", ko: "KR", vi: "VI" };

export default function ConsolePage() {
    const { t, i18n } = useTranslation();
    const { patchTargetUrl, patchServerPort } = useSettingStore();

    // Reuse the server address configured in Settings; fall back to the default.
    const serverUrl = resolvePatchServerUrl((patchTargetUrl || "").trim() || DEFAULT_SERVER, patchServerPort);

    const [uid, setUid] = useState("");
    const [password, setPassword] = useState("");
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);

    const [command, setCommand] = useState("");
    const [executing, setExecuting] = useState(false);
    const [log, setLog] = useState<string[]>([]);

    const logRef = useRef<HTMLDivElement>(null);

    const [hbLangs, setHbLangs] = useState<string[]>([]);
    const [hbLang, setHbLang] = useState("");
    const [hbQuery, setHbQuery] = useState("");
    const [hbResults, setHbResults] = useState<string[]>([]);
    const [hbSearching, setHbSearching] = useState(false);
    const [hbSearched, setHbSearched] = useState(false);

    const [resetConfirming, setResetConfirming] = useState(false);
    const [resetting, setResetting] = useState(false);

    const appendLog = (line: string) => {
        setLog((prev) => {
            const next = [...prev, line];
            requestAnimationFrame(() => {
                if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
            });
            return next;
        });
    };

    const handleConnect = async () => {
        if (!uid.trim() || !password) {
            toast.error(t("console.err_fields"));
            return;
        }
        const uidNum = Number(uid.trim());
        if (!Number.isInteger(uidNum) || uidNum <= 0) {
            toast.error(t("console.err_uid"));
            return;
        }
        setConnecting(true);
        try {
            const [ok, output, err] = await ConsoleService.Execute(serverUrl, uidNum, password, "");
            if (!ok) {
                toast.error(err || t("console.err_connect"));
                return;
            }
            setConnected(true);
            setLog([output || t("console.connected")]);
        } catch (e: any) {
            toast.error(String(e));
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = () => {
        setConnected(false);
        setCommand("");
        setLog([]);
    };

    const handleExecute = async () => {
        const cmd = command.trim();
        if (!cmd || executing) return;
        const uidNum = Number(uid.trim());
        setExecuting(true);
        appendLog(`> ${cmd}`);
        setCommand("");
        try {
            const [ok, output, err] = await ConsoleService.Execute(serverUrl, uidNum, password, cmd);
            appendLog(ok ? (output || t("console.no_output")) : `! ${err || t("console.err_exec")}`);
        } catch (e: any) {
            appendLog(`! ${String(e)}`);
        } finally {
            setExecuting(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [ok, langs] = await HandbookService.Languages(serverUrl);
                if (cancelled || !ok || !langs || langs.length === 0) return;
                setHbLangs(langs);
                const pref = LANG_MAP[(i18n.language || "en").slice(0, 2)] || "EN";
                setHbLang(langs.includes(pref) ? pref : langs[0]);
            } catch {
                /* server may be unreachable; leave handbook disabled */
            }
        })();
        return () => { cancelled = true; };
    }, [serverUrl]);

    const handleSearch = async () => {
        if (!hbLang || hbSearching) return;
        setHbSearching(true);
        try {
            const [ok, results, err] = await HandbookService.Search(serverUrl, hbLang, hbQuery.trim());
            if (!ok) {
                toast.error(err || t("console.hb_err"));
                setHbResults([]);
            } else {
                setHbResults(results ?? []);
            }
            setHbSearched(true);
        } catch (e: any) {
            toast.error(String(e));
        } finally {
            setHbSearching(false);
        }
    };

    const copyLine = (line: string) => {
        navigator.clipboard?.writeText(line);
        toast.success(t("console.hb_copied"));
    };

    const handleSelfReset = async () => {
        if (!uid.trim() || !password) {
            toast.error(t("console.err_fields"));
            return;
        }
        const uidNum = Number(uid.trim());
        if (!Number.isInteger(uidNum) || uidNum <= 0) {
            toast.error(t("console.err_uid"));
            return;
        }
        setResetting(true);
        try {
            const [ok, output, err] = await ConsoleService.SelfReset(serverUrl, uidNum, password);
            if (!ok) {
                toast.error(err || t("console.reset_err"));
                return;
            }
            toast.success(output || t("console.reset_done"));
            setResetConfirming(false);
            if (connected) handleDisconnect();
        } catch (e: any) {
            toast.error(String(e));
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="launcher-tool-page min-h-screen flex items-center justify-center p-6">
            <div className="w-full launcher-tool-shell rounded-2xl p-8 space-y-8">
                <div className="flex flex-col items-center gap-3">
                    <h1 className="text-4xl font-bold launcher-tool-title text-center flex items-center gap-3">
                        <Terminal className="w-8 h-8" /> {t("console.title")}
                    </h1>
                    <p className="launcher-tool-subtitle text-center max-w-2xl">{t("console.subtitle")}</p>
                </div>

                {/* Connection */}
                <div className="launcher-info-panel p-6 rounded-r-lg border-l-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                        <Plug size={20} /> {t("console.conn_title")}
                    </h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium launcher-setting-title">{t("console.label_uid")}</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="input w-full launcher-input"
                                    placeholder={t("console.ph_uid")}
                                    value={uid}
                                    disabled={connected}
                                    onChange={(e) => setUid(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium launcher-setting-title">{t("console.label_password")}</span>
                                <input
                                    type="password"
                                    className="input w-full launcher-input"
                                    placeholder={t("console.ph_password")}
                                    value={password}
                                    disabled={connected}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !connected) handleConnect(); }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                            {!connected ? (
                                <button
                                    className="btn launcher-tool-button"
                                    onClick={handleConnect}
                                    disabled={connecting}
                                >
                                    {connecting
                                        ? (<><span className="loading loading-spinner loading-sm" /> {t("console.btn_connecting")}</>)
                                        : (<><Plug size={18} /> {t("console.btn_connect")}</>)}
                                </button>
                            ) : (
                                <>
                                    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium launcher-status-badge-success">
                                        <PlugZap size={14} /> {t("console.connected")}
                                    </span>
                                    <button className="btn btn-ghost" onClick={handleDisconnect}>
                                        {t("console.btn_disconnect")}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Command console */}
                <div className={`launcher-info-panel p-6 rounded-r-lg border-l-4 transition-opacity ${connected ? "" : "opacity-50 pointer-events-none"}`}>
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                        <Terminal size={20} /> {t("console.exec_title")}
                    </h2>

                    {/* Output */}
                    <div
                        ref={logRef}
                        className="launcher-code-surface font-mono text-sm rounded-xl p-4 h-72 overflow-y-auto whitespace-pre-wrap break-words"
                    >
                        {log.length === 0
                            ? <span className="text-base-content/30">{t("console.output_empty")}</span>
                            : log.map((line, i) => (
                                <div key={i} className={line.startsWith("!") ? "launcher-status-text-error" : line.startsWith(">") ? "launcher-text font-medium" : ""}>
                                    {line}
                                </div>
                            ))}
                    </div>

                    {/* Input */}
                    <div className="flex items-center gap-2 mt-4">
                        <label className="input launcher-input flex-1 flex items-center gap-2 font-mono">
                            <ChevronRight size={16} className="launcher-tool-icon shrink-0" />
                            <input
                                type="text"
                                className="grow"
                                placeholder={t("console.ph_command")}
                                value={command}
                                disabled={!connected || executing}
                                onChange={(e) => setCommand(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleExecute(); }}
                            />
                        </label>
                        <button
                            className="btn launcher-tool-button"
                            onClick={handleExecute}
                            disabled={!connected || executing || !command.trim()}
                        >
                            {executing
                                ? <span className="loading loading-spinner loading-sm" />
                                : <Send size={18} />}
                            {t("console.btn_execute")}
                        </button>
                        <button
                            className="btn btn-ghost btn-square"
                            onClick={() => setLog([])}
                            disabled={!connected || log.length === 0}
                            title={t("console.btn_clear")}
                        >
                            <Eraser size={18} />
                        </button>
                    </div>
                </div>

                {/* Handbook lookup */}
                <div className="launcher-info-panel p-6 rounded-r-lg border-l-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-1">
                        <BookText size={20} /> {t("console.hb_title")}
                    </h2>
                    <p className="text-sm mb-4">{t("console.hb_subtitle")}</p>

                    <div className="flex flex-col sm:flex-row items-stretch gap-2">
                        <select
                            className="select launcher-input w-full sm:w-40"
                            value={hbLang}
                            disabled={hbLangs.length === 0}
                            onChange={(e) => setHbLang(e.target.value)}
                        >
                            {hbLangs.length === 0
                                ? <option value="">{t("console.hb_no_langs")}</option>
                                : hbLangs.map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <label className="input launcher-input flex-1 flex items-center gap-2">
                            <Search size={16} className="launcher-tool-icon shrink-0" />
                            <input
                                type="text"
                                className="grow"
                                placeholder={t("console.hb_ph")}
                                value={hbQuery}
                                onChange={(e) => setHbQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                            />
                        </label>
                        <button className="btn launcher-tool-button" onClick={handleSearch} disabled={hbSearching || !hbLang}>
                            {hbSearching ? <span className="loading loading-spinner loading-sm" /> : <Search size={18} />}
                            {t("console.hb_search")}
                        </button>
                    </div>

                    <div className="mt-4 launcher-code-surface font-mono text-sm rounded-xl overflow-hidden">
                        <div className="max-h-80 overflow-y-auto p-3">
                            {hbResults.length === 0 ? (
                                <div className="p-3 text-center text-base-content/30">
                                    {hbSearched ? t("console.hb_no_results") : t("console.hb_hint")}
                                </div>
                            ) : (
                                hbResults.map((line, i) => (
                                    <div
                                        key={i}
                                        className="px-1 py-0.5 rounded launcher-soft-hover cursor-pointer whitespace-pre-wrap break-words"
                                        onClick={() => copyLine(line)}
                                        title={t("console.hb_copy_hint")}
                                    >
                                        {line}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    {hbResults.length > 0 && (
                        <p className="text-xs mt-2">{t("console.hb_count", { count: hbResults.length })}</p>
                    )}
                </div>

                {/* Danger zone: self reset */}
                <div className="launcher-status-danger p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-1">
                        <AlertTriangle size={20} /> {t("console.reset_title")}
                    </h2>
                    <p className="text-sm mb-4">{t("console.reset_desc")}</p>

                    {!resetConfirming ? (
                        <button
                            className="btn launcher-danger-button"
                            onClick={() => setResetConfirming(true)}
                            disabled={!uid.trim() || !password}
                        >
                            <Trash2 size={18} /> {t("console.reset_btn")}
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <p className="font-semibold">{t("console.reset_confirm_q")}</p>
                            <div className="flex items-center gap-3">
                                <button className="btn launcher-danger-button" onClick={handleSelfReset} disabled={resetting}>
                                    {resetting
                                        ? <span className="loading loading-spinner loading-sm" />
                                        : <Trash2 size={18} />}
                                    {t("console.reset_confirm_yes")}
                                </button>
                                <button className="btn btn-ghost" onClick={() => setResetConfirming(false)} disabled={resetting}>
                                    {t("console.reset_confirm_no")}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-center pt-2">
                    <Link to="/" className="btn btn-wide launcher-gradient border-none text-white launcher-gradient-shadow transition-shadow">
                        {t("console.btn_back")}
                    </Link>
                </div>
            </div>
        </div>
    );
}
