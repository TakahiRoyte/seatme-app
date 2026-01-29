import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ja from './locales/ja.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ja: {
        translation: ja,
      },
    },
    lng: 'ja', // Default language to Japanese
    fallbackLng: 'ja',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
