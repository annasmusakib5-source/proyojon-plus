"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/axios";
import { useCartStore } from "@/store/cartStore";
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  Package,
  Heart,
  Share2,
  AlertCircle,
  Truck,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

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
  dealer_commission_percentage: string;
}

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const { addItem, items } = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${slug}`);
        if (res.data.success) {
          setProduct(res.data.data);
        } else {
          setError("Product not found");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: parseFloat(product.price),
      pvValue: parseFloat(product.pv_value),
      imageUrl: product.image_url,
      stock: product.stock,
    }, quantity);
    
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/cart");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4 p-4">
        <AlertCircle className="h-16 w-16 text-red-500/50" />
        <h1 className="text-2xl font-bold text-foreground">Product Not Found</h1>
        <p className="text-muted-foreground">{error}</p>
        <Link href="/shop" className="px-6 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
          Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate max-w-[50%]">
            <Link href="/shop" className="hover:text-gold-400">Shop</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="capitalize">{product.category}</span>
          </div>

          <Link
            href="/cart"
            className="relative flex items-center justify-center h-10 w-10 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ShoppingCart className="h-5 w-5 text-foreground" />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-[10px] font-bold bg-gold-400 text-slate-950 rounded-full">
                {items.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-3xl bg-secondary/40 border border-border/40 overflow-hidden flex items-center justify-center relative">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="h-24 w-24 text-muted-foreground/30" />
              )}
              
              {product.is_featured === 1 && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-amber-500/90 text-slate-950 text-xs font-bold uppercase tracking-wider shadow-lg">
                  Featured
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="flex flex-col space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gold-500/80 bg-gold-500/10 px-3 py-1 rounded-full">
                  {product.category}
                </span>
                <div className="flex gap-2">
                  <button className="h-10 w-10 rounded-full bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Heart className="h-5 w-5" />
                  </button>
                  <button className="h-10 w-10 rounded-full bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                {product.name}
              </h1>
            </div>

            <div className="flex items-end gap-4">
              <p className="text-4xl font-extrabold text-foreground">
                ৳{parseFloat(product.price).toFixed(0)}
              </p>
              <div className="px-3 py-1.5 rounded-lg bg-gold-500/20 border border-gold-500/30 text-gold-400 font-bold flex items-center gap-1.5 mb-1">
                <span>{parseFloat(product.pv_value)} PV</span>
              </div>
            </div>

            <div className="prose prose-sm prose-invert text-muted-foreground">
              <p className="leading-relaxed">
                {product.description || "High-quality product designed to meet your daily needs. Order today and earn PV points directly into your Proyojon Plus account!"}
              </p>
            </div>

            <div className="pt-6 border-t border-border/40 space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-foreground">Quantity:</span>
                <div className="flex items-center gap-2 p-1 rounded-xl bg-secondary/40 border border-border/40">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-card hover:text-foreground transition-all"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-card hover:text-foreground transition-all disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-sm">
                  {product.stock > 0 ? (
                    <span className="text-emerald-400 font-medium">In Stock ({product.stock} available)</span>
                  ) : (
                    <span className="text-red-400 font-medium">Out of Stock</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    added 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {added ? (
                    <>
                      <Check className="h-5 w-5" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      Add to Cart
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-slate-950 font-extrabold hover:from-gold-400 hover:to-amber-400 shadow-lg shadow-gold-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
              </div>
            </div>

            {/* Guarantees */}
            <div className="pt-6 grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/20">
                <Truck className="h-6 w-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Fast Delivery</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Inside & Outside Dhaka</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/20">
                <ShieldCheck className="h-6 w-6 text-blue-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">100% Authentic</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Quality guaranteed</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
