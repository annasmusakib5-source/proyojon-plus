"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, Shield, Menu, Wallet, UserCheck, Home } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  userBalance?: number;
}

export function Header({ onMobileMenuToggle, userBalance = 0 }: HeaderProps) {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      clearAuth();
      toast.success("Logged out successfully");
      router.push("/login");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left side: Mobile Menu Trigger + Brand/Page title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-foreground hover:bg-gold-500/10"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2 md:hidden overflow-hidden">
            <span className="font-bold text-base sm:text-lg text-gradient-gold whitespace-nowrap truncate">{t.brand_name || "Proyojon Plus"}</span>
          </div>
        </div>

        {/* Right side: Balance badge, User info & Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Balance Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-secondary/60 border border-gold-500/20 px-3 py-1.5 rounded-full">
            <Wallet className="h-4 w-4 text-gold-400" />
            <span className="text-xs text-muted-foreground">Balance:</span>
            <span className="text-sm font-semibold text-gold-400">
              ৳ {userBalance.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* User Status Badge */}
          {user && (
            <span
              className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                user.status === "active"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}
            >
              {user.status === "active" ? "Active ID" : "Inactive"}
            </span>
          )}

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Home Button */}
          <Link href="/" className="hidden sm:block">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-secondary/60 hover:bg-gold-500/10 border border-transparent hover:border-gold-500/30 transition-colors text-foreground hover:text-gold-400">
              <Home className="h-5 w-5" />
            </Button>
          </Link>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="relative h-10 w-10 rounded-full bg-gold-500/10 border border-gold-500/30 hover:bg-gold-500/20 flex items-center justify-center transition-colors">
              <UserIcon className="h-5 w-5 text-gold-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-card border-border/60" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">{user?.name || user?.phone}</p>
                    <p className="text-xs leading-none text-muted-foreground">ID: {user?.username || `user_${user?.id}`}</p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-border/40" />
              
              <DropdownMenuItem
                onClick={() => router.push("/profile")}
                className="cursor-pointer text-foreground hover:text-gold-400 focus:text-gold-400"
              >
                <UserCheck className="mr-2 h-4 w-4 text-gold-400" />
                <span>My Profile</span>
              </DropdownMenuItem>

              {user?.role === "admin" && (
                <DropdownMenuItem
                  onClick={() => router.push("/admin")}
                  className="cursor-pointer text-gold-400 hover:text-gold-300 focus:text-gold-300"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Admin Dashboard</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator className="bg-border/40" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-rose-400 hover:text-rose-300 focus:text-rose-300"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
