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
  Hotel,
  X,
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
    label: "Hotels",
    href: "/hotels",
    icon: Building2,
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
    label: "Manage Hotels",
    href: "/admin/hotels",
    icon: Hotel,
    roles: ["PRODUCT", "ADMIN"],
  },
  {
    label: "Booking Queue",
    href: "/ops/queue",
    icon: Truck,
    roles: ["OPS", "ADMIN"],
  },
  {
    label: "Hotel Queue",
    href: "/ops/hotel-queue",
    icon: Hotel,
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

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

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

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
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
                    isActive ? "text-trivia-300" : "text-white/50 group-hover:text-white/80"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
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
        Trivia Tours
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
