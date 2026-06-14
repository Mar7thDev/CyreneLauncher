import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import useModalStore from "@/stores/modalStore";
import { Blend, BookOpen, Diff, Home, Info, Languages, Minus, Newspaper, Settings, Terminal, TrendingUpDown, Wrench, X } from "lucide-react";
import { AppService } from "@bindings/cyrene-launcher/internal/app-service";
import LanguageSwitcher from "../languageSwitcher";
import AccountButton from "../accountButton";
import { useTranslation } from "react-i18next";
import useSettingStore from "@/stores/settingStore";
import useNewsStore, { hasUnreadServerNews } from "@/stores/newsStore";
import { AnimatePresence, motion } from "motion/react";
import { features } from "@/config/features";
import { launcherConfig } from "@/config/launcher";
import { FSService } from "@bindings/cyrene-launcher/internal/fs-service";

export default function Header() {
    const { setIsOpenSettingModal, setIsOpenCloseModal } = useModalStore()
    const { closingOption, gamePath, gameProfile, genshinGamePath } = useSettingStore()
    const { t } = useTranslation()
    const [gameVersion, setGameVersion] = useState("")
    const isStarRail = gameProfile === "starrail"
    const activeGamePath = gameProfile === "genshin" ? genshinGamePath : gamePath
    const showNews = isStarRail && features.news
    const showLanguageTools = isStarRail && features.languageTools
    const showDiffTools = isStarRail && features.diffTools
    const showAnalysis = isStarRail && features.analysis
    const showSrTools = isStarRail && features.srTools
    const showToolsMenu = showLanguageTools || showDiffTools || showAnalysis || showSrTools
    const showConsole = isStarRail && features.console
    const newsState = useNewsStore()
    const showNewsDot = showNews && hasUnreadServerNews(newsState)
    const brandedChrome = launcherConfig.brandedChrome
    const brandTitleClass = brandedChrome ? "launcher-brand-title" : "bg-clip-text text-transparent launcher-gradient-text"
    const brandSubtitleClass = brandedChrome ? "launcher-muted-text text-xs" : "text-base-content/50 text-xs"
    const panelClass = brandedChrome
        ? "launcher-dark-panel"
        : "launcher-default-panel"
    const dropdownPanelClass = brandedChrome
        ? "launcher-dark-panel"
        : "launcher-menu"
    const navLinkClass = brandedChrome ? "launcher-panel-hover" : "launcher-primary-hover"
    const controlButtonClass = brandedChrome ? "launcher-surface-button" : "launcher-soft-hover launcher-primary-hover"
    const staticHeaderSubtitle = launcherConfig.appSubtitle ?? t("header.by")
    const headerSubtitle = launcherConfig.subtitleMode === "game-version"
        ? activeGamePath
            ? gameVersion
                ? `${launcherConfig.gameVersionSubtitlePrefix} ${gameVersion}`
                : launcherConfig.gameVersionUnknownSubtitle
            : launcherConfig.gameVersionMissingSubtitle
        : staticHeaderSubtitle

    useEffect(() => {
        if (!features.news) return
        useNewsStore.getState().checkServerNews()
    }, [])

    useEffect(() => {
        if (launcherConfig.subtitleMode !== "game-version") return

        let isCurrent = true

        if (!activeGamePath) {
            setGameVersion("")
            return () => {
                isCurrent = false
            }
        }

        FSService.GetGameVersion(activeGamePath)
            .then(version => {
                if (isCurrent) setGameVersion(version)
            })
            .catch(() => {
                if (isCurrent) setGameVersion("")
            })

        return () => {
            isCurrent = false
        }
    }, [activeGamePath])

    const controlButtons = [
        {
            icon: <Settings className="w-5 h-5" />,
            action: () => setIsOpenSettingModal(true),
            tip: t("header.settings"),
        },
        {
            icon: <Minus className="w-5 h-5" />,
            action: () => AppService.MinimizeApp(),
            tip: t("header.minimize"),
        },
        {
            icon: <X className="w-5 h-5" />,
            action: () => {
                if (closingOption.isAsk) {
                    setIsOpenCloseModal(true)
                    return
                }
                if (closingOption.isMinimize) {
                    AppService.HideApp()
                    return
                }
                AppService.CloseApp()
            },
            tip: t("header.close"),
        },
    ]

    return (
        <div
            className="navbar sticky top-0 z-50 px-3"
            style={{ '--wails-draggable': 'drag' } as any}
        >
            {/* LEFT */}
            <div className="navbar-start">
                <div className="dropdown" style={{ '--wails-draggable': 'no-drag' } as any}>
                    <div tabIndex={0} role="button" className="btn btn-ghost md:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
                        </svg>
                    </div>
                    <ul
                        tabIndex={0}
                        className={`menu menu-sm dropdown-content ${dropdownPanelClass} rounded-box z-1 mt-3 w-52 p-2`}
                    >
                        <li><Link to="/">{t("header.home")}</Link></li>
                        {showNews && (
                            <li>
                                <Link to="/news">
                                    {t("header.news")}
                                    {showNewsDot && <span className="w-2 h-2 rounded-full launcher-themed-dot inline-block" />}
                                </Link>
                            </li>
                        )}
                        {showToolsMenu && (
                            <>
                                <li>
                                    <a>{t("header.tools")}</a>
                                    <ul className="p-2">
                                        {showLanguageTools && <li><Link to="/language">{t("header.language")}</Link></li>}
                                        {showDiffTools && <li><Link to="/diff">{t("header.client_update")}</Link></li>}
                                        {showAnalysis && <li><Link to="/analysis">{t("header.analysis")}</Link></li>}
                                        {showSrTools && <li><Link to="/srtools">{t("header.firefly_tools")}</Link></li>}
                                    </ul>
                                </li>
                            </>
                        )}
                        {features.howTo && <li><Link to="/howto">{t("header.how_to")}</Link></li>}
                        {showConsole && <li><Link to="/console">{t("header.console")}</Link></li>}
                        {features.about && <li><Link to="/about">{t("header.about")}</Link></li>}
                    </ul>
                </div>

                <Link to="/" className="grid grid-cols-1 items-start text-left gap-0">
                    <div className="flex items-center justify-center">
                        <img src={launcherConfig.appIcon} alt="Logo" className='w-13 h-13 rounded-xl mx-2 shadow-md' />
                        <div className="flex flex-col justify-center items-start">
                            <h1 className="text-xl font-bold">
                                <span className={brandTitleClass}>
                                    {launcherConfig.appName}
                                </span>
                            </h1>
                            <p className={brandSubtitleClass}>{headerSubtitle}</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* CENTER */}
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={gameProfile}
                    initial={{ y: -72, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -72, opacity: 0 }}
                    transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                    className={`navbar-center hidden md:flex ${panelClass} rounded-xl`}
                    style={{ '--wails-draggable': 'no-drag' } as any}
                >
                    <ul className="menu menu-horizontal px-1 gap-1">
                        <li>
                            <Link to="/" className={`flex items-center gap-2 ${navLinkClass} transition-colors rounded-lg`}>
                                <Home size={17} /> {t("header.home")}
                            </Link>
                        </li>
                        {showNews && (
                            <li>
                                <Link to="/news" className={`flex items-center gap-2 ${navLinkClass} transition-colors rounded-lg`}>
                                    <span className="relative">
                                        <Newspaper size={17} />
                                        {showNewsDot && (
                                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full launcher-themed-dot" />
                                        )}
                                    </span>
                                    {t("header.news")}
                                </Link>
                            </li>
                        )}
                        {showToolsMenu && (
                            <>
                                <li>
                                    <details>
                                        <summary className={`flex items-center gap-2 cursor-pointer ${navLinkClass} transition-colors rounded-lg`}>
                                            <Wrench size={17} /> {t("header.tools")}
                                        </summary>
                                        <ul className={`p-2 ${dropdownPanelClass} rounded-xl min-w-40 whitespace-nowrap`}>
                                            {showLanguageTools && <li>
                                                <Link to="/language" className={`flex items-center gap-2 ${navLinkClass} transition-colors`}>
                                                    <Languages size={17} /> {t("header.language")}
                                                </Link>
                                            </li>}
                                            {showDiffTools && <li>
                                                <Link to="/diff" className={`flex items-center gap-2 ${navLinkClass} transition-colors`}>
                                                    <Diff size={17} /> {t("header.client_update")}
                                                </Link>
                                            </li>}
                                            {showAnalysis && <li>
                                                <Link to="/analysis" className={`flex items-center gap-2 ${navLinkClass} transition-colors`}>
                                                    <TrendingUpDown size={17} /> {t("header.analysis")}
                                                </Link>
                                            </li>}
                                            {showSrTools && <li>
                                                <Link to="/srtools" className={`flex items-center gap-2 ${navLinkClass} transition-colors`}>
                                                    <Blend size={17} /> {t("header.firefly_tools")}
                                                </Link>
                                            </li>}
                                        </ul>
                                    </details>
                                </li>
                            </>
                        )}
                        {features.howTo && <li>
                            <Link to="/howto" className={`flex items-center gap-2 ${navLinkClass} transition-colors rounded-lg`}>
                                <BookOpen size={17} /> {t("header.how_to")}
                            </Link>
                        </li>}
                        {showConsole && (
                            <li>
                                <Link to="/console" className={`flex items-center gap-2 ${navLinkClass} transition-colors rounded-lg`}>
                                    <Terminal size={17} /> {t("header.console")}
                                </Link>
                            </li>
                        )}
                        {features.about && <li>
                            <Link to="/about" className={`flex items-center gap-2 ${navLinkClass} transition-colors rounded-lg`}>
                                <Info size={17} /> {t("header.about")}
                            </Link>
                        </li>}
                    </ul>
                </motion.div>
            </AnimatePresence>

            {/* RIGHT */}
            <div className="navbar-end flex gap-2 z-52">
                <div
                    className={`flex items-center gap-1 ${panelClass} rounded-xl`}
                    style={{ '--wails-draggable': 'no-drag' } as any}
                >
                    {features.account && <AccountButton />}
                    <LanguageSwitcher branded={brandedChrome} />
                    {controlButtons.map((btn, i) => (
                        <div key={i} className="tooltip tooltip-bottom" data-tip={btn.tip}>
                            <button
                                onClick={btn.action}
                                className={`btn btn-ghost btn-circle ${controlButtonClass} transition-colors`}
                            >
                                {btn.icon}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
