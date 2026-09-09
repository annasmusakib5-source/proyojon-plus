"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";
import {
  Store,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MapPin,
} from "lucide-react";

interface DealerApp {
  id: number;
  user_id: number;
  user_phone: string;
  shop_name: string;
  shop_address: string;
  district: string;
  division: string | null;
  nid_number: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
}

export default function AdminDealersPage() {
  const [apps, setApps] = useState<DealerApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => { fetchApps(); }, [filter]);

  const fetchApps = async () => {
    try {
      const params: Record<string, string> = {};
      if (filter) params.status = filter;
      const res = await api.get("/admin/dealer-applications", { params });
      setApps(res.data.data || []);
    } catch { toast.error("Failed to fetch applications"); }
    finally { setLoading(false); }
  };

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setProcessing(id);
    try {
      await api.put(`/admin/dealer-applications/${id}/${action}`);
      toast.success(`Application ${action}d successfully`);
      fetchApps();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${action}`);
    } finally { setProcessing(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Store className="h-5 w-5 text-gold-400" />
          Dealer Applications
        </h1>
        <div className="flex gap-2">
          {["", "pending", "approved", "rejected"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === s ? "bg-gold-500 text-slate-950" : "bg-secondary/40 text-muted-foreground"}`}>
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gold-400" /></div>
      ) : apps.length === 0 ? (
        <div className="text-center py-16">
          <Store className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground mt-2">No applications found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apps.map((app) => (
            <div key={app.id} className="p-5 rounded-2xl bg-card border border-border/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    app.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                    app.status === "approved" ? "bg-emerald-500/20 text-emerald-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>{app.status}</span>
                  <span className="text-xs text-muted-foreground">#{app.id}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(app.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-gold-400" />
                  {app.shop_name}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  User #{app.user_id} • {app.user_phone}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" />
                  {app.district}{app.division ? `, ${app.division}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">{app.shop_address}</p>
                {app.nid_number && (
                  <p className="text-xs text-muted-foreground">NID: {app.nid_number}</p>
                )}
              </div>

              {app.status === "pending" && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleAction(app.id, "approve")}
                    disabled={processing === app.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/30 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleAction(app.id, "reject")}
                    disabled={processing === app.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
