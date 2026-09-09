"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { User, Phone, ShieldCheck, Calendar, Key, AlertCircle, Hash, Award, CheckCircle2, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get("/wallet");
        if (res.data?.success) {
          setProfileData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch profile info:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <User className="h-6 w-6 text-gold-400" />
          <span>My Account Profile</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          View your personal account details, membership status, and security settings.
        </p>
      </div>

      {/* Main Profile Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Avatar Card */}
        <Card className="bg-card/80 border border-gold-500/30 shadow-xl flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-3xl shadow-xl shadow-gold-500/20 border-2 border-gold-400">
            <User className="h-12 w-12 text-slate-950" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground font-mono">{user?.phone || "017XXXXXXXX"}</h3>
            <p className="text-xs text-muted-foreground capitalize">Role: {user?.role || "Member"}</p>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
              user?.status === "active"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="capitalize">{user?.status === "active" ? "Active Account" : "Inactive Account"}</span>
          </span>
        </Card>

        {/* Detailed Info Card */}
        <Card className="bg-card/80 border border-border/60 shadow-xl md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Account Information</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Official registration details associated with your Proyojon Plus account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40">
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-gold-400" />
                <span className="text-muted-foreground">User ID:</span>
              </div>
              <span className="font-bold text-gold-400 font-mono">{user?.id || "---"}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gold-400" />
                <span className="text-muted-foreground">Phone Number:</span>
              </div>
              <span className="font-semibold text-foreground font-mono">{user?.phone || "N/A"}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-gold-400" />
                <span className="text-muted-foreground">Refer ID:</span>
              </div>
              <div className="font-semibold text-right text-foreground font-mono">
                {user?.sponsor_phone ? user.sponsor_phone : "Direct Admin Refer"}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40">
              <div className="flex items-center gap-3">
                <Award className="h-4 w-4 text-gold-400" />
                <span className="text-muted-foreground">Account Tier:</span>
              </div>
              <span className="font-semibold text-emerald-400 capitalize">
                {user?.status === "active" ? "Verified Member" : "Standard Registration"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security & Password Card */}
      <Card className="bg-card/80 border border-border/60 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Lock className="h-5 w-5 text-gold-400" />
            <span>Security & Support</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Password changes are securely managed via Admin verification to prevent unauthorized access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Need to change password or update phone number?</span>
            </div>
            <p className="leading-relaxed">
              To request a password reset or security credential update, please contact official Proyojon Plus support on WhatsApp.
            </p>
          </div>

          <a
            href="https://wa.me/8801777000000"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
          >
            Contact Admin Support on WhatsApp
          </a>
        </CardContent>
      </Card>

      {/* Referral Link Card */}
      <Card className="bg-card/80 border border-border/60 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Award className="h-5 w-5 text-gold-400" />
            <span>My Referral Link</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Share this link to invite new members to your network.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/40 border border-border/40 overflow-hidden">
            <code className="text-emerald-400 font-mono text-sm flex-1 truncate">
              {typeof window !== "undefined" ? `${window.location.origin}/register?ref=${user?.phone}` : `https://proyojonplus.com/register?ref=${user?.phone}`}
            </code>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-gold-400 to-amber-600 hover:from-gold-300 hover:to-amber-500 text-slate-950 font-bold"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user?.phone}`);
                toast.success("Referral link copied!");
              }}
            >
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
