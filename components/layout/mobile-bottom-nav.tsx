"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Search,
  Calendar,
  Truck,
  Menu,
  Package2,
  BarChart3,
  Hotel as HotelIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "SALES" | "OPS" | "PRODUCT" | "ADMIN";

const navByRole: Record<
  Role,
  Array<{ label: string; href: string; icon: React.ComponentType<{ className?: string }> }>
> = {
  SALES: [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "Tours", href: "/search", icon: Search },
    { label: "Hotels", href: "/hotels", icon: HotelIcon },
    { label: "Bookings", href: "/bookings", icon: Calendar },
  ],
  OPS: [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "Tour Q", href: "/ops/queue", icon: Truck },
    { label: "Hotel Q", href: "/ops/hotel-queue", icon: HotelIcon },
    { label: "Stats", href: "/analytics", icon: BarChart3 },
  ],
  PRODUCT: [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "Tours", href: "/products", icon: Package2 },
    { label: "Hotels", href: "/admin/hotels", icon: HotelIcon },
    { label: "Suppliers", href: "/suppliers", icon: Search },
  ],
  ADMIN: [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "Tours", href: "/search", icon: Search },
    { label: "Hotels", href: "/hotels", icon: HotelIcon },
    { label: "Bookings", href: "/bookings", icon: Calendar },
  ],
};

type Props = {
  onOpenDrawer: () => void;
};

export function MobileBottomNav({ onOpenDrawer }: Props) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "loading" || !session?.user?.role) return null;

  const role = session.user.role as Role;
  const items = navByRole[role];

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
