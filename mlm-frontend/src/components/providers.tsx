"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import { useLanguageStore } from "@/store/languageStore";

export function Providers({ children }: { children: React.ReactNode }) {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className={mounted && language === "bn" ? "font-bn" : ""}>
        {children}
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1A2D50",
            color: "#E8EDF5",
            border: "1px solid rgba(212, 168, 67, 0.2)",
            borderRadius: "0.75rem",
            fontSize: "0.875rem",
          },
          success: {
            iconTheme: {
              primary: "#10B981",
              secondary: "#1A2D50",
            },
          },
          error: {
            iconTheme: {
              primary: "#EF4444",
              secondary: "#1A2D50",
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
