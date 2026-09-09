import { create } from "zustand";
import { persist } from "zustand/middleware";

type Language = "en" | "bn";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "en", // default to English
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "language-storage",
    }
  )
);
