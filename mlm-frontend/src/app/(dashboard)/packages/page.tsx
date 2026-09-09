"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, Crown, Layers, CheckCircle2, AlertTriangle, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";

interface UserPackage {
  user_package_id: number;
  package_name: string;
  created_at: string;
  status?: string;
  activated_at?: string;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingType, setBuyingType] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get("/packages");
      if (res.data?.success) {
        setPackages(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch active packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handlePurchase = async (packageType: string) => {
    try {
      setBuyingType(packageType);
      const res = await api.post("/packages/purchase", { package_type: packageType });
      if (res.data?.success) {
        toast.success(res.data.message || `Successfully purchased ${packageType} package!`);
        fetchPackages();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Package purchase failed");
    } finally {
      setBuyingType(null);
    }
  };

  const handleCancelGold = async (packageId: number) => {
    try {
      setCancellingId(packageId);
      const res = await api.post(`/packages/${packageId}/cancel`);
      if (res.data?.success) {
        toast.success("Gold package cancelled and due account settled.");
        fetchPackages();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel Gold package");
    } finally {
      setCancellingId(null);
    }
  };

  const packagePlans = [
    {
      type: "customer",
      name: "Customer Package",
      price: "৳ 1,000",
      pv: "1,000 PV",
      badge: "Standard",
      icon: Package,
      gradient: "from-blue-500/20 to-cyan-500/10 border-blue-500/30",
      features: [
        "Unlocks ID Activation Status",
        "Level 1-5 Direct Referral Commissions",
        "Eligible for Daily ROI & Monthly Prize Draw",
        "Full ID-to-ID Transfer access",
      ],
    },
    {
      type: "shareholder",
      name: "Shareholder Package",
      price: "৳ 5,000",
      pv: "5,000 SP",
      badge: "Popular",
      icon: Layers,
      gradient: "from-amber-500/20 to-gold-500/10 border-gold-500/40",
      features: [
        "Everything in Customer Package",
        "Shareholder Club Membership",
        "5% Global Company Profit Sharing",
        "Higher Priority Withdrawal Processing",
      ],
    },
    {
      type: "gold",
      name: "Gold Package",
      price: "৳ 5,000",
      pv: "5,000 GP",
      badge: "Premium ROI",
      icon: Crown,
      gradient: "from-yellow-500/30 via-amber-500/20 to-gold-500/10 border-gold-400",
      features: [
        "20 TK/Day Daily ROI for 100 Days (Total 2,000 TK)",
        "Auto-deducts 2,000 TK from future earnings (Due Account)",
        "Cancellation option available at any time",
        "Full Generation Bonus access",
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Package className="h-6 w-6 text-gold-400" />
          <span>Investment Packages</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose a package to activate your ID and start earning generation bonuses and club rewards.
        </p>
      </div>

      {/* Package Plans Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packagePlans.map((plan, i) => {
          const Icon = plan.icon;
          const isBuying = buyingType === plan.type;
          return (
            <motion.div
              key={plan.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <Card className={`bg-card/70 border ${plan.gradient} shadow-xl flex flex-col justify-between h-full relative overflow-hidden`}>
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold-500/10 text-gold-400 border border-gold-500/30">
                      {plan.badge}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-foreground">{plan.name}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">{plan.pv}</CardDescription>
                  </div>
                  <div className="text-3xl font-extrabold text-gradient-gold">{plan.price}</div>
                </CardHeader>

                <CardContent className="space-y-3 flex-1 pt-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Included Benefits</div>
                  <ul className="space-y-2 text-xs">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 text-foreground/90">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-4 border-t border-border/40">
                  <Button
                    onClick={() => handlePurchase(plan.type)}
                    disabled={isBuying}
                    className="w-full bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold gap-2 shadow-lg shadow-gold-500/20"
                  >
                    {isBuying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    <span>Buy {plan.name}</span>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* User's Active Packages Section */}
      <div className="space-y-4 pt-6 border-t border-border/40">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Crown className="h-5 w-5 text-gold-400" />
          <span>My Purchased Packages</span>
        </h3>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin text-gold-400" />
            <span>Loading packages...</span>
          </div>
        ) : packages.length === 0 ? (
          <Card className="bg-card/40 border border-border/40 p-6 text-center text-muted-foreground text-sm">
            No active packages found. Purchase a package above to activate your account!
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {packages.map((pkg, idx) => (
              <Card key={pkg.user_package_id || idx} className="bg-card/80 border border-gold-500/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gradient-gold capitalize text-base">
                    {pkg.package_name} Package
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Purchased: {new Date(pkg.activated_at || Date.now()).toLocaleDateString()}
                </p>

                {pkg.package_name === "Gold" && (
                  <div className="pt-2 border-t border-border/40">
                    <Dialog>
                      <DialogTrigger className="w-full inline-flex items-center justify-center rounded-md border border-rose-500/30 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 gap-2 font-medium">
                        <AlertTriangle className="h-3.5 w-3.5" /> Cancel Gold Package
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle className="text-rose-400 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" /> Cancel Gold Package
                          </DialogTitle>
                          <DialogDescription className="text-muted-foreground text-xs leading-relaxed pt-2">
                            Cancelling your Gold Package will immediately stop your 20 TK/Day daily ROI. Any remaining Due Account balance will be paid off from your package.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0 pt-4">
                          <Button
                            variant="destructive"
                            onClick={() => handleCancelGold(pkg.user_package_id)}
                            disabled={cancellingId === pkg.user_package_id}
                            className="w-full sm:w-auto"
                          >
                            {cancellingId === pkg.user_package_id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Cancel"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
