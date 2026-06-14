import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Newspaper, Server, RefreshCw, ExternalLink, Megaphone, Calendar, AlertCircle, ImageOff, Settings, Pin } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"
import { NewsService } from "@bindings/cyrene-launcher/internal/news-service"
import { AppService } from "@bindings/cyrene-launcher/internal/app-service"
import useNewsStore from "@/stores/newsStore"

interface NewsItem {
    id: string
    title: string
    intro: string
    image: string
    url: string
    time: string
    timestamp: number
    type: string
    pinned?: boolean
}

type TabId = "notice" | "event" | "info" | "server"
const CACHE_TTL = 5 * 60 * 1000
const SERVER_NOT_CONFIGURED = "ANNOUNCEMENT_URL_NOT_CONFIGURED"

// i18n language → HSR launcher locale
const HOYO_LANG: Record<string, string> = {
    zh: "zh-cn",
    en: "en-us",
    ja: "ja-jp",
    ko: "ko-kr",
    vi: "vi-vn",
}

interface TabConfig {
    id: TabId
    icon: React.ComponentType<{ size?: number; className?: string }>
}

const TABS: TabConfig[] = [
    { id: "notice", icon: Megaphone },
    { id: "event",  icon: Calendar },
    { id: "info",   icon: Newspaper },
    { id: "server", icon: Server },
]

interface CacheEntry {
    items: NewsItem[]
    timestamp: number
    error?: string
}

export default function NewsPage() {
    const { t, i18n } = useTranslation()
    const [activeTab, setActiveTab] = useState<TabId>("notice")
    const [loading, setLoading] = useState(false)
    // Re-render trigger so useMemo over cacheRef recomputes after fetches
    const [revision, setRevision] = useState(0)

    const cacheRef = useRef<Record<string, CacheEntry>>({})

    const langKey = i18n.language?.split("-")[0] ?? "en"
    const hoyoLang = HOYO_LANG[langKey] ?? "en-us"

    const officialKey = `official_${hoyoLang}`
    const serverKey = "server"

    const loadOfficial = async (force = false) => {
        const cached = cacheRef.current[officialKey]
        if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL) return
        setLoading(true)
        try {
            const [ok, list, err] = await NewsService.GetOfficialNews(hoyoLang)
            cacheRef.current[officialKey] = ok
                ? { items: list ?? [], timestamp: Date.now() }
                : { items: [], timestamp: Date.now(), error: err || "unknown" }
            if (!ok) toast.error(t("news.toast_fetch_error") + err)
            setRevision(r => r + 1)
        } catch (e: any) {
            cacheRef.current[officialKey] = { items: [], timestamp: Date.now(), error: String(e) }
            toast.error(t("news.toast_fetch_error") + e)
            setRevision(r => r + 1)
        } finally {
            setLoading(false)
        }
    }

    const loadServer = async (force = false) => {
        const cached = cacheRef.current[serverKey]
        if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL) return
        setLoading(true)
        try {
            const [ok, list, err] = await NewsService.GetCustomNews()
            cacheRef.current[serverKey] = ok
                ? { items: list ?? [], timestamp: Date.now() }
                : { items: [], timestamp: Date.now(), error: err || "unknown" }
            if (ok && list?.length) {
                // Viewing the server tab clears the unread badge.
                const latest = Math.max(...list.map(i => i.timestamp))
                useNewsStore.setState({ latestServerTimestamp: latest, lastReadServerTimestamp: latest })
            }
            if (!ok && err !== SERVER_NOT_CONFIGURED) toast.error(t("news.toast_fetch_error") + err)
            setRevision(r => r + 1)
        } catch (e: any) {
            cacheRef.current[serverKey] = { items: [], timestamp: Date.now(), error: String(e) }
            toast.error(t("news.toast_fetch_error") + e)
            setRevision(r => r + 1)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (activeTab === "server") loadServer()
        else loadOfficial()
    }, [activeTab, hoyoLang])

    const onRefresh = () => {
        if (activeTab === "server") loadServer(true)
        else loadOfficial(true)
    }

    // Derived state — filter cached items by active tab
    const { items, error } = useMemo(() => {
        void revision
        if (activeTab === "server") {
            const e = cacheRef.current[serverKey]
            return { items: e?.items ?? [], error: e?.error ?? null }
        }
        const e = cacheRef.current[officialKey]
        if (!e) return { items: [], error: null }
        return {
            items: e.items.filter(x => x.type === activeTab),
            error: e.error ?? null,
        }
    }, [revision, activeTab, officialKey])

    const openLink = async (url: string) => {
        if (!url) return
        try { await AppService.OpenURL(url) }
        catch { window.open(url, "_blank") }
    }

    const renderEmptyState = () => {
        if (activeTab === "server" && error === SERVER_NOT_CONFIGURED) {
            return (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                    <div className="p-4 rounded-full launcher-soft-bg">
                        <Settings size={36} className="launcher-text" />
                    </div>
                    <p className="text-base-content/70 font-medium">{t("news.empty_server_not_configured")}</p>
                    <p className="text-sm text-base-content/40 max-w-md">{t("news.empty_server_hint")}</p>
                </div>
            )
        }
        if (error) {
            return (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                    <div className="p-4 rounded-full launcher-status-error">
                        <AlertCircle size={36} />
                    </div>
                    <p className="text-base-content/70 font-medium">{t("news.empty_error")}</p>
                    <p className="text-sm text-base-content/40 max-w-md break-all">{error}</p>
                    <button
                        onClick={onRefresh}
                        className="btn btn-sm mt-2 launcher-gradient border-none text-white"
                    >
                        <RefreshCw size={14} /> {t("news.btn_retry")}
                    </button>
                </div>
            )
        }
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="p-4 rounded-full launcher-soft-bg">
                    <Newspaper size={36} className="launcher-text" />
                </div>
                <p className="text-base-content/50">{t("news.empty")}</p>
            </div>
        )
    }

    return (
        <div className="p-4 mx-4 min-h-[78vh]">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-bold mb-1 text-transparent bg-clip-text launcher-gradient-text">
                        {t("news.header_title")}
                    </h1>
                    <p className="text-base-content/50 text-sm">{t("news.header_desc")}</p>
                </div>

                {/* Tabs + Refresh */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div className="flex flex-wrap gap-1 launcher-default-panel rounded-2xl p-1">
                        {TABS.map(tab => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                        isActive
                                            ? "launcher-gradient text-white launcher-gradient-shadow"
                                            : "text-base-content/60 launcher-primary-hover launcher-primary-hover-bg"
                                    }`}
                                >
                                    <Icon size={15} />
                                    {t(`news.tab_${tab.id}`)}
                                </button>
                            )
                        })}
                    </div>

                    <button
                        className="btn btn-sm bg-white/70 backdrop-blur-md border launcher-soft-border text-base-content/70 launcher-soft-hover launcher-primary-hover gap-2 launcher-soft-shadow"
                        onClick={onRefresh}
                        disabled={loading}
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        {t("news.btn_refresh")}
                    </button>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {loading && items.length === 0 ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20 gap-3"
                        >
                            <span className="loading loading-spinner loading-lg launcher-text"></span>
                            <p className="text-base-content/50 text-sm">{t("news.loading")}</p>
                        </motion.div>
                    ) : items.length === 0 ? (
                        <motion.div
                            key={`empty-${activeTab}-${error ?? "ok"}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {renderEmptyState()}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`grid-${activeTab}-${hoyoLang}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {items.map((item, idx) => (
                                <NewsCard
                                    key={item.id || idx}
                                    item={item}
                                    delay={idx * 0.04}
                                    onOpen={() => openLink(item.url)}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

function NewsCard({ item, delay, onOpen }: { item: NewsItem, delay: number, onOpen: () => void }) {
    const [imgError, setImgError] = useState(false)
    const hasImage = item.image && !imgError

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.25 }}
            whileHover={{ y: -3 }}
            className="group launcher-hover-group launcher-card launcher-card-hover rounded-2xl overflow-hidden transition-all cursor-pointer"
            onClick={onOpen}
        >
            <div className="h-36 overflow-hidden relative">
                {hasImage ? (
                    <img
                        src={item.image}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center launcher-image-placeholder">
                        <ImageOff size={28} className="launcher-text" />
                    </div>
                )}
            </div>
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2 flex-1 text-base-content">
                        {item.pinned && <Pin size={13} className="inline-block launcher-text mr-1 -mt-0.5" />}
                        {item.title}
                    </h3>
                    <ExternalLink size={14} className="text-base-content/30 launcher-hover-text transition-colors shrink-0 mt-0.5" />
                </div>
                {item.intro && (
                    <p className="text-xs text-base-content/50 line-clamp-2 mb-3">{item.intro}</p>
                )}
                <span className="text-xs text-base-content/40">{item.time}</span>
            </div>
        </motion.div>
    )
}
