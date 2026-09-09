"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import {
  Store,
  MapPin,
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  Send,
} from "lucide-react";

export default function DealerApplyPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDealer, setIsDealer] = useState(false);
  const [latestApplication, setLatestApplication] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [division, setDivision] = useState("");
  const [nidNumber, setNidNumber] = useState("");

  useEffect(() => {
    fetchDealerStatus();
  }, []);

  const fetchDealerStatus = async () => {
    try {
      const res = await api.get("/dealer/status");
      if (res.data?.data) {
        setIsDealer(res.data.data.isDealer);
        setLatestApplication(res.data.data.latestApplication);
      }
    } catch (err) {
      console.error("Failed to fetch dealer status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!shopName || !shopAddress || !district) {
      setError("Shop name, address, and district are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/dealer/apply", {
        shopName,
        shopAddress,
        district,
        division: division || undefined,
        nidNumber: nidNumber || undefined,
      });
      if (res.data.success) {
        setSuccess(true);
        fetchDealerStatus();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
      </div>
    );
  }

  // Already a dealer
  if (isDealer) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20">
            <Store className="h-5 w-5 text-emerald-400" />
          </div>
          Dealer Status
        </h1>
        <div className="max-w-lg p-8 rounded-2xl bg-card border border-emerald-500/30 text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground">You are an Approved Dealer!</h2>
          <p className="text-sm text-muted-foreground">
            You earn 5% dealer commission on every product sale through your referral network.
          </p>
        </div>
      </div>
    );
  }

  // Has pending application
  if (latestApplication && latestApplication.status === "pending") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-gold-500/20 flex items-center justify-center border border-gold-500/20">
            <Store className="h-5 w-5 text-gold-400" />
          </div>
          Dealer Application
        </h1>
        <div className="max-w-lg p-8 rounded-2xl bg-card border border-amber-500/30 text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Application Under Review</h2>
          <p className="text-sm text-muted-foreground">
            Your dealer application for <span className="text-gold-400 font-semibold">{latestApplication.shop_name}</span> is
            being reviewed by the admin. We'll update you once a decision is made.
          </p>
          <div className="text-xs text-muted-foreground">
            Submitted: {new Date(latestApplication.created_at).toLocaleDateString("en-US", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </div>
        </div>
      </div>
    );
  }

  // Rejected - can reapply
  if (latestApplication && latestApplication.status === "rejected" && !success) {
    // Show form with rejection notice
  }

  // Application form
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold-400/20 to-amber-500/20 flex items-center justify-center border border-gold-500/20">
            <Store className="h-5 w-5 text-gold-400" />
          </div>
          Become a Dealer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Apply to become an official Proyojon Plus regional dealer and earn 5% commission on every product sale.
        </p>
      </div>

      {latestApplication && latestApplication.status === "rejected" && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Previous application rejected</p>
            {latestApplication.admin_note && (
              <p className="text-xs text-red-400/70 mt-1">Reason: {latestApplication.admin_note}</p>
            )}
          </div>
        </div>
      )}

      {success ? (
        <div className="max-w-lg p-8 rounded-2xl bg-card border border-emerald-500/30 text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Application Submitted!</h2>
          <p className="text-sm text-muted-foreground">
            Your dealer application has been submitted successfully. Admin will review and respond shortly.
          </p>
        </div>
      ) : (
        <div className="max-w-2xl p-6 rounded-2xl bg-card border border-border/40 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
                Shop / Business Name *
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Your shop name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/40 border border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-gold-500/40 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
                District *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Dhaka, Chittagong"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/40 border border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-gold-500/40 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
              Shop Address *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <textarea
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                rows={3}
                placeholder="Full shop address"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/40 border border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-gold-500/40 text-sm resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
                Division (Optional)
              </label>
              <input
                type="text"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                placeholder="e.g. Dhaka Division"
                className="w-full px-4 py-3 rounded-xl bg-secondary/40 border border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-gold-500/40 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
                NID Number (Optional)
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={nidNumber}
                  onChange={(e) => setNidNumber(e.target.value)}
                  placeholder="National ID Number"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/40 border border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-gold-500/40 text-sm"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-slate-950 font-bold text-sm hover:from-gold-400 hover:to-amber-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Dealer Application
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
