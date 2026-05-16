"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Search,
  Package2,
  Calendar,
  Users,
  Truck,
  BarChart3,
  Settings,
  Building2,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

type Role = "SALES" | "OPS" | "PRODUCT" | "ADMIN";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["SALES", "OPS", "PRODUCT", "ADMIN"],
  },
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
    roles: ["SALES", "ADMIN"],
  },
  {
    label: "Products",
    href: "/products",
    icon: Package2,
    roles: ["PRODUCT", "ADMIN"],
  },
  {
    label: "Suppliers",
    href: "/suppliers",
    icon: Building2,
    roles: ["PRODUCT", "ADMIN"],
  },
  {
    label: "Booking Queue",
    href: "/ops/queue",
    icon: Truck,
    roles: ["OPS", "ADMIN"],
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["OPS", "ADMIN", "SALES"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const role = session?.user?.role as Role | undefined;

  if (status === "loading") {
    return (
      <aside
        className="hidden md:flex md:flex-col w-64 min-h-screen bg-trivia-900 border-r border-trivia-950 flex-shrink-0"
        aria-hidden
      />
    );
  }

  if (!role) return null;

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden md:flex md:flex-col w-64 min-h-screen bg-trivia-900 text-white border-r border-trivia-950 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/5">
        <Link href="/dashboard">
          <Logo variant="white" size="md" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
                isActive
                  ? "bg-trivia-500/15 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-trivia-500 rounded-r-full" />
              )}
              <Icon
                className={cn(
                  "w-[18px] h-[18px] flex-shrink-0 transition-colors",
                  isActive ? "text-trivia-300" : "text-white/50 group-hover:text-white/80"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5">
        <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">
          Trivia Tours
        </p>
        <p className="text-xs text-white/60 mt-1">Powered by Trivia Egypt</p>
      </div>
    </aside>
  );
}
