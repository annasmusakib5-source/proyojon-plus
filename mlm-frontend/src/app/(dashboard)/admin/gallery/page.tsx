"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";
import {
  Camera,
  Plus,
  Trash2,
  Loader2,
  X,
  Save,
  ImageIcon,
} from "lucide-react";
import ImageUpload from "@/components/ui/ImageUpload";

interface GalleryItem {
  id: number;
  title: string;
  image_url: string;
  category: string | null;
  sort_order: number;
  created_at: string;
}

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    image_url: "",
    category: "Events",
    sort_order: "0",
  });

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/gallery");
      setImages(res.data.data || []);
    } catch {
      toast.error("Failed to fetch gallery images");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: "", image_url: "", category: "Events", sort_order: "0" });
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.image_url) {
      toast.error("Title and image are required");
      return;
    }
    setSaving(true);
    try {
      await api.post("/admin/gallery", form);
      toast.success("Image added to gallery!");
      resetForm();
      fetchGallery();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add image");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this gallery image?")) return;
    try {
      await api.delete(`/admin/gallery/${id}`);
      toast.success("Image deleted");
      fetchGallery();
    } catch {
      toast.error("Failed to delete image");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Camera className="h-5 w-5 text-gold-400" />
          Gallery Management
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-slate-950 text-sm font-semibold hover:from-gold-400 hover:to-amber-400 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Photo
        </button>
      </div>

      {/* Add Photo Form */}
      {showForm && (
        <div className="p-6 rounded-2xl bg-card border border-gold-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gold-400">Add Image to Gallery</h3>
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
                placeholder="e.g. Annual Award Ceremony 2026"
                className="w-full px-3 py-2 rounded-lg bg-secondary/40 border border-border/60 text-foreground text-sm focus:ring-2 focus:ring-gold-500/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-secondary/40 border border-border/60 text-foreground text-sm focus:ring-2 focus:ring-gold-500/40 focus:outline-none"
              >
                <option value="Events">Corporate Events</option>
                <option value="Awards">Awards & Achievements</option>
                <option value="Office">Office & Centers</option>
                <option value="Products">Product Launches</option>
                <option value="Seminars">Seminars & Training</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <ImageUpload
                label="Gallery Photo *"
                value={form.image_url}
                onChange={(url) => setForm({ ...form, image_url: url })}
                folder="proyojon_plus/gallery"
                placeholder="Upload or paste image URL"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gold-500 text-slate-950 font-semibold text-sm hover:bg-gold-400 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Photo
            </button>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-gold-400" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <ImageIcon className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">No gallery photos yet. Click "Add Photo" to upload.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((item) => (
            <div
              key={item.id}
              className="group rounded-2xl overflow-hidden bg-card border border-border/40 relative shadow-sm hover:border-gold-500/30 transition-all"
            >
              <div className="aspect-[4/3] bg-secondary/50 overflow-hidden relative">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {item.category && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-white text-[10px] font-semibold backdrop-blur-sm">
                    {item.category}
                  </span>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/90 hover:bg-red-600 text-white transition-colors backdrop-blur-sm shadow-md z-10"
                  title="Delete image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
