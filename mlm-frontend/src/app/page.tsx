"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  ShieldCheck,
  TrendingUp,
  Award,
  Layers,
  Crown,
  Gift,
  ArrowRight,
  Sparkles,
  Users,
  Lock,
  Wallet,
  CheckCircle2,
  PhoneCall,
  Globe,
  ChevronRight,
  ShoppingBag,
  Package,
  Megaphone,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

interface FeaturedProduct {
  id: number;
  name: string;
  slug: string;
  category: string;
  price: string;
  pv_value: string;
  description: string | null;
  image_url: string | null;
}

function AnimatedStat({ value, suffix, prefix, isFloat = false }: { value: number; suffix: string; prefix: string; isFloat?: boolean }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useSpring(0, { stiffness: 40, damping: 20 });
  const displayValue = useTransform(motionValue, (latest) => {
    const val = isFloat ? latest.toFixed(1) : Math.floor(latest).toLocaleString("en-BD");
    return `${prefix}${val}${suffix}`;
  });

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [inView, value, motionValue]);

  return <motion.span ref={ref}>{displayValue}</motion.span>;
}

export default function LandingPage() {
  const [tickerNotices, setTickerNotices] = useState<{ id: number; title: string }[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [heroImage, setHeroImage] = useState<string>("/hero-3d.jpg");
  const [heroTitle, setHeroTitle] = useState<string>("");
  const [heroSubtitle, setHeroSubtitle] = useState<string>("");
  const [siteLogo, setSiteLogo] = useState<string>("/logo.jpg");
  const { user } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    // Fetch site settings
    api.get("/settings").then((res) => {
      if (res.data?.data) {
        setHeroImage(res.data.data.hero_image || "/hero-3d.jpg");
        setHeroTitle(res.data.data.hero_title || "");
        setHeroSubtitle(res.data.data.hero_subtitle || "");
        setSiteLogo(res.data.data.site_logo || "/logo.jpg");
      }
    }).catch(() => {});

    // Fetch ticker notices
    api.get("/notices/ticker").then((res) => {
      if (res.data?.data) setTickerNotices(res.data.data);
    }).catch(() => {});

    // Fetch featured products and gallery
    Promise.all([
      api.get("/products/featured"),
      api.get("/notices/gallery")
    ]).then(([prodRes, gallRes]) => {
      if (prodRes.data?.data) setFeaturedProducts(prodRes.data.data);
      if (gallRes.data?.data) setGalleryImages(gallRes.data.data);
    }).catch(() => {});
  }, []);

  const features = [
    {
      icon: TrendingUp,
      title: t.feat_1_title,
      description: t.feat_1_desc,
    },
    {
      icon: Crown,
      title: t.feat_2_title,
      description: t.feat_2_desc,
    },
    {
      icon: Lock,
      title: t.feat_3_title,
      description: t.feat_3_desc,
    },
    {
      icon: Wallet,
      title: t.feat_4_title,
      description: t.feat_4_desc,
    },
  ];

  const packages = [
    {
      name: "Customer Package",
      price: "৳ 1,000",
      pv: "1,000 PV",
      badge: "Starter",
      color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30",
      features: [
        "ID Activation Status",
        "Level 1-5 Generation Commissions",
        "Eligible for Daily ROI & Monthly Draw",
        "Instant ID-to-ID Transfers",
      ],
    },
    {
      name: "Shareholder Package",
      price: "৳ 5,000",
      pv: "5,000 SP",
      badge: "Best Value",
      color: "from-amber-500/30 via-gold-500/20 to-amber-600/10 border-gold-400 shadow-gold-500/20",
      featured: true,
      features: [
        "Everything in Customer Package",
        "Shareholder Club Membership",
        "5% Global Company Profit Pool",
        "Priority Withdrawal Processing",
      ],
    },
    {
      name: "Gold Package",
      price: "৳ 5,000",
      pv: "5,000 GP",
      badge: "High ROI",
      color: "from-purple-500/20 to-indigo-500/10 border-purple-500/30",
      features: [
        "20 TK/Day Daily ROI for 100 Days",
        "Auto-settled via Due Account",
        "Flexible Package Cancellation",
        "Full Generation Bonus Access",
      ],
    },
  ];

  const stats = [
    { label: t.stat_members, value: 15000, prefix: "", suffix: "+", isFloat: false },
    { label: t.stat_distributed, value: 5.2, prefix: "৳ ", suffix: " Crore+", isFloat: true },
    { label: t.stat_pools, value: 7, prefix: "", suffix: " Universal", isFloat: false },
    { label: t.stat_withdrawals, value: 24, prefix: "Under ", suffix: "h", isFloat: false },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-gold-500 selection:text-slate-950">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-2 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-3 z-50 shrink-0 min-w-0">
            <img src={siteLogo} alt="Proyojon Plus Logo" className="h-8 w-8 sm:h-12 sm:w-12 rounded-xl shadow-lg shadow-gold-500/20 object-cover shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[15px] sm:text-xl text-gradient-gold tracking-tight leading-tight whitespace-nowrap truncate">{t.brand_name || "Proyojon Plus"}</span>
              <span className="hidden sm:block text-[10px] text-muted-foreground uppercase tracking-widest font-semibold leading-tight mt-0.5 whitespace-nowrap">
                Investment Platform
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="/" className="hover:text-gold-400 transition-colors">{t.nav_home}</Link>
            <a href="#packages" className="hover:text-gold-400 transition-colors">{t.nav_packages}</a>
            <a href="#stats" className="hover:text-gold-400 transition-colors">{t.nav_clubs}</a>
            <Link href="/shop" className="hover:text-gold-400 transition-colors flex items-center gap-1">
              <ShoppingBag className="h-3.5 w-3.5" /> {t.nav_shop}
            </Link>
            <a href="#stats" className="hover:text-gold-400 transition-colors">{t.nav_about}</a>
          </div>

          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <LanguageSwitcher />
            {user ? (
              <Link href={user.role === "admin" ? "/admin" : "/dashboard"}>
                <Button className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold shadow-lg shadow-gold-500/20 text-[11px] sm:text-sm px-2 sm:px-4 gap-1 sm:gap-2 h-8 sm:h-10">
                  <span className="hidden sm:inline">{user.role === "admin" ? t.nav_admin : t.nav_dashboard}</span>
                  <span className="sm:hidden">Dashboard</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-foreground hover:text-gold-400 hover:bg-gold-500/10 font-semibold text-[11px] sm:text-sm px-1.5 sm:px-4 h-8 sm:h-10">
                    {t.nav_login}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold shadow-lg shadow-gold-500/20 text-[11px] sm:text-sm px-2.5 sm:px-4 gap-1 sm:gap-2 h-8 sm:h-10">
                    <span>{t.nav_register}</span>
                    <ArrowRight className="hidden sm:inline h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Notice Ticker */}
      {tickerNotices.length > 0 && (
        <div className="bg-gradient-to-r from-gold-500/10 via-amber-500/5 to-gold-500/10 border-b border-gold-500/20 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2 max-w-7xl mx-auto">
            <div className="flex items-center gap-1.5 text-gold-400 flex-shrink-0">
              <Megaphone className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Notice</span>
            </div>
            <div className="overflow-hidden flex-1">
              <div className="animate-marquee whitespace-nowrap flex gap-12">
                {[...tickerNotices, ...tickerNotices].map((notice, i) => (
                  <span key={`${notice.id}-${i}`} className="text-xs text-muted-foreground font-medium">
                    ● {notice.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 overflow-hidden">
        {/* Glowing Background Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left space-y-8 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/30 text-xs font-semibold text-gold-400 shadow-md shadow-gold-500/5"
            >
              <Sparkles className="h-4 w-4" />
              <span>{t.hero_badge}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]"
            >
              {heroTitle ? (
                <div dangerouslySetInnerHTML={{ __html: heroTitle }} />
              ) : (
                <>{t.hero_title_prefix} <span className="text-gradient-gold">{t.brand_name || "Proyojon Plus"}</span></>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-muted-foreground leading-relaxed"
            >
              {heroSubtitle || t.hero_subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 pt-4"
            >
              {user ? (
                <Link href={user.role === "admin" ? "/admin" : "/dashboard"} className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-gold-500 hover:bg-gold-400 text-slate-950 font-extrabold text-base px-8 py-6 rounded-2xl shadow-2xl shadow-gold-500/30 gap-2">
                    <span>{user.role === "admin" ? t.hero_btn_admin : t.hero_btn_dashboard}</span>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-gold-500 hover:bg-gold-400 text-slate-950 font-extrabold text-base px-8 py-6 rounded-2xl shadow-2xl shadow-gold-500/30 gap-2">
                      <span>{t.hero_btn_register}</span>
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto border-gold-500/30 text-gold-400 hover:bg-gold-500/10 font-bold text-base px-8 py-6 rounded-2xl">
                      <span>{t.hero_btn_portal}</span>
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative w-full max-w-sm mx-auto lg:max-w-none order-1 lg:order-2 mb-8 lg:mb-0"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-gold-500/20 to-amber-500/10 rounded-[3rem] blur-3xl pointer-events-none" />
            <img 
              src={heroImage || "/hero-3d.jpg"} 
              alt="3D Investment Illustration" 
              className="relative z-10 w-full h-auto rounded-[2rem] shadow-2xl shadow-gold-500/10 border border-white/10 object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section id="stats" className="py-12 border-y border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-gradient-gold">
                  <AnimatedStat value={stat.value} prefix={stat.prefix} suffix={stat.suffix} isFloat={stat.isFloat} />
                </div>
                <div className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {t.feat_title} <span className="text-gradient-gold">{t.brand_name || "Proyojon Plus"}</span>?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t.feat_subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="p-6 rounded-3xl bg-card/60 border border-border/60 hover:border-gold-500/30 transition-all duration-300 hover:shadow-xl space-y-4"
              >
                <div className="h-12 w-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Packages Section */}
      <section id="packages" className="py-24 border-t border-border/40 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {t.pkg_title} <span className="text-gradient-gold">{t.nav_packages}</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t.pkg_subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg, i) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`p-8 rounded-3xl bg-card border ${pkg.color} flex flex-col justify-between space-y-6 relative ${
                  pkg.featured ? "shadow-2xl scale-105 z-10" : ""
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/30">
                      {pkg.badge}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{pkg.pv}</span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{pkg.name}</h3>
                    <div className="text-4xl font-extrabold text-gradient-gold mt-2">{pkg.price}</div>
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-border/40 text-xs text-foreground/90">
                    {pkg.features.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href="/register">
                  <Button className={`w-full py-6 rounded-xl font-bold text-sm ${
                    pkg.featured
                      ? "bg-gold-500 hover:bg-gold-400 text-slate-950 shadow-lg shadow-gold-500/20"
                      : "bg-secondary text-foreground hover:bg-gold-500/10 hover:text-gold-400 border border-border"
                  }`}>
                    {t.pkg_btn_activate}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400 text-xs font-semibold tracking-wider uppercase">
                <ImageIcon className="h-3.5 w-3.5" />
                Latest Events
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Our <span className="text-gradient-gold">Gallery</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.map((img, i) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl aspect-[4/3] bg-card border border-border"
                >
                  <img
                    src={img.image_url}
                    alt={img.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <h3 className="text-lg font-bold text-white">{img.title}</h3>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center pt-8">
              <Link href="/gallery">
                <Button className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold px-8 rounded-xl shadow-lg shadow-gold-500/20">
                  View Full Gallery
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-card/30">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400 text-xs font-semibold tracking-wider uppercase">
                <ShoppingBag className="h-3.5 w-3.5" />
                {t.prod_badge}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">{t.prod_title}</h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm">
                {t.prod_subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {featuredProducts.slice(0, 8).map((product) => (
                <motion.div
                  key={product.id}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl bg-card border border-border/40 hover:border-gold-500/30 overflow-hidden transition-shadow hover:shadow-xl hover:shadow-gold-500/5"
                >
                  <div className="relative h-40 bg-gradient-to-br from-secondary/80 to-secondary/40 flex items-center justify-center">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-10 w-10 text-muted-foreground/40" />
                    )}
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-gold-500/90 text-slate-950 text-xs font-bold">
                      {parseFloat(product.pv_value)} PV
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-lg font-bold text-foreground">৳{parseFloat(product.price).toFixed(0)}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-500/80">
                        {product.category}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Link href="/shop">
                <Button className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold shadow-lg shadow-gold-500/20 text-sm gap-2 px-8 py-3">
                  <ShoppingBag className="h-4 w-4" />
                  {t.prod_btn_visit}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-border/40 bg-card/60 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-3">
                <img src={siteLogo} alt="Proyojon Plus Logo" className="h-10 w-10 rounded-xl shadow-lg shadow-gold-500/20 object-cover" />
                <span className="font-bold text-xl text-foreground">{t.brand_name || "Proyojon Plus"}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.footer_desc}
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">{t.footer_company}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-gold-400 transition-colors">{t.nav_about}</a></li>
                <li><a href="#packages" className="hover:text-gold-400 transition-colors">{t.nav_packages}</a></li>
                <li><a href="#features" className="hover:text-gold-400 transition-colors">Features</a></li>
                <li><a href="#stats" className="hover:text-gold-400 transition-colors">Statistics</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">{t.footer_support}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-gold-400 transition-colors">{t.footer_help}</a></li>
                <li><a href="#" className="hover:text-gold-400 transition-colors">Contact Admin</a></li>
                <li><a href="#" className="hover:text-gold-400 transition-colors">{t.footer_terms}</a></li>
                <li><a href="#" className="hover:text-gold-400 transition-colors">{t.footer_privacy}</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">{t.footer_contact}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-gold-400" />
                  <a href="tel:+8801777000000" className="hover:text-gold-400 transition-colors">+880 1777-000000</a>
                </li>
                <li className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gold-400" />
                  <span>Dhaka, Bangladesh</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} {t.brand_name || "Proyojon Plus"}. {t.footer_rights}</p>
            <div className="flex items-center gap-6">
              <Link href="/login" className="hover:text-gold-400 transition-colors font-medium">{t.footer_login_portal}</Link>
              <Link href="/register" className="hover:text-gold-400 transition-colors font-medium">{t.footer_create_acc}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
