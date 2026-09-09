"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { api } from "@/lib/axios";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  User,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Home,
  ChevronRight,
} from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalPv, getTotalItems } = useCartStore();
  const [isCheckout, setIsCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderId: number; totalPv: number } | null>(null);
  const [error, setError] = useState("");

  // Checkout form state
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingDistrict, setShippingDistrict] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");

  const totalPrice = getTotalPrice();
  const totalPv = getTotalPv();
  const totalItems = getTotalItems();

  const handlePlaceOrder = async () => {
    setError("");

    if (!shippingName || !shippingPhone || !shippingAddress) {
      setError("Please fill in all required shipping fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/orders", {
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        shippingName,
        shippingPhone,
        shippingAddress,
        shippingDistrict,
        paymentMethod,
      });

      if (res.data.success) {
        setOrderSuccess({
          orderId: res.data.data.orderId,
          totalPv: res.data.data.totalPv,
        });
        clearCart();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Order Success State
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-card border border-emerald-500/30 shadow-2xl">
          <div className="h-20 w-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Order Placed Successfully!</h1>
            <p className="text-sm text-muted-foreground">
              Your order <span className="text-gold-400 font-semibold">#{orderSuccess.orderId}</span> has been placed.
              Admin will review and confirm your order shortly.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gold-500/10 border border-gold-500/20">
            <p className="text-sm text-gold-400 font-medium">
              🎯 You will earn <span className="text-lg font-bold">{orderSuccess.totalPv.toFixed(0)} PV</span> points
              when this order is delivered!
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/orders"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-slate-950 font-semibold text-sm hover:from-gold-400 hover:to-amber-400 transition-all"
            >
              View My Orders
            </Link>
            <Link
              href="/shop"
              className="flex-1 py-3 rounded-xl bg-secondary/60 border border-border/40 text-foreground font-semibold text-sm hover:bg-secondary transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-bold text-foreground">
              {isCheckout ? "Checkout" : "Shopping Cart"}
            </h1>
          </div>
          {!isCheckout && items.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {items.length === 0 && !orderSuccess ? (
          /* Empty Cart */
          <div className="text-center py-20 space-y-4">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <h2 className="text-xl font-semibold text-muted-foreground">Your cart is empty</h2>
            <p className="text-sm text-muted-foreground/70">
              Browse our product catalog and add items to your cart.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 mt-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-slate-950 font-semibold text-sm hover:from-gold-400 hover:to-amber-400 transition-all"
            >
              <Package className="h-4 w-4" />
              Browse Products
            </Link>
          </div>
        ) : isCheckout ? (
          /* Checkout Form */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Shipping Form */}
            <div className="lg:col-span-3 space-y-5">
              <div className="p-6 rounded-2xl bg-card border border-border/40 space-y-5">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Truck className="h-5 w-5 text-gold-400" />
                  Shipping Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={shippingName}
                        onChange={(e) => setShippingName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/40 border border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-gold-500/40 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="tel"
                        value={shippingPhone}
                        onChange={(e) => setShippingPhone(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/40 border border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-gold-500/40 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
                      Delivery Address *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <textarea
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        rows={3}
                        placeholder="Full delivery address (House, Road, Area, City)"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/40 border border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-gold-500/40 text-sm resize-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
                      District (Optional)
                    </label>
                    <input
                      type="text"
                      value={shippingDistrict}
                      onChange={(e) => setShippingDistrict(e.target.value)}
                      placeholder="e.g. Dhaka, Chittagong"
                      className="w-full px-4 py-3 rounded-xl bg-secondary/40 border border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-gold-500/40 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="p-6 rounded-2xl bg-card border border-border/40 space-y-4">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-gold-400" />
                  Payment Method
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { value: "cash_on_delivery", label: "Cash on Delivery", icon: "💵" },
                    { value: "bkash", label: "bKash", icon: "📱" },
                    { value: "nagad", label: "Nagad", icon: "📲" },
                    { value: "bank_transfer", label: "Bank Transfer", icon: "🏦" },
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        paymentMethod === method.value
                          ? "bg-gold-500/20 border-2 border-gold-500/50 text-gold-400"
                          : "bg-secondary/40 border border-border/40 text-muted-foreground hover:border-gold-500/30"
                      }`}
                    >
                      <span className="text-lg">{method.icon}</span>
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="sticky top-[61px] p-6 rounded-2xl bg-card border border-border/40 space-y-4">
                <h2 className="text-base font-semibold text-foreground">Order Summary</h2>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 text-sm">
                      <div className="h-10 w-10 rounded-lg bg-secondary/60 flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">x{item.quantity}</p>
                      </div>
                      <p className="text-xs font-semibold">৳{(item.price * item.quantity).toFixed(0)}</p>
                    </div>
                  ))}
                </div>

                <hr className="border-border/40" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">৳{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-emerald-400 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-gold-400">
                    <span>Total PV Earned</span>
                    <span className="font-bold">{totalPv.toFixed(0)} PV</span>
                  </div>
                  <hr className="border-border/40" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>৳{totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-slate-950 font-bold text-sm hover:from-gold-400 hover:to-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Place Order
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsCheckout(false)}
                  className="w-full py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  ← Back to Cart
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Cart Items View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/40 hover:border-gold-500/20 transition-all"
                >
                  {/* Product Image */}
                  <div className="h-20 w-20 rounded-xl bg-secondary/60 flex items-center justify-center flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover rounded-xl" />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground/50" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">{item.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>৳{item.price.toFixed(0)} each</span>
                      <span className="text-gold-400 font-medium">{item.pvValue} PV each</span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="h-8 w-8 rounded-lg bg-secondary/60 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-gold-500/30 transition-all"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="h-8 w-8 rounded-lg bg-secondary/60 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-gold-500/30 transition-all disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right min-w-[80px]">
                    <p className="text-sm font-bold">৳{(item.price * item.quantity).toFixed(0)}</p>
                    <p className="text-[10px] text-gold-400 font-medium">{(item.pvValue * item.quantity).toFixed(0)} PV</p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Cart Summary Sidebar */}
            <div>
              <div className="sticky top-[61px] p-6 rounded-2xl bg-card border border-border/40 space-y-5">
                <h2 className="text-base font-semibold text-foreground">Cart Summary</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items ({totalItems})</span>
                    <span className="font-medium">৳{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-emerald-400 font-medium">Free</span>
                  </div>
                  <hr className="border-border/40" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>৳{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gold-500/10 border border-gold-500/20 text-center">
                    <p className="text-xs text-muted-foreground">PV Points to Earn</p>
                    <p className="text-xl font-bold text-gold-400">{totalPv.toFixed(0)} PV</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCheckout(true)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-slate-950 font-bold text-sm hover:from-gold-400 hover:to-amber-400 transition-all shadow-lg shadow-gold-500/20"
                >
                  Proceed to Checkout
                </button>

                <Link
                  href="/shop"
                  className="block w-full text-center py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
