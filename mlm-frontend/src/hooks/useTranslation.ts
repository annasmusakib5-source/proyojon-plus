import { useLanguageStore } from "@/store/languageStore";
import { en } from "@/locales/en";
import { bn } from "@/locales/bn";

const dictionaries = {
  en,
  bn,
};

export const useTranslation = () => {
  const { language, setLanguage } = useLanguageStore();
  const t = dictionaries[language];

  return { t, language, setLanguage };
};
