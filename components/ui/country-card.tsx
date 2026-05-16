"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  countryId: string;
  name: string;
  flagEmoji: string | null;
  productCount: number;
};

export function CountryCard({ countryId, name, flagEmoji, productCount }: Props) {
  const isAvailable = productCount > 0;

  return (
    <Link
      href={isAvailable ? `/search/${countryId}` : "#"}
      className={cn(
        "group relative bg-white rounded-2xl border-2 transition-all p-6",
        isAvailable
          ? "border-slate-200 hover:border-slate-900 hover:shadow-lg cursor-pointer"
          : "border-slate-100 opacity-50 cursor-not-allowed"
      )}
      onClick={(e) => !isAvailable && e.preventDefault()}
    >
      <div className="flex flex-col items-center text-center">
        {/* Flag */}
        <div className="text-5xl mb-3 transition-transform group-hover:scale-110">
          {flagEmoji || "🌍"}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-slate-900 mb-1">{name}</h3>

        {/* Product count */}
        <p className={cn(
          "text-xs font-medium px-2 py-0.5 rounded-full",
          isAvailable
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-500"
        )}>
          {productCount === 0
            ? "Coming soon"
            : productCount === 1
            ? "1 product"
            : `${productCount} products`}
        </p>
      </div>

      {/* Hover arrow indicator */}
      {isAvailable && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-slate-400 text-sm">→</span>
        </div>
      )}
    </Link>
  );
}
