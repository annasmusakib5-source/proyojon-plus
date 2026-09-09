"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Loader2,
} from "lucide-react";

interface OrderItem {
  id: number;
  product_name: string;
  product_slug: string;
  image_url: string | null;
  quantity: number;
  unit_price: string;
  unit_pv: string;
}

interface Order {
  id: number;
  total_price: string;
  total_pv: string;
  status: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_district: string | null;
  payment_method: string;
  pv_credited: number;
  created_at: string;
  items: OrderItem[];
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock className="h-4 w-4" />, color: "text-amber-400 bg-amber-500/10 border-amber-500/30", label: "Pending" },
  confirmed: { icon: <CheckCircle2 className="h-4 w-4" />, color: "text-blue-400 bg-blue-500/10 border-blue-500/30", label: "Confirmed" },
  processing: { icon: <Package className="h-4 w-4" />, color: "text-purple-400 bg-purple-500/10 border-purple-500/30", label: "Processing" },
  shipped: { icon: <Truck className="h-4 w-4" />, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30", label: "Shipped" },
  delivered: { icon: <CheckCircle2 className="h-4 w-4" />, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", label: "Delivered" },
  cancelled: { icon: <XCircle className="h-4 w-4" />, color: "text-red-400 bg-red-500/10 border-red-500/30", label: "Cancelled" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders");
      setOrders(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold-400/20 to-amber-500/20 flex items-center justify-center border border-gold-500/20">
              <ShoppingBag className="h-5 w-5 text-gold-400" />
            </div>
            My Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track your product orders and PV credits</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto" />
          <h2 className="text-xl font-semibold text-muted-foreground">No orders yet</h2>
          <p className="text-sm text-muted-foreground/70">
            Visit our Product Store to place your first order!
          </p>
          <a
            href="/shop"
            className="inline-flex items-center gap-2 mt-3 px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-slate-950 font-semibold text-sm"
          >
            <Package className="h-4 w-4" />
            Go to Shop
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const isExpanded = expandedOrder === order.id;

            return (
              <div
                key={order.id}
                className="rounded-2xl bg-card border border-border/40 overflow-hidden hover:border-gold-500/20 transition-all"
              >
                {/* Order Header */}
                <button
                  onClick={() => toggleExpand(order.id)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${status.color}`}>
                      {status.icon}
                      {status.label}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Order #{order.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">৳{parseFloat(order.total_price).toFixed(0)}</p>
                      <p className="text-xs text-gold-400 font-medium">
                        {parseFloat(order.total_pv).toFixed(0)} PV
                        {order.pv_credited ? " ✅" : ""}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border/30 p-5 space-y-4 bg-secondary/10">
                    {/* Items */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Items</h4>
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 text-sm">
                          <div className="h-10 w-10 rounded-lg bg-secondary/60 flex items-center justify-center flex-shrink-0">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{item.product_name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              ৳{parseFloat(item.unit_price).toFixed(0)} × {item.quantity} | {parseFloat(item.unit_pv).toFixed(0)} PV each
                            </p>
                          </div>
                          <p className="text-xs font-semibold">
                            ৳{(parseFloat(item.unit_price) * item.quantity).toFixed(0)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Shipping Info */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <h4 className="font-semibold uppercase text-muted-foreground tracking-wider">Shipping</h4>
                        <p className="text-foreground">{order.shipping_name}</p>
                        <p className="text-muted-foreground">{order.shipping_phone}</p>
                        <p className="text-muted-foreground">{order.shipping_address}</p>
                        {order.shipping_district && (
                          <p className="text-muted-foreground">{order.shipping_district}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold uppercase text-muted-foreground tracking-wider">Payment</h4>
                        <p className="text-foreground capitalize">
                          {order.payment_method.replace(/_/g, " ")}
                        </p>
                        {order.pv_credited ? (
                          <p className="text-emerald-400 font-medium mt-2">
                            ✅ {parseFloat(order.total_pv).toFixed(0)} PV credited to your account
                          </p>
                        ) : (
                          <p className="text-muted-foreground mt-2">
                            PV will be credited after delivery
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
