"use client";

import Link from "next/link";
import { MapPin, Hotel as HotelIcon, ArrowRight } from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";

type Hotel = {
  id: string;
  name: string;
  brand: string | null;
  starRating: number | null;
  shortDesc: string | null;
  amenities: string[] | null;
  countryName: string | null;
  countryFlag: string | null;
  coverImage: string | null;
  minPrice: number | null;
};

type Props = {
  hotel: Hotel;
  searchParams: string;
  nights: number;
};

export function HotelCard({ hotel, searchParams, nights }: Props) {
  const detailUrl = `/hotels/${hotel.id}?${searchParams}`;

  return (
    <Link
      href={detailUrl}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-trivia-300 hover:shadow-medium transition-all overflow-hidden flex flex-col md:flex-row"
    >
      {/* Image */}
      <div className="md:w-72 h-48 md:h-auto flex-shrink-0 relative bg-slate-100 overflow-hidden">
        {hotel.coverImage ? (
          <img
            src={hotel.coverImage}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <HotelIcon className="w-16 h-16 text-slate-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-5 md:p-6 flex flex-col">
        <div className="flex-1">
          {/* Star + Brand */}
          <div className="flex items-center gap-2 mb-1">
            <StarRating rating={hotel.starRating} size="sm" />
            {hotel.brand && (
              <span className="text-xs text-slate-500">· {hotel.brand}</span>
            )}
          </div>

          {/* Name */}
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-trivia-700 transition-colors mb-1">
            {hotel.name}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-3">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {hotel.countryFlag} {hotel.countryName}
            </span>
          </div>

          {/* Description */}
          {hotel.shortDesc && (
            <p className="text-sm text-slate-600 line-clamp-2 mb-3">{hotel.shortDesc}</p>
          )}

          {/* Amenities */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {hotel.amenities.slice(0, 5).map((a) => (
                <span
                  key={a}
                  className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md"
                >
                  {a}
                </span>
              ))}
              {hotel.amenities.length > 5 && (
                <span className="px-2 py-0.5 text-slate-500 text-xs">
                  +{hotel.amenities.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer: price + CTA */}
        <div className="flex items-end justify-between pt-3 border-t border-slate-100">
          <div>
            {hotel.minPrice ? (
              <>
                <div className="text-xs text-slate-500">Starting from</div>
                <div className="text-2xl font-bold text-trivia-600">
                  ${Number(hotel.minPrice).toFixed(0)}
                  <span className="text-xs font-normal text-slate-500"> /night</span>
                </div>
                {nights > 1 && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    ~${(Number(hotel.minPrice) * nights).toFixed(0)} for {nights} nights
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-slate-400 italic">No rates for these dates</div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-sm font-semibold text-trivia-600 group-hover:gap-2.5 transition-all">
            View details
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
