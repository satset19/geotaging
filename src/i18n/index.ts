import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import id from './locales/id.json';
import en from './locales/en.json';

export const SUPPORTED_LOCALES = ['id', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// Inisialisasi i18next.
// Detektor bahasa mencoba: localStorage (key "i18nextLng") -> navigator -> htmlTag.
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      id: { translation: id },
      en: { translation: en },
    },
    fallbackLng: 'id',
    supportedLngs: SUPPORTED_LOCALES,
    interpolation: {
      // React sudah escape secara default.
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  });

export default i18n;
