"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Truck,
  Search,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth-utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
};

const NAV_ITEMS: NavItem[] = [
  // Universal
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["SALES", "OPS", "PRODUCT", "ADMIN"],
  },
  // Sales workspace
  {
    label: "Search Products",
    href: "/search",
    icon: Search,
    roles: ["SALES", "ADMIN"],
  },
  {
    label: "My Bookings",
    href: "/bookings",
    icon: Calendar,
    roles: ["SALES", "OPS", "ADMIN"],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["OPS", "ADMIN", "SALES"],
  },
  // Product Team workspace
  {
    label: "Products",
    href: "/products",
    icon: Package,
    roles: ["PRODUCT", "ADMIN"],
  },
  {
    label: "Suppliers",
    href: "/suppliers",
    icon: Building2,
    roles: ["PRODUCT", "ADMIN"],
  },
  // Ops workspace
  {
    label: "Booking Queue",
    href: "/ops/queue",
    icon: Truck,
    roles: ["OPS", "ADMIN"],
  },
  // Admin
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

export function Sidebar({ userRole }: { userRole: UserRole }) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <span className="text-slate-900 font-bold text-lg">T</span>
          </div>
          <div>
            <h1 className="font-bold text-white">Trivia Tours</h1>
            <p className="text-xs text-slate-400">Internal Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-500">
          Powered by Trivia Egypt
          <br />
          {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}
