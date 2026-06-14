import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Megaphone, Pin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { NewsService } from "@bindings/cyrene-launcher/internal/news-service";
import { AppService } from "@bindings/cyrene-launcher/internal/app-service";

interface WidgetItem {
    id: string
    title: string
    url: string
    time: string
    pinned?: boolean
}

// Compact server-announcement card shown on the launcher home page.
export default function NewsWidget() {
    const { t } = useTranslation()
    const [items, setItems] = useState<WidgetItem[]>([])

    useEffect(() => {
        let cancelled = false
        NewsService.GetCustomNews()
            .then(([ok, list]) => {
                if (!cancelled && ok && list?.length) setItems(list.slice(0, 3))
            })
            .catch(() => { })
        return () => { cancelled = true }
    }, [])

    if (items.length === 0) return null

    const openLink = async (url: string) => {
        if (!url) return
        try { await AppService.OpenURL(url) }
        catch { window.open(url, "_blank") }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-80 launcher-default-panel rounded-2xl p-3"
        >
            <Link to="/news" className="flex items-center justify-between px-1 mb-1.5 launcher-hover-group">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-base-content/70 launcher-hover-text transition-colors">
                    <Megaphone size={14} /> {t("header.news")}
                </span>
                <ChevronRight size={14} className="text-base-content/40 launcher-hover-text transition-colors" />
            </Link>
            <ul>
                {items.map(item => (
                    <li key={item.id}>
                        <button
                            onClick={() => openLink(item.url)}
                            className="w-full flex items-center gap-2 px-1 py-1 rounded-lg launcher-soft-hover text-left transition-colors"
                        >
                            {item.pinned && <Pin size={12} className="launcher-text shrink-0" />}
                            <span className="flex-1 text-xs text-base-content/70 truncate">{item.title}</span>
                            <span className="text-[10px] text-base-content/40 shrink-0">{item.time}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </motion.div>
    )
}
