"use client";

import { useState, useEffect } from "react";
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
  Car,
  BarChart3,
  Settings,
  Building2,
  Hotel,
  Luggage,
  ChevronDown,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

type Role = "SALES" | "OPS" | "PRODUCT" | "ADMIN";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
};

type NavGroup = {
  label: string | null;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["SALES", "OPS", "PRODUCT", "ADMIN"],
      },
    ],
  },
  {
    label: "Book & Sell",
    items: [
      { label: "Search Tours", href: "/search", icon: Search, roles: ["SALES", "ADMIN"] },
      { label: "Search Hotels", href: "/hotels", icon: Hotel, roles: ["SALES", "ADMIN"] },
      { label: "Search Transfers", href: "/transfers", icon: Car, roles: ["SALES", "OPS", "PRODUCT", "ADMIN"] },
      { label: "Packages", href: "/packages", icon: Luggage, roles: ["SALES", "OPS", "PRODUCT", "ADMIN"] },
      { label: "My Bookings", href: "/bookings", icon: Calendar, roles: ["SALES", "ADMIN"] },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Manage Tours", href: "/products", icon: Package2, roles: ["PRODUCT", "ADMIN"] },
      { label: "Manage Hotels", href: "/admin/hotels", icon: Hotel, roles: ["PRODUCT", "ADMIN"] },
      { label: "Transfers", href: "/admin/transfers", icon: Car, roles: ["OPS", "PRODUCT", "ADMIN"] },
      { label: "Manage Packages", href: "/admin/packages", icon: Luggage, roles: ["OPS", "PRODUCT", "ADMIN"] },
      { label: "Suppliers", href: "/suppliers", icon: Building2, roles: ["PRODUCT", "ADMIN"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Tour Queue", href: "/ops/queue", icon: Truck, roles: ["OPS", "ADMIN"] },
      { label: "Hotel Queue", href: "/ops/hotel-queue", icon: Hotel, roles: ["OPS", "ADMIN"] },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart3, roles: ["SALES", "OPS", "ADMIN"] },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Users", href: "/users", icon: Users, roles: ["ADMIN"] },
      { label: "Settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
    ],
  },
];

const STORAGE_KEY = "trivia-sidebar-collapsed-groups";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Load collapse state from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCollapsedGroups(new Set(JSON.parse(stored)));
      }
    } catch (e) {
      // Silently fail — localStorage might be disabled
    }
  }, []);

  // Persist collapse state
  function toggleGroup(label: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch (e) {
        // Silently fail
      }
      return next;
    });
  }

  // Loading skeleton
  if (status === "loading") {
    return (
      <aside className="hidden md:flex md:flex-col w-64 bg-trivia-900 border-r border-trivia-950 flex-shrink-0">
        <div className="px-5 py-6 border-b border-white/5">
          <div className="h-9 bg-white/5 rounded-lg animate-pulse" />
        </div>
        <div className="px-3 py-4 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </aside>
    );
  }

  const role = session?.user?.role as Role | undefined;
  if (!role) return null;

  // Filter groups: only show groups that have at least one visible item
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-trivia-900 text-white border-r border-trivia-950 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/5 flex-shrink-0">
        <Link href="/dashboard">
          <Logo variant="white" size="md" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {visibleGroups.map((group, groupIdx) => {
          const isCollapsed = mounted && group.label && collapsedGroups.has(group.label);
          const hasActiveChild = group.items.some(
            (item) => pathname === item.href || pathname.startsWith(item.href + "/")
          );

          return (
            <div
              key={`group-${groupIdx}`}
              className={cn(groupIdx > 0 && "mt-4 pt-4 border-t border-white/5")}
            >
              {/* Group header — clickable to toggle */}
              {group.label && (
                <button
                  onClick={() => toggleGroup(group.label!)}
                  className="w-full flex items-center justify-between px-3 mb-1.5 group/header hover:bg-white/5 rounded-md py-1 transition-colors"
                >
                  <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.15em] group-hover/header:text-white/60 transition-colors">
                    {group.label}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {/* Show dot if collapsed and contains active item */}
                    {isCollapsed && hasActiveChild && (
                      <span className="w-1.5 h-1.5 rounded-full bg-trivia-500" />
                    )}
                    <ChevronDown
                      className={cn(
                        "w-3 h-3 text-white/40 group-hover/header:text-white/60 transition-all",
                        isCollapsed && "-rotate-90"
                      )}
                    />
                  </div>
                </button>
              )}

              {/* Group items — hidden when collapsed */}
              {!isCollapsed && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href || pathname.startsWith(item.href + "/");
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
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-trivia-500 rounded-r-full" />
                        )}
                        <Icon
                          className={cn(
                            "w-[18px] h-[18px] flex-shrink-0 transition-colors",
                            isActive
                              ? "text-trivia-300"
                              : "text-white/50 group-hover:text-white/80"
                          )}
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5 flex-shrink-0">
        <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">
          Trivia Pro
        </p>
        <p className="text-xs text-white/60 mt-1">Powered by Trivia Egypt</p>
      </div>
    </aside>
  );
}
