"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Route, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function TransfersNav() {
  const pathname = usePathname();

  const tabs = [
    { label: "Routes", href: "/admin/transfers", icon: Route, exact: true },
    { label: "Locations", href: "/admin/transfers/locations", icon: MapPin, exact: false },
  ];

  return (
    <div className="border-b border-slate-200">
      <nav className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
                isActive
                  ? "border-trivia-500 text-trivia-700"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
