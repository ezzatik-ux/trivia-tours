import { Star } from "lucide-react";

type Props = {
  rating: number | null;
  size?: "sm" | "md" | "lg";
};

export function StarRating({ rating, size = "sm" }: Props) {
  if (!rating) return null;

  const sizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className="inline-flex items-center gap-0.5">
      {[...Array(5)].map((_, idx) => (
        <Star
          key={idx}
          className={`${sizes[size]} ${
            idx < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200"
          }`}
        />
      ))}
    </div>
  );
}
