"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Info, Bed, Calendar, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  hotelId: string;
};

export function HotelNav({ hotelId }: Props) {
  const pathname = usePathname();

  const tabs = [
    { label: "Info", href: `/admin/hotels/${hotelId}/edit`, icon: Info },
    { label: "Room Types", href: `/admin/hotels/${hotelId}/rooms`, icon: Bed },
    { label: "Seasons", href: `/admin/hotels/${hotelId}/seasons`, icon: Calendar },
    { label: "Rates", href: `/admin/hotels/${hotelId}/rates`, icon: DollarSign },
  ];

  return (
    <div className="border-b border-slate-200 -mt-2">
      <nav className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
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
