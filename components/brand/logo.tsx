import { cn } from "@/lib/utils";

type Props = {
  variant?: "full" | "mark" | "white";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizes = {
  sm: { mark: "w-7 h-7", text: "text-base", tag: "text-[10px]" },
  md: { mark: "w-9 h-9", text: "text-lg", tag: "text-[10px]" },
  lg: { mark: "w-11 h-11", text: "text-xl", tag: "text-xs" },
  xl: { mark: "w-16 h-16", text: "text-3xl", tag: "text-sm" },
};

export function Logo({ variant = "full", size = "md", className }: Props) {
  const s = sizes[size];
  const isWhite = variant === "white";

  if (variant === "mark") {
    return (
      <div
        className={cn(
          s.mark,
          "rounded-xl bg-trivia-500 flex items-center justify-center shadow-sm",
          "ring-2 ring-trivia-100",
          className
        )}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="w-1/2 h-1/2 text-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 6h20v5h-7.5v15h-5V11H6V6z"
            fill="currentColor"
            strokeWidth="0.5"
            stroke="currentColor"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Mark */}
      <div
        className={cn(
          s.mark,
          "rounded-xl flex items-center justify-center shadow-sm flex-shrink-0",
          isWhite
            ? "bg-white ring-2 ring-white/20"
            : "bg-trivia-500 ring-2 ring-trivia-100"
        )}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={cn("w-1/2 h-1/2", isWhite ? "text-trivia-500" : "text-white")}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 6h20v5h-7.5v15h-5V11H6V6z"
            fill="currentColor"
            strokeWidth="0.5"
            stroke="currentColor"
          />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            s.text,
            "font-bold tracking-tight",
            isWhite ? "text-white" : "text-trivia-900"
          )}
        >
          Trivia <span className="text-trivia-500">Tours</span>
        </span>
        <span
          className={cn(
            s.tag,
            "uppercase tracking-[0.15em] font-medium mt-0.5",
            isWhite ? "text-white/70" : "text-slate-500"
          )}
        >
          Internal Platform
        </span>
      </div>
    </div>
  );
}
