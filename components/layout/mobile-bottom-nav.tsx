"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Search,
  Calendar,
  Building2,
  Package2,
  Hotel,
  Truck,
  BarChart3,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "SALES" | "OPS" | "PRODUCT" | "ADMIN";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
};

const bottomNavItems: NavItem[] = [
  {
    label: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["SALES", "OPS", "PRODUCT", "ADMIN"],
  },
  {
    label: "Search",
    href: "/search",
    icon: Search,
    roles: ["SALES", "ADMIN"],
  },
  {
    label: "Bookings",
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
    label: "Manage",
    href: "/admin/hotels",
    icon: Hotel,
    roles: ["PRODUCT", "ADMIN"],
  },
  {
    label: "Queue",
    href: "/ops/queue",
    icon: Truck,
    roles: ["OPS", "ADMIN"],
  },
  {
    label: "Hotel Q",
    href: "/ops/hotel-queue",
    icon: Hotel,
    roles: ["OPS", "ADMIN"],
  },
  {
    label: "Stats",
    href: "/analytics",
    icon: BarChart3,
    roles: ["OPS", "ADMIN", "SALES"],
  },
];

type Props = {
  onOpenDrawer: () => void;
};

export function MobileBottomNav({ onOpenDrawer }: Props) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "loading" || !session?.user?.role) return null;

  const role = session.user.role as Role;
  const items = bottomNavItems.filter((item) => item.roles.includes(role)).slice(0, 3);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1 rounded-lg",
                isActive ? "text-trivia-600" : "text-slate-500"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1 rounded-lg text-slate-500"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}
