import Link from "next/link";
import { Image as ImageIcon, Clock } from "lucide-react";
import { ProductTypeBadge } from "./product-type-badge";
import { CountryFlag } from "./country-flag";

type Props = {
  id: string;
  name: string;
  shortDesc: string | null;
  type: "TOUR" | "EXCURSION" | "ACTIVITY" | "TRANSFER";
  durationHours: string | null;
  countryName: string | null;
  countryCode: string | null;
  coverImage: string | null;
  fromPrice: string | null;
};

export function ProductSearchCard({
  id,
  name,
  shortDesc,
  type,
  durationHours,
  countryName,
  countryCode,
  coverImage,
  fromPrice,
}: Props) {
  return (
    <Link
      href={`/search/product/${id}`}
      className="group block bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-200"
    >
      {/* Hero Image */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-slate-300" />
          </div>
        )}

        {/* Type badge top-left */}
        <div className="absolute top-3 left-3">
          <ProductTypeBadge type={type} />
        </div>

        {/* Country bottom-left */}
        {countryCode && countryName && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-medium text-slate-700 shadow-sm">
            <CountryFlag code={countryCode} name={countryName} />
            <span>{countryName}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-slate-700 transition-colors">
          {name}
        </h3>

        {/* Short description */}
        {shortDesc && (
          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{shortDesc}</p>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {/* Duration */}
          {durationHours ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Clock className="w-3.5 h-3.5" />
              <span>{durationHours}h</span>
            </div>
          ) : (
            <span />
          )}

          {/* Price */}
          {fromPrice ? (
            <div className="text-right">
              <p className="text-xs text-slate-500">From</p>
              <p className="text-lg font-bold text-slate-900 leading-none">
                ${parseFloat(fromPrice).toFixed(0)}
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">No active rates</div>
          )}
        </div>
      </div>
    </Link>
  );
}
