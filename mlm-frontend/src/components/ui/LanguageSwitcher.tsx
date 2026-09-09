"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { useEffect, useState } from "react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg border border-border/40">
      <button
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
          language === "en"
            ? "bg-gold-500 text-slate-950 shadow-sm shadow-gold-500/20"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("bn")}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
          language === "bn"
            ? "bg-gold-500 text-slate-950 shadow-sm shadow-gold-500/20 font-bn"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary font-bn"
        }`}
      >
        বাংলা
      </button>
    </div>
  );
}
