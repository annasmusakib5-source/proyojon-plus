"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/axios";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  const { setUser } = useAuthStore();

  useEffect(() => {
    // Fetch initial profile & wallet data
    const fetchUserData = async () => {
      try {
        const res = await api.get("/wallet");
        if (res.data?.data?.balances?.current_balance !== undefined) {
          setUserBalance(parseFloat(res.data.data.balances.current_balance));
        }
      } catch (err) {
        console.error("Failed to fetch wallet info:", err);
      }
    };
    fetchUserData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <Sidebar isMobileOpen={isMobileOpen} onMobileClose={() => setIsMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMobileMenuToggle={() => setIsMobileOpen(true)} userBalance={userBalance} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
