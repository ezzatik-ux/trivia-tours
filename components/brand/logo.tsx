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
          "rounded-xl flex items-center justify-center bg-white shadow-sm overflow-hidden ring-2 ring-trivia-100",
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/favicon-96x96.png"
          alt="Trivia"
          className="w-full h-full object-contain p-1"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          s.mark,
          "rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden bg-white",
          isWhite ? "ring-2 ring-white/20" : "ring-2 ring-trivia-100"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/favicon-96x96.png"
          alt="Trivia"
          className="w-full h-full object-contain p-1"
        />
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
          Trivia <span className="text-trivia-500">Pro</span>
        </span>
        <span
          className={cn(
            s.tag,
            "tracking-[0.12em] font-medium mt-0.5 italic",
            isWhite ? "text-white/70" : "text-slate-500"
          )}
        >
          Live it, Trivit
        </span>
      </div>
    </div>
  );
}
