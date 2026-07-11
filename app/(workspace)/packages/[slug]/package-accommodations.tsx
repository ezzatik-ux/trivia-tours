import { MapPin, Utensils, CalendarDays } from "lucide-react";

type BoardBasis = "RO" | "BB" | "HB" | "FB" | "AI";

const BOARD_BASIS_LABELS: Record<BoardBasis, string> = {
  RO: "Room Only",
  BB: "Bed & Breakfast",
  HB: "Half Board",
  FB: "Full Board",
  AI: "All Inclusive",
};

type Accommodation = {
  hotelName: string;
  cityName: string | null;
  nights: number;
  boardBasis: BoardBasis;
  startDate: string | null;
  images: { url: string; isCover: boolean; sortOrder: number }[];
};

type Props = {
  accommodations: Accommodation[];
};

export function PackageAccommodations({ accommodations }: Props) {
  if (accommodations.length === 0) return null;

  // Only board-basis codes actually used across these hotels (Wetu-style key).
  const usedCodes = Array.from(
    new Set(accommodations.map((a) => a.boardBasis))
  ) as BoardBasis[];

  return (
    <div className="space-y-4">
      {accommodations.map((acc, index) => (
        <div
          key={index}
          className="bg-slate-50 rounded-xl p-4 border border-slate-100"
        >
          <h3 className="font-semibold text-slate-900">{acc.hotelName}</h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            {acc.cityName && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-trivia-500 flex-shrink-0" />
                {acc.cityName}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-trivia-500 flex-shrink-0" />
              {acc.nights} {acc.nights === 1 ? "night" : "nights"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-trivia-500 flex-shrink-0" />
              {BOARD_BASIS_LABELS[acc.boardBasis]}
            </span>
          </div>

          {acc.startDate && (
            <p className="mt-1 text-xs text-slate-500">From {acc.startDate}</p>
          )}

          {acc.images.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {acc.images.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt={`${acc.hotelName} ${i + 1}`}
                  className="w-32 h-24 rounded-lg object-cover flex-shrink-0 border border-slate-200"
                />
              ))}
            </div>
          )}
        </div>
      ))}

      <p className="text-xs text-slate-500">
        <span className="font-medium text-slate-600">Key</span> —{" "}
        {usedCodes
          .map((code) => `${code}: ${BOARD_BASIS_LABELS[code]}`)
          .join(" · ")}
      </p>
    </div>
  );
}
