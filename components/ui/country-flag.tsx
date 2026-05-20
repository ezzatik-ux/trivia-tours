import * as Flags from "country-flag-icons/react/3x2";
import getUnicodeFlagIcon from "country-flag-icons/unicode";
import { cn } from "@/lib/utils";

type FlagModule = Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>;
const FLAGS = Flags as unknown as FlagModule;

type Props = {
  code: string | null | undefined;
  name?: string | null;
  className?: string;
  title?: string;
};

/**
 * Renders a crisp SVG flag for the given ISO 3166-1 alpha-2 country code.
 * Falls back to a neutral globe placeholder when the code is missing or unknown.
 *
 * Default dimensions follow the inline-emoji rhythm (1em × ~0.66em); override
 * with `className` (e.g. "w-6 h-4") for larger surfaces like cards or heroes.
 */
export function CountryFlag({ code, name, className, title }: Props) {
  const normalized = code?.trim().toUpperCase();
  const Flag = normalized ? FLAGS[normalized] : undefined;
  const label = title ?? name ?? normalized ?? "Country flag";

  if (!Flag) {
    return (
      <span
        aria-label={label}
        role="img"
        className={cn("inline-block text-slate-400", className)}
      >
        🌍
      </span>
    );
  }

  return (
    <span title={label} className="inline-block">
      <Flag
        aria-label={label}
        className={cn(
          "inline-block align-[-0.125em] rounded-[2px] ring-1 ring-black/5",
          "h-[1em] w-[1.5em]",
          className
        )}
      />
    </span>
  );
}

/**
 * String helper for environments that can't render arbitrary React SVGs
 * (React-PDF voucher templates, chart tick labels, page <title>, etc).
 * Returns the regional-indicator emoji for the given code, or "" if invalid.
 */
export function countryFlagEmoji(code: string | null | undefined): string {
  const normalized = code?.trim().toUpperCase();
  if (!normalized || normalized.length !== 2) return "";
  try {
    return getUnicodeFlagIcon(normalized);
  } catch {
    return "";
  }
}
