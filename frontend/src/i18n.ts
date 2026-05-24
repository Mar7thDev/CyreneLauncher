import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import httpBackend from "i18next-http-backend";
i18n
  .use(httpBackend)
  .use(LanguageDetector) // detects browser language
  .use(initReactI18next)
  .init({
    fallbackLng: "en",  //fallback language
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: `/locales/{{lng}}.json`, //path of the languages 
    },
  });