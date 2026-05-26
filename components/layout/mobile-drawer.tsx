"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  X,
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
  LogOut,
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
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SALES", "OPS", "PRODUCT", "ADMIN"] },
    ],
  },
  {
    label: "Book & Sell",
    items: [
      { label: "Search Tours", href: "/search", icon: Search, roles: ["SALES", "ADMIN"] },
      { label: "Search Hotels", href: "/hotels", icon: Hotel, roles: ["SALES", "ADMIN"] },
      { label: "Search Transfers", href: "/transfers", icon: Car, roles: ["SALES", "OPS", "PRODUCT", "ADMIN"] },
      { label: "My Bookings", href: "/bookings", icon: Calendar, roles: ["SALES", "ADMIN"] },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Manage Tours", href: "/products", icon: Package2, roles: ["PRODUCT", "ADMIN"] },
      { label: "Manage Hotels", href: "/admin/hotels", icon: Hotel, roles: ["PRODUCT", "ADMIN"] },
      { label: "Transfers", href: "/admin/transfers", icon: Car, roles: ["OPS", "PRODUCT", "ADMIN"] },
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

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (!open) return null;

  if (status === "loading") {
    return (
      <>
        <DrawerBackdrop onClose={onClose} />
        <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-trivia-900 text-white md:hidden">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-5">
            <DrawerLogoSkeleton />
            <DrawerCloseSkeleton />
          </div>
          <div className="px-3 py-4 space-y-2">
            {[...Array(6)].map((_, i) => (
              <DrawerNavSkeleton key={i} />
            ))}
          </div>
        </aside>
      </>
    );
  }

  const user = session?.user;
  const role = user?.role as Role | undefined;
  if (!role || !user) return null;

  return (
    <>
      <DrawerBackdrop onClose={onClose} />
      <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-trivia-900 text-white border-r border-trivia-950 md:hidden">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-5">
          <Link href="/dashboard" onClick={onClose}>
            <Logo variant="white" size="md" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/70 hover:bg-white/5 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav with collapsible groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <CollapsibleNavGroups role={role} pathname={pathname} onClose={onClose} />
        </nav>

        <DrawerFooter />
      </aside>
    </>
  );
}

function DrawerBackdrop({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="fixed inset-0 z-40 bg-black/50 md:hidden"
      aria-label="Close menu"
      onClick={onClose}
    />
  );
}

function DrawerFooter() {
  return (
    <div className="border-t border-white/5 px-5 py-4">
      <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">
        Trivia Pro
      </p>
      <p className="text-xs text-white/60 mt-1">Powered by Trivia Egypt</p>
    </div>
  );
}

function DrawerLogoSkeleton() {
  return <div className="h-9 w-32 animate-pulse rounded-lg bg-white/5" />;
}

function DrawerCloseSkeleton() {
  return <div className="h-9 w-9 animate-pulse rounded-lg bg-white/5" />;
}

function DrawerNavSkeleton() {
  return <DrawerNavSkeletonInner />;
}

function DrawerNavSkeletonInner() {
  return <div className="h-10 animate-pulse rounded-xl bg-white/5" />;
}

// ─── Collapsible nav groups for mobile drawer ─────

const STORAGE_KEY_MOBILE = "trivia-drawer-collapsed-groups";

function CollapsibleNavGroups({
  role,
  pathname,
  onClose,
}: {
  role: Role;
  pathname: string;
  onClose: () => void;
}) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MOBILE);
      if (stored) setCollapsedGroups(new Set(JSON.parse(stored)));
    } catch (e) {
      // Silently fail
    }
  }, []);

  function toggleGroup(label: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      try {
        localStorage.setItem(STORAGE_KEY_MOBILE, JSON.stringify(Array.from(next)));
      } catch (e) {
        // Silently fail
      }
      return next;
    });
  }

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);

  return (
    <>
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
            {group.label && (
              <button
                onClick={() => toggleGroup(group.label!)}
                className="w-full flex items-center justify-between px-3 mb-1.5 hover:bg-white/5 rounded-md py-1.5 transition-colors"
              >
                <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.15em]">
                  {group.label}
                </h3>
                <div className="flex items-center gap-1.5">
                  {isCollapsed && hasActiveChild && (
                    <span className="w-1.5 h-1.5 rounded-full bg-trivia-500" />
                  )}
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-white/40 transition-transform",
                      isCollapsed && "-rotate-90"
                    )}
                  />
                </div>
              </button>
            )}

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
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all relative",
                        isActive
                          ? "bg-trivia-500/15 text-white"
                          : "text-white/70 hover:bg-white/5 active:bg-white/10"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-trivia-500 rounded-r-full" />
                      )}
                      <Icon
                        className={cn(
                          "w-5 h-5 flex-shrink-0",
                          isActive ? "text-trivia-300" : "text-white/50"
                        )}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
