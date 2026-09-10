"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/axios";
import { useCartStore, CartItem } from "@/store/cartStore";
import {
  ShoppingCart,
  Search,
  Filter,
  Star,
  Plus,
  Minus,
  Check,
  Leaf,
  Heart,
  Sparkles,
  Package,
  ChevronRight,
  Home,
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
}

const categoryLabels: Record<string, string> = {
  all: "All Products",
  healthcare: "Healthcare",
  grocery: "Grocery",
  organic: "Organic",
  cosmetics: "Cosmetics",
  accessories: "Accessories",
  other: "Other",
};

const categoryIcons: Record<string, React.ReactNode> = {
  healthcare: <Heart className="h-4 w-4" />,
  grocery: <Package className="h-4 w-4" />,
  organic: <Leaf className="h-4 w-4" />,
  cosmetics: <Sparkles className="h-4 w-4" />,
  accessories: <Star className="h-4 w-4" />,
};

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [addedId, setAddedId] = useState<number | null>(null);

  const { addItem, items, getTotalItems, getTotalPrice, getTotalPv } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (category !== "all") params.category = category;
        if (search) params.search = search;
        const res = await api.get("/products", { params });
        setProducts(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category, search]);

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: parseFloat(product.price),
      pvValue: parseFloat(product.pv_value),
      imageUrl: product.image_url,
      stock: product.stock,
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const getCartQuantity = (productId: number) => {
    const item = items.find((i) => i.productId === productId);
    return item?.quantity || 0;
  };

  const totalItems = getTotalItems();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-5 w-5" />
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <h1 className="text-lg font-bold bg-gradient-to-r from-gold-400 to-amber-500 bg-clip-text text-transparent">
              Product Store
            </h1>
          </div>
          <Link
            href="/cart"
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500/20 to-amber-500/10 border border-gold-500/30 text-gold-400 font-semibold text-sm hover:from-gold-500/30 hover:to-amber-500/20 transition-all"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Cart</span>
            {mounted && totalItems > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-[10px] font-bold bg-gold-400 text-slate-950 rounded-full shadow-lg">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/40 transition-all text-sm"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  category === key
                    ? "bg-gradient-to-r from-gold-500 to-amber-500 text-slate-950 shadow-lg shadow-gold-500/20"
                    : "bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-gold-500/30"
                }`}
              >
                {categoryIcons[key] && categoryIcons[key]}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Cart Summary Bar (sticky) */}
        {totalItems > 0 && (
          <div className="sticky top-[61px] z-40 flex items-center justify-between px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 backdrop-blur-sm">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-emerald-400 font-semibold">{totalItems} items in cart</span>
              <span className="text-muted-foreground">
                Total: <span className="text-foreground font-bold">৳{getTotalPrice().toFixed(2)}</span>
              </span>
              <span className="text-muted-foreground">
                PV: <span className="text-gold-400 font-bold">{getTotalPv().toFixed(0)}</span>
              </span>
            </div>
            <Link
              href="/cart"
              className="px-5 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition-colors"
            >
              View Cart →
            </Link>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-card border border-border/40 p-5 space-y-4">
                <div className="h-44 rounded-xl bg-secondary/60" />
                <div className="h-4 rounded-full bg-secondary/60 w-3/4" />
                <div className="h-3 rounded-full bg-secondary/40 w-1/2" />
                <div className="flex justify-between items-center">
                  <div className="h-5 rounded-full bg-secondary/60 w-20" />
                  <div className="h-8 rounded-lg bg-secondary/40 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Package className="h-16 w-16 text-muted-foreground/40 mx-auto" />
            <h2 className="text-xl font-semibold text-muted-foreground">No products found</h2>
            <p className="text-sm text-muted-foreground/70">
              Try changing the category or search term.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => {
              const inCart = getCartQuantity(product.id);
              const isAdded = addedId === product.id;

              return (
                <div
                  key={product.id}
                  className="group rounded-2xl bg-card border border-border/40 hover:border-gold-500/30 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gold-500/5"
                >
                  {/* Product Image */}
                  <Link href={`/shop/${product.slug}`} className="relative h-48 bg-gradient-to-br from-secondary/80 to-secondary/40 flex items-center justify-center overflow-hidden block">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                        <Package className="h-12 w-12" />
                        <span className="text-xs">{categoryLabels[product.category] || product.category}</span>
                      </div>
                    )}

                    {/* PV Badge */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-gold-500/90 text-slate-950 text-xs font-bold shadow-lg">
                      {parseFloat(product.pv_value)} PV
                    </div>

                    {/* Featured Badge */}
                    {product.is_featured === 1 && (
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-amber-500/90 text-slate-950 text-[10px] font-bold uppercase tracking-wider">
                        Featured
                      </div>
                    )}

                      {/* Stock Warning */}
                      {product.stock <= 10 && product.stock > 0 && (
                        <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-red-500/80 text-white text-[10px] font-medium">
                          Only {product.stock} left
                        </div>
                      )}
                  </Link>

                  {/* Product Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-500/80">
                        {categoryLabels[product.category] || product.category}
                      </span>
                      <Link href={`/shop/${product.slug}`} className="block mt-0.5">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug hover:text-gold-400 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                    </div>

                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <p className="text-lg font-bold text-foreground">
                          ৳{parseFloat(product.price).toFixed(0)}
                        </p>
                        {product.stock > 0 ? (
                          <p className="text-[10px] text-emerald-400 font-medium">In Stock</p>
                        ) : (
                          <p className="text-[10px] text-red-400 font-medium">Out of Stock</p>
                        )}
                      </div>

                      {product.stock > 0 ? (
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={isAdded}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                            isAdded
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : inCart > 0
                              ? "bg-gold-500/20 text-gold-400 border border-gold-500/30 hover:bg-gold-500/30"
                              : "bg-gradient-to-r from-gold-500 to-amber-500 text-slate-950 hover:from-gold-400 hover:to-amber-400 shadow-md shadow-gold-500/20"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Added
                            </>
                          ) : inCart > 0 ? (
                            <>
                              <Plus className="h-3.5 w-3.5" />
                              Add More ({inCart})
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-3.5 w-3.5" />
                              Add to Cart
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground bg-secondary/40 border border-border/40">
                          Sold Out
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
