"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
};

const tabs = [
  { label: "Details", segment: "edit" },
  { label: "Rates", segment: "rates" },
] as const;

export function ProductNav({ productId }: Props) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-slate-200">
      {tabs.map((tab) => {
        const href = `/products/${productId}/${tab.segment}`;
        const isActive = pathname === href;

        return (
          <Link
            key={tab.segment}
            href={href}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              isActive
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
