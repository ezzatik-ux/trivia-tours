import { MapPin } from "lucide-react";

type Day = {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  locationName: string | null;
  images: { url: string; isCover: boolean; sortOrder: number }[];
};

type Props = {
  days: Day[];
};

export function PackageItinerary({ days }: Props) {
  if (days.length === 0) return null;

  return (
    <ol className="relative border-l-2 border-slate-200 ml-3">
      {days.map((day) => (
        <li key={day.id} className="mb-6 last:mb-0 ml-6">
          {/* Numbered day dot */}
          <span className="absolute -left-[13px] flex items-center justify-center w-6 h-6 bg-trivia-500 text-white text-xs font-bold rounded-full ring-4 ring-white">
            {day.dayNumber}
          </span>

          <div className="bg-slate-50 rounded-xl p-4">
            <h3 className="font-semibold text-slate-900">{day.title}</h3>

            {day.locationName && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-trivia-500 flex-shrink-0" />
                <span>{day.locationName}</span>
              </p>
            )}

            {day.description && (
              <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {day.description}
              </p>
            )}

            {day.images.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {day.images.map((img, i) => (
                  <img
                    key={i}
                    src={img.url}
                    alt={`${day.title} photo ${i + 1}`}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0 border border-slate-200"
                  />
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
