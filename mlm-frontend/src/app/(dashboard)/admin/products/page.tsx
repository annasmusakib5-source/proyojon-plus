"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  Loader2,
  Search,
  X,
  Save,
} from "lucide-react";
import ImageUpload from "@/components/ui/ImageUpload";

interface Product {
  id: number;
  name: string;
  slug: string;
  category: string;
  price: string;
  pv_value: string;
  description: string | null;
  image_url: string | null;
  stock: number;
  is_featured: number;
  status: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "", category: "other", price: "", pv_value: "", description: "",
    image_url: "", stock: "0", is_featured: false, dealer_commission_percentage: "5",
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/admin/products");
      setProducts(res.data.data || []);
    } catch { toast.error("Failed to fetch products"); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ name: "", category: "other", price: "", pv_value: "", description: "", image_url: "", stock: "0", is_featured: false, dealer_commission_percentage: "5" });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      pv_value: product.pv_value,
      description: product.description || "",
      image_url: product.image_url || "",
      stock: String(product.stock),
      is_featured: product.is_featured === 1,
      dealer_commission_percentage: "5",
    });
    setEditId(product.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.pv_value) {
      toast.error("Name, price, and PV value are required");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/admin/products/${editId}`, form);
        toast.success("Product updated");
      } else {
        await api.post("/admin/products", form);
        toast.success("Product created");
      }
      resetForm();
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deactivate this product?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success("Product deactivated");
      fetchProducts();
    } catch { toast.error("Failed to delete product"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Package className="h-5 w-5 text-gold-400" />
          Product Management
        </h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-slate-950 text-sm font-semibold hover:from-gold-400 hover:to-amber-400 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Product Form */}
      {showForm && (
        <div className="p-6 rounded-2xl bg-card border border-gold-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gold-400">
              {editId ? `Edit Product #${editId}` : "New Product"}
            </h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-secondary/40 border border-border/60 text-foreground text-sm focus:ring-2 focus:ring-gold-500/40 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-secondary/40 border border-border/60 text-foreground text-sm focus:ring-2 focus:ring-gold-500/40 focus:outline-none">
                <option value="healthcare">Healthcare</option>
                <option value="grocery">Grocery</option>
                <option value="organic">Organic</option>
                <option value="cosmetics">Cosmetics</option>
                <option value="accessories">Accessories</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Price (BDT) *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-secondary/40 border border-border/60 text-foreground text-sm focus:ring-2 focus:ring-gold-500/40 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">PV Value *</label>
              <input type="number" value={form.pv_value} onChange={(e) => setForm({ ...form, pv_value: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-secondary/40 border border-border/60 text-foreground text-sm focus:ring-2 focus:ring-gold-500/40 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Stock</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-secondary/40 border border-border/60 text-foreground text-sm focus:ring-2 focus:ring-gold-500/40 focus:outline-none" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <ImageUpload
                label="Product Image"
                value={form.image_url}
                onChange={(url) => setForm({ ...form, image_url: url })}
                folder="proyojon_plus/products"
                placeholder="https://res.cloudinary.com/... or paste image link"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full px-3 py-2 rounded-lg bg-secondary/40 border border-border/60 text-foreground text-sm focus:ring-2 focus:ring-gold-500/40 focus:outline-none resize-none" />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                className="rounded border-gold-500/40" />
              Featured Product
            </label>
            <button onClick={handleSave} disabled={saving}
              className="ml-auto flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gold-500 text-slate-950 font-semibold text-sm hover:bg-gold-400 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gold-400" /></div>
      ) : (
        <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-xs text-muted-foreground uppercase">
                  <th className="text-left px-4 py-3">Product</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-right px-4 py-3">Price</th>
                  <th className="text-right px-4 py-3">PV</th>
                  <th className="text-right px-4 py-3">Stock</th>
                  <th className="text-center px-4 py-3">Featured</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-border/20 hover:bg-secondary/20">
                    <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{p.category}</td>
                    <td className="px-4 py-3 text-right font-semibold">৳{parseFloat(p.price).toFixed(0)}</td>
                    <td className="px-4 py-3 text-right text-gold-400 font-semibold">{parseFloat(p.pv_value).toFixed(0)}</td>
                    <td className="px-4 py-3 text-right">{p.stock}</td>
                    <td className="px-4 py-3 text-center">{p.is_featured ? "⭐" : "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg hover:bg-gold-500/10 text-gold-400"><Edit3 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
