"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Package,
  ShoppingCart,
  Store,
  LayoutDashboard,
  Megaphone,
  Camera,
  Settings
} from "lucide-react";

const adminTabs = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Dealers", href: "/admin/dealers", icon: Store },
  { name: "Notices", href: "/admin/notices", icon: Megaphone },
  { name: "Gallery", href: "/admin/gallery", icon: Camera },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border/30">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-gold-400/20 to-amber-500/20 flex items-center justify-center border border-gold-500/20">
          <Shield className="h-5 w-5 text-gold-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Admin Control Panel</h1>
          <p className="text-xs text-muted-foreground">Manage members, products, orders & system settings</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide bg-secondary/30 rounded-xl p-1 border border-border/30">
        {adminTabs.map((tab) => {
          const Icon = tab.icon;
          // Exact match for Overview, prefix match for sub-routes
          const isActive =
            tab.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? "bg-gradient-to-r from-gold-500 to-amber-500 text-slate-950 shadow-lg shadow-gold-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>{children}</div>
    </div>
  );
}
