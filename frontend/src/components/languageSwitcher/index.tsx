import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

const languages = [
  { code: "en", label: "EN", native: "English" },
  { code: "vi", label: "VI", native: "Tiếng Việt" },
  { code: "ja", label: "JA", native: "日本語" },
  { code: "ko", label: "KO", native: "한국어" },
  { code: "zh", label: "ZH", native: "中文" },
];

type LanguageSwitcherProps = {
  branded?: boolean;
};

const LanguageSwitcher = ({ branded = false }: LanguageSwitcherProps) => {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = languages.find((l) => l.code === i18n.language) ?? languages[0];
  const triggerClass = branded
    ? "launcher-surface-button"
    : "text-base-content/70 launcher-soft-hover launcher-primary-hover";
  const chevronClass = branded ? "launcher-panel-muted-icon" : "text-base-content/50";
  const dropdownClass = branded
    ? "launcher-dark-panel shadow-2xl"
    : "launcher-menu";
  const activeItemClass = branded
    ? "launcher-panel-active"
    : "launcher-soft-bg-strong launcher-text";
  const inactiveItemClass = branded
    ? "text-current launcher-panel-hover"
    : "text-base-content/70 launcher-soft-hover launcher-primary-hover";
  const activeIconClass = branded ? "launcher-panel-muted-icon" : "launcher-text";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`
        btn btn-ghost px-2
          flex items-center gap-1
          text-sm font-semibold tracking-wider
          select-none
          tooltip tooltip-bottom
          ${triggerClass}
        `}
        data-tip={t("header.language")}
      >
        <span className="uppercase">{current.label}</span>
        {/* Chevron */}
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${chevronClass} ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <ul
          className={`
            absolute right-0 mt-2 w-32
            rounded-xl
            overflow-hidden z-999
            py-1
            animate-in fade-in slide-in-from-top-2 duration-150
            ${dropdownClass}
          `}
        >
          {languages.map((lang) => {
            const isActive = lang.code === i18n.language;
            return (
              <li key={lang.code}>
                <button
                  onClick={() => select(lang.code)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-sm
                    transition-colors duration-150
                    ${isActive
                      ? activeItemClass
                      : inactiveItemClass
                    }
                  `}
                >
                  <span className="flex-1 text-left">{lang.native}</span>
                  {isActive && (
                    <svg className={`w-3.5 h-3.5 ${activeIconClass} shrink-0`} fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;
