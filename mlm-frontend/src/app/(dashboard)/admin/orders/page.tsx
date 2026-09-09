"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";
import {
  ShoppingCart,
  Loader2,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  unit_pv: string;
}

interface Order {
  id: number;
  user_id: number;
  user_phone: string;
  total_price: string;
  total_pv: string;
  status: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  payment_method: string;
  pv_credited: number;
  created_at: string;
  items: OrderItem[];
}

const statusOptions = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  processing: "bg-purple-500/20 text-purple-400",
  shipped: "bg-cyan-500/20 text-cyan-400",
  delivered: "bg-emerald-500/20 text-emerald-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => { fetchOrders(); }, [filter]);

  const fetchOrders = async () => {
    try {
      const params: Record<string, string> = {};
      if (filter) params.status = filter;
      const res = await api.get("/admin/orders", { params });
      setOrders(res.data.data || []);
    } catch { toast.error("Failed to fetch orders"); }
    finally { setLoading(false); }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    setUpdating(orderId);
    try {
      const res = await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      toast.success(res.data.message || "Status updated");
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally { setUpdating(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-gold-400" />
          Order Management
        </h1>
        <div className="flex gap-2 overflow-x-auto">
          <button onClick={() => setFilter("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!filter ? "bg-gold-500 text-slate-950" : "bg-secondary/40 text-muted-foreground hover:text-foreground"}`}>
            All
          </button>
          {statusOptions.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === s ? "bg-gold-500 text-slate-950" : "bg-secondary/40 text-muted-foreground hover:text-foreground"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gold-400" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl bg-card border border-border/40 overflow-hidden">
              <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${statusColors[order.status] || ""}`}>
                    {order.status}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Order #{order.id}</p>
                    <p className="text-xs text-muted-foreground">
                      User #{order.user_id} • {order.user_phone} • {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold">৳{parseFloat(order.total_price).toFixed(0)}</p>
                    <p className="text-xs text-gold-400">{parseFloat(order.total_pv).toFixed(0)} PV {order.pv_credited ? "✅" : ""}</p>
                  </div>
                  {expandedId === order.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {expandedId === order.id && (
                <div className="border-t border-border/30 p-4 space-y-4 bg-secondary/10">
                  {/* Items */}
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span>{item.product_name} × {item.quantity}</span>
                        <span className="font-medium">৳{(parseFloat(item.unit_price) * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Shipping */}
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p><span className="font-medium text-foreground">Ship to:</span> {order.shipping_name} • {order.shipping_phone}</p>
                    <p>{order.shipping_address}</p>
                    <p>Payment: {order.payment_method.replace(/_/g, " ")}</p>
                  </div>

                  {/* Status Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground mr-2">Update Status:</span>
                    {statusOptions.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusUpdate(order.id, s)}
                        disabled={updating === order.id || order.status === s}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize transition-all disabled:opacity-30 ${
                          order.status === s ? "bg-gold-500 text-slate-950" : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60"
                        }`}
                      >
                        {updating === order.id ? "..." : s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
