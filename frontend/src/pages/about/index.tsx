import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { launcherConfig } from "@/config/launcher";

export default function AboutPage() {
    const { t } = useTranslation();

    return (
      <div className="launcher-tool-page min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-3xl launcher-card rounded-2xl p-8 space-y-6">
          <h1 className="text-4xl font-bold text-center text-transparent bg-clip-text launcher-gradient-text">
            {t("about.title")}
          </h1>

          <div className="space-y-4">
            <p className="text-base leading-relaxed text-base-content/80">
              {t("about.p1_pre")}<span className="font-semibold launcher-text">{launcherConfig.appName}</span>{t("about.p1_post")}
            </p>
            <p className="text-base leading-relaxed text-base-content/80">
              {t("about.p2_pre")}<span className="font-semibold launcher-setting-title">{t("about.p2_highlight")}</span>{t("about.p2_post")}
            </p>
            <p className="text-base leading-relaxed text-base-content/80">
              {t("about.p3_pre")}<span className="font-mono launcher-text">Go + Wails3</span>{t("about.p3_mid")}<span className="launcher-accent-text">Tailwind CSS</span>{t("about.p3_and")}<span className="launcher-accent-text">DaisyUI</span>{t("about.p3_post")}
            </p>
            <p className="text-base leading-relaxed text-base-content/80">
              {t("about.p4")}
            </p>
          </div>

          <div className="text-center pt-4">
            <Link
              to="/"
              className="btn btn-wide launcher-gradient border-none text-white launcher-gradient-shadow transition-shadow"
            >
              {t("about.btn_back")}
            </Link>
          </div>
        </div>
      </div>
    );
}
