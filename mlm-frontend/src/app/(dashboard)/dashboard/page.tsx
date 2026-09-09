"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  AlertCircle,
  Award,
  Calendar,
  Layers,
  Crown,
  Gift,
  ShieldCheck,
  Send,
  ArrowDownToLine,
  Package,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation";

interface WalletData {
  balances: {
    current_balance: string | number;
    total_income: string | number;
    daily_club_bonus: string | number;
    salary_club: string | number;
    hajj_club: string | number;
    shareholder_club: string | number;
    hajj_lottery_club: string | number;
    reward_point: string | number;
    monthly_prize_point: string | number;
    due_account: string | number;
    accumulated_pv?: string | number;
    sp?: string | number;
    gp?: string | number;
  };
  clubs: Record<string, { is_eligible: boolean; joined_at: string | null }>;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePackage, setActivePackage] = useState<any | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const { t } = useTranslation();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [walletRes, packageRes] = await Promise.allSettled([
          api.get("/wallet"),
          api.get("/packages"),
        ]);

        if (walletRes.status === "fulfilled" && walletRes.value.data?.success) {
          setData(walletRes.value.data.data);
        }

        if (packageRes.status === "fulfilled" && packageRes.value.data?.success) {
          const packages = packageRes.value.data.data;
          if (Array.isArray(packages) && packages.length > 0) {
            setActivePackage(packages[0]);
          }
        }
      } catch (err: any) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  useEffect(() => {
    if (activePackage?.package_name === "Gold" && activePackage?.expires_at) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(activePackage.expires_at).getTime();
        const difference = expiry - now;

        if (difference > 0) {
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((difference % (1000 * 60)) / 1000),
          });
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activePackage]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 text-gold-400 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  const balances = data?.balances || {
    current_balance: "0.00",
    total_income: "0.00",
    due_account: "0.00",
    reward_point: "0",
    daily_club_bonus: "0.00",
    salary_club: "0.00",
    hajj_club: "0.00",
    shareholder_club: "0.00",
    hajj_lottery_club: "0.00",
    monthly_prize_point: "0",
  };

  const clubs = data?.clubs || {};

  const num = (val: any) => parseFloat(String(val || 0));


  const overviewCards = [
    {
      title: t.card_balance,
      value: `৳ ${num(balances.current_balance).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`,
      icon: Wallet,
      color: "from-gold-500/20 to-amber-500/10 text-gold-400 border-gold-500/30",
    },
    {
      title: t.card_income,
      value: `৳ ${num(balances.total_income).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30",
    },
    {
      title: t.card_due,
      value: `৳ ${num(balances.due_account).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`,
      icon: AlertCircle,
      color: num(balances.due_account) > 0 ? "from-rose-500/20 to-red-500/10 text-rose-400 border-rose-500/30" : "from-slate-500/20 to-gray-500/10 text-slate-400 border-slate-500/30",
    },
    {
      title: t.card_reward,
      value: `${num(balances.reward_point)} PTS`,
      icon: Award,
      color: "from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/30",
    },
    {
      title: t.card_pv,
      value: `${num(balances.accumulated_pv || 0)} PV`,
      icon: Sparkles,
      color: "from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/30",
    },
    {
      title: t.card_sp,
      value: `${num(balances.sp || 0)} SP`,
      icon: Layers,
      color: "from-pink-500/20 to-rose-500/10 text-pink-400 border-pink-500/30",
    },
    {
      title: t.card_gp,
      value: `${num(balances.gp || 0)} GP`,
      icon: Crown,
      color: "from-yellow-500/20 to-orange-500/10 text-yellow-400 border-yellow-500/30",
    },
  ];

  const clubWallets = [
    {
      key: "daily",
      name: t.club_daily_name,
      balance: `৳ ${num(balances.daily_club_bonus).toFixed(2)}`,
      icon: Calendar,
      desc: t.club_daily_desc,
    },
    {
      key: "shareholder",
      name: t.club_shareholder_name,
      balance: `৳ ${num(balances.shareholder_club).toFixed(2)}`,
      icon: Layers,
      desc: t.club_shareholder_desc,
    },
    {
      key: "hajj",
      name: t.club_hajj_name,
      balance: `৳ ${num(balances.hajj_club).toFixed(2)}`,
      icon: Crown,
      desc: t.club_hajj_desc,
    },
    {
      key: "salary",
      name: t.club_salary_name,
      balance: `৳ ${num(balances.salary_club).toFixed(2)}`,
      icon: ShieldCheck,
      desc: t.club_salary_desc,
    },
    {
      key: "monthly_prize",
      name: t.club_prize_name,
      balance: `${num(balances.monthly_prize_point)} Points`,
      icon: Gift,
      desc: t.club_prize_desc,
    },
    {
      key: "hajj_lottery",
      name: t.club_lottery_name,
      balance: `৳ ${num(balances.hajj_lottery_club).toFixed(2)}`,
      icon: Sparkles,
      desc: t.club_lottery_desc,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/40 p-6 md:p-8 border border-gold-500/20 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-xs font-semibold text-gold-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t.dash_welcome_badge}</span>
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                {t.dash_welcome} {user?.name || user?.phone}
              </h2>
              <div className="text-sm font-semibold flex items-center gap-2">
                <span className="text-muted-foreground">{t.dash_referral_id}</span>
                <span className="text-gradient-gold text-lg px-3 py-1 bg-gold-500/10 border border-gold-500/30 rounded-md select-all">
                  {user?.phone}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl pt-2">
              {t.dash_welcome_desc}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto mt-4 md:mt-0">
            <Link href="/packages" className="w-full">
              <Button className="w-full bg-gold-500 hover:bg-gold-400 text-slate-950 font-semibold gap-2 shadow-lg shadow-gold-500/20">
                <Package className="h-4 w-4" /> {t.action_buy_pkg}
              </Button>
            </Link>
            <Link href="/transfer" className="w-full">
              <Button variant="outline" className="w-full border-gold-500/30 text-gold-400 hover:bg-gold-500/10 gap-2">
                <Send className="h-4 w-4" /> {t.action_transfer}
              </Button>
            </Link>
            <Link href="/withdraw" className="w-full">
              <Button variant="outline" className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-2">
                <ArrowDownToLine className="h-4 w-4" /> {t.action_withdraw}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-gold-400" />
          <span>{t.overview_title}</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {overviewCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className={`bg-gradient-to-br ${card.color} border shadow-lg backdrop-blur-sm`}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {card.title}
                    </CardTitle>
                    <Icon className="h-5 w-5" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold tracking-tight">{card.value}</div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Active Package & Timer Section if Gold */}
      {activePackage && (
        <Card className="bg-card/80 border border-gold-500/30 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gradient-gold capitalize">
                  {t.gold_active_title} {activePackage.package_name || activePackage.package_type || "Standard"}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {t.gold_purchased} {new Date(activePackage.activated_at || activePackage.created_at || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {t.gold_active_status}
            </span>
          </CardHeader>
          {activePackage.package_name === "Gold" && (
            <CardContent className="pt-4 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <Clock className="h-5 w-5" />
                  <span className="font-bold text-sm tracking-wide uppercase">{t.gold_countdown}</span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 text-center">
                  <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg px-2 sm:px-3 py-1.5 min-w-[50px] sm:min-w-[60px]">
                    <div className="text-lg sm:text-xl font-black text-gradient-gold">{timeLeft.days}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">{t.gold_days}</div>
                  </div>
                  <span className="text-gold-500/50 font-bold hidden sm:inline">:</span>
                  <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg px-2 sm:px-3 py-1.5 min-w-[50px] sm:min-w-[60px]">
                    <div className="text-lg sm:text-xl font-black text-gradient-gold">{timeLeft.hours.toString().padStart(2, '0')}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">{t.gold_hours}</div>
                  </div>
                  <span className="text-gold-500/50 font-bold hidden sm:inline">:</span>
                  <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg px-2 sm:px-3 py-1.5 min-w-[50px] sm:min-w-[60px]">
                    <div className="text-lg sm:text-xl font-black text-gradient-gold">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">{t.gold_mins}</div>
                  </div>
                  <span className="text-gold-500/50 font-bold hidden sm:inline">:</span>
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-2 sm:px-3 py-1.5 min-w-[50px] sm:min-w-[60px]">
                    <div className="text-lg sm:text-xl font-black text-rose-400">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                    <div className="text-[10px] text-rose-400/80 uppercase font-semibold">{t.gold_secs}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                <div className="text-xs font-medium text-slate-300 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 w-full text-center">
                  {t.gold_live_roi}
                </div>
                {num(balances.due_account) > 0 && (
                  <div className="text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/30 w-full text-center shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                    {t.gold_due_received} ৳ {num(balances.due_account).toLocaleString()}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* 7 Club Wallets Grid (Universal Visibility) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Crown className="h-5 w-5 text-gold-400" />
              <span>{t.club_visibility_title}</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              {t.club_visibility_desc}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubWallets.map((club, i) => {
            const Icon = club.icon;
            const clubInfo = clubs[club.key] || { is_eligible: false };
            return (
              <motion.div
                key={club.key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
              >
                <Card className="bg-card/60 border border-border/60 hover:border-gold-500/30 transition-all duration-200 hover:shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-gold-500/10 text-gold-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        {club.name}
                      </CardTitle>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                        clubInfo.is_eligible
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}
                    >
                      {clubInfo.is_eligible ? t.club_eligible : t.club_locked}
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-xl font-bold text-gold-400">{club.balance}</div>
                    <p className="text-[11px] text-muted-foreground">{club.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
