import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Check, X, AlertTriangle, Globe2 } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { getProductById } from "@/app/(workspace)/products/actions";
import { db } from "@/lib/db";
import { countries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ProductTypeBadge } from "@/components/ui/product-type-badge";
import { ImageGallery } from "@/components/ui/image-gallery";
import { QuotePanel } from "./quote-panel";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();

  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  // Fetch country info
  const [country] = await db
    .select()
    .from(countries)
    .where(eq(countries.id, product.countryId))
    .limit(1);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back link */}
      <Link
        href="/search"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to search
      </Link>

      {/* Title row */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ProductTypeBadge type={product.type} />
          {country && (
            <span className="inline-flex items-center gap-1 text-sm text-slate-600">
              {country.flagEmoji} {country.name}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
        {product.shortDesc && (
          <p className="text-slate-500 mt-2 text-lg">{product.shortDesc}</p>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Content (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image gallery */}
          <ImageGallery
            images={product.images.map((img) => ({ url: img.url, isCover: img.isCover }))}
            productName={product.name}
          />

          {/* Quick facts */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {product.durationHours && (
              <FactPill icon={Clock} label="Duration" value={`${product.durationHours} hours`} />
            )}
            {product.language && (
              <FactPill icon={Globe2} label="Language" value={product.language} />
            )}
            {product.meetingPoint && (
              <FactPill icon={MapPin} label="Meeting" value={product.meetingPoint} />
            )}
          </div>

          {/* Description */}
          {product.longDesc && (
            <Section title="About this experience">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {product.longDesc}
              </p>
            </Section>
          )}

          {/* Inclusions & Exclusions */}
          {(product.inclusions?.length || product.exclusions?.length) && (
            <Section title="What's included">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.inclusions && product.inclusions.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Included</p>
                    <ul className="space-y-1.5">
                      {product.inclusions.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                          <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {product.exclusions && product.exclusions.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Not included</p>
                    <ul className="space-y-1.5">
                      {product.exclusions.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
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

          {/* Cancellation policy */}
          {product.cancellationPolicy && (
            <Section title="Cancellation policy">
              <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                {product.cancellationPolicy}
              </p>
            </Section>
          )}

          {/* Important info */}
          {product.importantInfo && (
            <Section title="Important information">
              <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">
                  {product.importantInfo}
                </p>
              </div>
            </Section>
          )}
        </div>

        {/* RIGHT: Sticky quote panel (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <QuotePanel productId={product.id} productName={product.name} />
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

function FactPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-700" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}
