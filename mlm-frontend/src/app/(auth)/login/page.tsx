"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Phone, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string>("/logo.jpg");

  useEffect(() => {
    api.get("/settings").then((res) => {
      if (res.data?.data?.site_logo) setSiteLogo(res.data.data.site_logo);
    }).catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error("Phone number and password are required.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post("/auth/login", { phone, password });
      setUser(res.data.data.user);
      toast.success("Welcome back!");
      if (res.data.data.user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-bg min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background decorative orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#D4A843]/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#10B981]/5 blur-[100px] pointer-events-none" />

      {/* Form */}
      <div className="flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10 w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full"
        >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex justify-center mb-4"
          >
            <img src={siteLogo} alt="Proyojon Plus Logo" className="w-20 h-20 rounded-2xl shadow-lg shadow-[#D4A843]/20 object-cover" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gold-gradient">Proyojon Plus</h1>
          <p className="text-[#94A3B8] mt-1 text-sm">Premium Investment Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-gradient-to-br from-slate-900/90 via-[#1a1c29]/90 to-slate-950/90 backdrop-blur-xl p-8 rounded-3xl border-t border-l border-[#D4A843]/40 border-b border-r border-[#3B82F6]/20 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_2px_15px_rgba(212,168,67,0.15),inset_0_-2px_15px_rgba(59,130,246,0.1)] relative overflow-hidden">
          <h2 className="text-xl font-semibold text-[#E8EDF5] mb-1">Welcome back</h2>
          <p className="text-[#94A3B8] text-sm mb-6">Sign in to your account</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[#94A3B8] text-sm font-medium">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4A843]/60" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-[#E8EDF5] placeholder:text-[#94A3B8]/50 focus-visible:ring-[#D4A843]/50 focus-visible:border-[#D4A843]/50 h-11"
                  maxLength={11}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[#94A3B8] text-sm font-medium">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#D4A843] hover:text-[#F0C966] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4A843]/60" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white/5 border-white/10 text-[#E8EDF5] placeholder:text-[#94A3B8]/50 focus-visible:ring-[#D4A843]/50 focus-visible:border-[#D4A843]/50 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#D4A843] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-[#D4A843] to-[#B8860B] hover:from-[#E5B84E] hover:to-[#C79920] text-[#0F1B35] font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#D4A843]/20 hover:shadow-[#D4A843]/30 hover:scale-[1.01] active:scale-[0.99]"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-[#94A3B8] mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-[#D4A843] hover:text-[#F0C966] font-medium transition-colors"
            >
              Register now
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-[#94A3B8]/50 mt-6">
          © {new Date().getFullYear()} Proyojon Plus. All rights reserved.
        </p>
      </motion.div>
      </div>
    </div>
  );
}
