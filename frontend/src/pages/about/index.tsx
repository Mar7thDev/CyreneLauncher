import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export default function AboutPage() {
    const { t } = useTranslation();

    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl bg-white/90 backdrop-blur-xl border border-pink-200/60 shadow-xl shadow-pink-100/50 rounded-2xl p-8 space-y-6">
          <h1 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-sky-500">
            {t("about.title")}
          </h1>

          <div className="space-y-4">
            <p className="text-base leading-relaxed text-base-content/80">
              {t("about.p1_pre")}<span className="font-semibold text-primary">Cyrene Launcher</span>{t("about.p1_post")}
            </p>
            <p className="text-base leading-relaxed text-base-content/80">
              {t("about.p2_pre")}<span className="font-semibold text-success">{t("about.p2_highlight")}</span>{t("about.p2_post")}
            </p>
            <p className="text-base leading-relaxed text-base-content/80">
              {t("about.p3_pre")}<span className="font-mono text-info">Go + Wails3</span>{t("about.p3_mid")}<span className="text-accent">Tailwind CSS</span>{t("about.p3_and")}<span className="text-accent">DaisyUI</span>{t("about.p3_post")}
            </p>
            <p className="text-base leading-relaxed text-base-content/80">
              {t("about.p4")}
            </p>
          </div>

          <div className="text-center pt-4">
            <Link
              to="/"
              className="btn btn-wide bg-linear-to-r from-pink-500 to-sky-500 border-none text-white shadow-md shadow-pink-200/50 hover:shadow-pink-300/60 transition-shadow"
            >
              {t("about.btn_back")}
            </Link>
          </div>
        </div>
      </div>
    );
}
