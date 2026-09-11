"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/axios";
import { useTranslation } from "@/hooks/useTranslation";
import {
  LayoutDashboard,
  Package,
  Users,
  Send,
  ArrowDownToLine,
  History,
  UserCheck,
  Shield,
  X,
  Sparkles,
  ShoppingBag,
  ShoppingCart,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [siteLogo, setSiteLogo] = useState<string>("/logo.jpg");

  useEffect(() => {
    api.get("/settings").then((res) => {
      if (res.data?.data?.site_logo) {
        setSiteLogo(res.data.data.site_logo);
      }
    }).catch(() => {});
  }, []);

  let navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Packages", href: "/packages", icon: Package },
    { name: "My Network", href: "/network", icon: Users },
    { name: "Fund Transfer", href: "/transfer", icon: Send },
    { name: "Withdraw Funds", href: "/withdraw", icon: ArrowDownToLine },
    { name: "Transactions", href: "/transactions", icon: History },
    { name: "Product Shop", href: "/shop", icon: ShoppingBag },
    { name: "My Orders", href: "/orders", icon: ShoppingCart },
    { name: "Become Dealer", href: "/dealer-apply", icon: Store },
    { name: "My Profile", href: "/profile", icon: UserCheck },
  ];

  if (user?.role === "admin") {
    navItems = [
      { name: "Admin Control", href: "/admin", icon: Shield },
      { name: "My Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "My Network", href: "/network", icon: Users },
      { name: "Transactions", href: "/transactions", icon: History },
      { name: "Withdraw Funds", href: "/withdraw", icon: ArrowDownToLine },
      { name: "My Profile", href: "/profile", icon: UserCheck },
    ];
  }

  const content = (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <img src={siteLogo} alt="Proyojon Plus Logo" className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shadow-lg shadow-gold-500/20 object-cover" />
            <div className="flex flex-col">
              <h1 className="font-bold text-lg sm:text-xl text-gradient-gold tracking-wide leading-tight">
                {t.brand_name || "Proyojon Plus"}
              </h1>
              <p className="hidden sm:block text-[10px] text-muted-foreground uppercase tracking-widest font-semibold leading-tight mt-0.5">
                Investment Platform
              </p>
            </div>
          </Link>
          {isMobileOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={onMobileClose}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation links */}
        <nav className="space-y-1.5 pt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-gradient-to-r from-gold-500/20 to-amber-500/10 text-gold-400 border border-gold-500/30 shadow-md shadow-gold-500/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-gold-400" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                <span>{item.name}</span>
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-gold-400 shadow-sm shadow-gold-400" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Card */}
      <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/40 text-xs text-muted-foreground space-y-2">
        <div className="flex items-center gap-2 text-gold-400 font-medium">
          <Sparkles className="h-4 w-4" />
          <span>Need Help?</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Contact official support via WhatsApp for any account or balance queries.
        </p>
        <a
          href="https://wa.me/8801777000000"
          target="_blank"
          rel="noreferrer"
          className="block w-full py-1.5 text-center text-xs font-semibold text-slate-950 bg-gold-400 rounded-lg hover:bg-gold-300 transition-colors"
        >
          Contact Admin
        </a>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border/40 bg-card/60 backdrop-blur-md sticky top-0 h-screen z-30">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative flex-1 w-full max-w-xs bg-card border-r border-border/40 shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
