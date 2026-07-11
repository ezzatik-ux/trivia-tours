import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Check,
  X,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { ImageGallery } from "@/components/ui/image-gallery";
import { CountryFlag } from "@/components/ui/country-flag";
import { getPackageDetailBySlug } from "./actions";
import { PackageItinerary } from "./package-itinerary";
import { PackageQuotePanel } from "./package-quote-panel";
import { PackageShareActions } from "./package-share-actions";

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAuth();

  const { slug } = await params;
  const pkg = await getPackageDetailBySlug(slug);

  if (!pkg) notFound();

  const durationLabel = [
    `${pkg.durationDays} ${pkg.durationDays === 1 ? "day" : "days"}`,
    pkg.durationNights != null
      ? `${pkg.durationNights} ${pkg.durationNights === 1 ? "night" : "nights"}`
      : null,
  ]
    .filter(Boolean)
    .join(" / ");

  const hasInclusions = (pkg.inclusions?.length ?? 0) > 0;
  const hasExclusions = (pkg.exclusions?.length ?? 0) > 0;
  const hasHighlights = (pkg.highlights?.length ?? 0) > 0;

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://trivia-tours.vercel.app";
  const shareUrl = `${baseUrl}/packages/${pkg.slug}`;
  const pdfUrl = `${baseUrl}/api/package-pdf/${pkg.slug}`;

  return (
    <div className="space-y-6 max-w-6xl">
      <Link
        href="/packages"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to packages
      </Link>

      {/* Header — static From-price kept as fallback signal */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {pkg.countryCode && pkg.countryName && (
              <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                <CountryFlag code={pkg.countryCode} name={pkg.countryName} />
                {pkg.countryName}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
              <Clock className="w-3.5 h-3.5 text-trivia-500" />
              {durationLabel}
            </span>
            {pkg.code && (
              <span className="inline-flex items-center font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {pkg.code}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{pkg.name}</h1>
          {pkg.shortDesc && (
            <p className="text-slate-500 mt-2 text-lg">{pkg.shortDesc}</p>
          )}
        </div>

        <div className="sm:text-right flex-shrink-0 bg-white border border-slate-200 rounded-2xl px-5 py-4">
          {pkg.fromPrice ? (
            <>
              <p className="text-xs text-slate-500 uppercase tracking-wide">From</p>
              <p className="text-2xl font-bold text-trivia-600 leading-tight">
                ${parseFloat(pkg.fromPrice).toFixed(0)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">/ person</p>
            </>
          ) : (
            <p className="text-sm font-medium text-slate-500 italic">
              Contact for pricing
            </p>
          )}
        </div>
      </div>

      <PackageShareActions
        packageName={pkg.name}
        code={pkg.code}
        shareUrl={shareUrl}
        pdfUrl={pdfUrl}
      />

      {/* Two-column: content + sticky quote panel (mirrors product detail) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {pkg.images.length > 0 && (
            <ImageGallery
              images={pkg.images.map((img) => ({
                url: img.url,
                isCover: img.isCover,
              }))}
              productName={pkg.name}
            />
          )}

          {pkg.overview && (
            <Section title="Overview">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {pkg.overview}
              </p>
            </Section>
          )}

          {hasHighlights && (
            <Section title="Highlights">
              <ul className="space-y-1.5">
                {pkg.highlights.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <Sparkles className="w-4 h-4 text-trivia-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {pkg.days.length > 0 && (
            <Section title="Itinerary">
              <PackageItinerary days={pkg.days} />
            </Section>
          )}

          {(hasInclusions || hasExclusions) && (
            <Section title="What's included">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hasInclusions && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      Included
                    </p>
                    <ul className="space-y-1.5">
                      {pkg.inclusions.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-slate-700"
                        >
                          <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {hasExclusions && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      Not included
                    </p>
                    <ul className="space-y-1.5">
                      {pkg.exclusions.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-slate-700"
                        >
                          <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Section>
          )}

          {pkg.cancellationPolicy && (
            <Section title="Cancellation policy">
              <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                {pkg.cancellationPolicy}
              </p>
            </Section>
          )}

          {pkg.importantInfo && (
            <Section title="Important information">
              <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">
                  {pkg.importantInfo}
                </p>
              </div>
            </Section>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <PackageQuotePanel packageId={pkg.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}
