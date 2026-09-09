"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";
import {
  Megaphone,
  Plus,
  Trash2,
  Loader2,
  X,
  Save,
  Bell,
  Image as ImageIcon,
} from "lucide-react";

interface Notice {
  id: number;
  title: string;
  content: string;
  type: string;
  is_active: number;
  sort_order: number;
  created_at: string;
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "ticker",
    is_active: true,
    sort_order: "0",
  });

  useEffect(() => { fetchNotices(); }, []);

  const fetchNotices = async () => {
    try {
      const res = await api.get("/notices");
      setNotices(res.data.data || []);
    } catch {
      toast.error("Failed to fetch notices");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: "", content: "", type: "ticker", is_active: true, sort_order: "0" });
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.content) {
      toast.error("Title and content are required");
      return;
    }
    setSaving(true);
    try {
      await api.post("/admin/notices", form);
      toast.success("Notice created successfully");
      resetForm();
      fetchNotices();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create notice");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this notice?")) return;
    try {
      await api.delete(`/admin/notices/${id}`);
      toast.success("Notice deleted");
      fetchNotices();
    } catch {
      toast.error("Failed to delete notice");
    }
  };

  const toggleActive = async (notice: Notice) => {
    try {
      await api.put(`/admin/notices/${notice.id}`, {
        ...notice,
        is_active: !notice.is_active,
      });
      toast.success(`Notice ${notice.is_active ? "deactivated" : "activated"}`);
      fetchNotices();
    } catch {
      toast.error("Failed to update notice");
    }
  };

  const typeColors: Record<string, string> = {
    ticker: "bg-blue-500/20 text-blue-400",
    popup: "bg-amber-500/20 text-amber-400",
    banner: "bg-purple-500/20 text-purple-400",
    announcement: "bg-emerald-500/20 text-emerald-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-gold-400" />
          Notice Manager
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-slate-950 text-sm font-semibold hover:from-gold-400 hover:to-amber-400 transition-all"
        >
          <Plus className="h-4 w-4" /> New Notice
        </button>
      </div>

      {/* Notice Form */}
      {showForm && (
        <div className="p-6 rounded-2xl bg-card border border-gold-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gold-400">Create Notice</h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Notice title"
                className="w-full px-3 py-2 rounded-lg bg-secondary/40 border border-border/60 text-foreground text-sm focus:ring-2 focus:ring-gold-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-secondary/40 border border-border/60 text-foreground text-sm focus:ring-2 focus:ring-gold-500/40 focus:outline-none"
              >
                <option value="ticker">Ticker (Marquee)</option>
                <option value="popup">Popup</option>
                <option value="banner">Banner</option>
                <option value="announcement">Announcement</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Content *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={3}
              placeholder="Notice content / message..."
              className="w-full px-3 py-2 rounded-lg bg-secondary/40 border border-border/60 text-foreground text-sm focus:ring-2 focus:ring-gold-500/40 focus:outline-none resize-none"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Active (visible to users)
            </label>
            <button
              onClick={handleSave}
              disabled={saving}
              className="ml-auto flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gold-500 text-slate-950 font-semibold text-sm hover:bg-gold-400 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Create Notice
            </button>
          </div>
        </div>
      )}

      {/* Notices List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-gold-400" />
        </div>
      ) : notices.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">No notices yet. Create one to show to users.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border/40 hover:border-border/60 transition-all"
            >
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${typeColors[notice.type] || "bg-secondary text-muted-foreground"}`}>
                    {notice.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${notice.is_active ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                    {notice.is_active ? "Active" : "Inactive"}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(notice.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">{notice.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{notice.content}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(notice)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    notice.is_active
                      ? "bg-secondary/60 text-muted-foreground hover:text-foreground"
                      : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                  }`}
                >
                  {notice.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => handleDelete(notice.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
