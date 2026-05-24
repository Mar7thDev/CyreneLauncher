import { Link } from "@tanstack/react-router";
import useModalStore from "@/stores/modalStore";
import { Blend, BookOpen, Diff, Home, Info, Languages, Minus, Newspaper, Puzzle, Settings, TrendingUpDown, Wrench, X } from "lucide-react";
import { AppService } from "@bindings/firefly-launcher/internal/app-service";
import LanguageSwitcher from "../languageSwitcher";
import { useTranslation } from "react-i18next";
import useSettingStore from "@/stores/settingStore";

export default function Header() {
    const { setIsOpenSettingModal, setIsOpenCloseModal } = useModalStore()
    const { closingOption } = useSettingStore()
    const { t } = useTranslation()

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
                        className="menu menu-sm dropdown-content bg-white/90 backdrop-blur-xl border border-pink-200/60 rounded-box z-1 mt-3 w-52 p-2 shadow-xl"
                    >
                        <li><Link to="/">{t("header.home")}</Link></li>
                        <li><Link to="/news">{t("header.news")}</Link></li>
                        <li>
                            <a>{t("header.tools")}</a>
                            <ul className="p-2">
                                <li><Link to="/language">{t("header.language")}</Link></li>
                                <li><Link to="/diff">{t("header.client_update")}</Link></li>
                            </ul>
                        </li>
                        <li>
                            <a>{t("header.plugins")}</a>
                            <ul className="p-2">
                                <li><Link to="/analysis">{t("header.analysis")}</Link></li>
                                <li><Link to="/srtools">{t("header.firefly_tools")}</Link></li>
                            </ul>
                        </li>
                        <li><Link to="/howto">{t("header.how_to")}</Link></li>
                        <li><Link to="/about">{t("header.about")}</Link></li>
                    </ul>
                </div>

                <Link to="/" className="grid grid-cols-1 items-start text-left gap-0">
                    <div className="flex items-center justify-center">
                        <img src="/appicon.png" alt="Logo" className='w-13 h-13 rounded-xl mx-2 shadow-md' />
                        <div className="flex flex-col justify-center items-start">
                            <h1 className="text-xl font-bold">
                                <span className="bg-clip-text text-transparent bg-linear-to-r from-pink-500 via-violet-500 to-sky-500">
                                    Cyrene Launcher
                                </span>
                            </h1>
                            <p className="text-base-content/50 text-xs">{t("header.by")}</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* CENTER */}
            <div
                className="navbar-center hidden md:flex bg-white/60 backdrop-blur-xl border border-white/80 rounded-xl shadow-sm shadow-pink-200/30"
                style={{ '--wails-draggable': 'no-drag' } as any}
            >
                <ul className="menu menu-horizontal px-1 gap-1">
                    <li>
                        <Link to="/" className="flex items-center gap-2 hover:text-pink-500 transition-colors rounded-lg">
                            <Home size={17} /> {t("header.home")}
                        </Link>
                    </li>
                    <li>
                        <Link to="/news" className="flex items-center gap-2 hover:text-pink-500 transition-colors rounded-lg">
                            <Newspaper size={17} /> {t("header.news")}
                        </Link>
                    </li>
                    <li>
                        <details>
                            <summary className="flex items-center gap-2 cursor-pointer hover:text-pink-500 transition-colors rounded-lg">
                                <Wrench size={17} /> {t("header.tools")}
                            </summary>
                            <ul className="p-2 bg-white/95 backdrop-blur-xl border border-pink-100 rounded-xl min-w-40 whitespace-nowrap shadow-lg shadow-pink-100/50">
                                <li>
                                    <Link to="/language" className="flex items-center gap-2 hover:text-pink-500 transition-colors">
                                        <Languages size={17} /> {t("header.language")}
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/diff" className="flex items-center gap-2 hover:text-pink-500 transition-colors">
                                        <Diff size={17} /> {t("header.client_update")}
                                    </Link>
                                </li>
                            </ul>
                        </details>
                    </li>
                    <li>
                        <details>
                            <summary className="flex items-center gap-2 cursor-pointer hover:text-pink-500 transition-colors rounded-lg">
                                <Puzzle size={17} /> {t("header.plugins")}
                            </summary>
                            <ul className="p-2 bg-white/95 backdrop-blur-xl border border-pink-100 rounded-xl min-w-40 whitespace-nowrap shadow-lg shadow-pink-100/50">
                                <li>
                                    <Link to="/analysis" className="flex items-center gap-2 hover:text-pink-500 transition-colors">
                                        <TrendingUpDown size={17} /> {t("header.analysis")}
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/srtools" className="flex items-center gap-2 hover:text-pink-500 transition-colors">
                                        <Blend size={17} /> {t("header.firefly_tools")}
                                    </Link>
                                </li>
                            </ul>
                        </details>
                    </li>
                    <li>
                        <Link to="/howto" className="flex items-center gap-2 hover:text-pink-500 transition-colors rounded-lg">
                            <BookOpen size={17} /> {t("header.how_to")}
                        </Link>
                    </li>
                    <li>
                        <Link to="/about" className="flex items-center gap-2 hover:text-pink-500 transition-colors rounded-lg">
                            <Info size={17} /> {t("header.about")}
                        </Link>
                    </li>
                </ul>
            </div>

            {/* RIGHT */}
            <div className="navbar-end flex gap-2 z-52">
                <div
                    className="flex items-center gap-1 bg-white/60 backdrop-blur-xl border border-white/80 rounded-xl shadow-sm shadow-pink-200/30"
                    style={{ '--wails-draggable': 'no-drag' } as any}
                >
                    <LanguageSwitcher />
                    {controlButtons.map((btn, i) => (
                        <div key={i} className="tooltip tooltip-bottom" data-tip={btn.tip}>
                            <button
                                onClick={btn.action}
                                className="btn btn-ghost btn-circle hover:bg-pink-100 hover:text-pink-600 transition-colors"
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
