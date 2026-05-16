"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Compass, MapPin, Activity, Car } from "lucide-react";
import { ListEditor } from "@/components/ui/list-editor";
import { ProductImageManager, type ProductImage } from "@/components/ui/product-image-manager";
import { createProduct, updateProduct, type ProductInput } from "./actions";

type ProductType = "TOUR" | "EXCURSION" | "ACTIVITY" | "TRANSFER";
type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

type Country = {
  id: string;
  name: string;
  flagEmoji: string | null;
};

type Props = {
  mode: "create" | "edit";
  productId?: string;
  countries: Country[];
  initialData?: Partial<ProductInput> & { images?: ProductImage[] };
};

const TYPE_OPTIONS: Array<{
  value: ProductType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "TOUR", label: "Tour", description: "Multi-stop guided tour", icon: Compass },
  { value: "EXCURSION", label: "Excursion", description: "Half/full-day trip", icon: MapPin },
  { value: "ACTIVITY", label: "Activity", description: "Single experience", icon: Activity },
  { value: "TRANSFER", label: "Transfer", description: "Point-to-point transport", icon: Car },
];

/**
 * Generate URL-friendly slug from name
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function ProductForm({ mode, productId, countries, initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<ProductType>(initialData?.type ?? "TOUR");
  const [countryId, setCountryId] = useState(initialData?.countryId ?? "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === "edit");
  const [shortDesc, setShortDesc] = useState(initialData?.shortDesc ?? "");
  const [longDesc, setLongDesc] = useState(initialData?.longDesc ?? "");
  const [durationHours, setDurationHours] = useState<string>(
    initialData?.durationHours?.toString() ?? ""
  );
  const [language, setLanguage] = useState(initialData?.language ?? "");
  const [meetingPoint, setMeetingPoint] = useState(initialData?.meetingPoint ?? "");
  const [inclusions, setInclusions] = useState<string[]>(initialData?.inclusions ?? []);
  const [exclusions, setExclusions] = useState<string[]>(initialData?.exclusions ?? []);
  const [cancellationPolicy, setCancellationPolicy] = useState(initialData?.cancellationPolicy ?? "");
  const [importantInfo, setImportantInfo] = useState(initialData?.importantInfo ?? "");
  const [status, setStatus] = useState<ProductStatus>(initialData?.status ?? "DRAFT");
  const [images, setImages] = useState<ProductImage[]>(initialData?.images ?? []);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlug(slugify(value));
    setSlugManuallyEdited(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Product name is required");
      return;
    }
    if (!countryId) {
      setError("Please select a country");
      return;
    }
    if (!slug.trim()) {
      setError("Slug is required");
      return;
    }

    const input: ProductInput = {
      type,
      countryId,
      name,
      slug,
      shortDesc: shortDesc || null,
      longDesc: longDesc || null,
      durationHours: durationHours ? parseFloat(durationHours) : null,
      language: language || null,
      meetingPoint: meetingPoint || null,
      inclusions,
      exclusions,
      cancellationPolicy: cancellationPolicy || null,
      importantInfo: importantInfo || null,
      status,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createProduct(input, images)
          : await updateProduct(productId!, input, images);

      if (result.success) {
        router.push("/products");
        router.refresh();
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* SECTION 1: TYPE & GENERAL */}
      <FormSection title="Product Type" description="What kind of product is this?">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = type === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                disabled={isPending}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selected
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${selected ? "text-slate-900" : "text-slate-500"}`} />
                <div className="font-medium text-slate-900">{opt.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{opt.description}</div>
              </button>
            );
          })}
        </div>
      </FormSection>

      {/* SECTION 2: BASICS */}
      <FormSection title="General Information" description="The essentials">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label required>Product Name</Label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Pyramids of Giza Half-Day Tour"
              disabled={isPending}
              className="form-input"
            />
          </div>

          <div className="md:col-span-2">
            <Label>URL Slug</Label>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="auto-generated from name"
              disabled={isPending}
              className="form-input font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">
              Used in URLs. Lowercase, dashes only. Auto-fills as you type the name.
            </p>
          </div>

          <div>
            <Label required>Country</Label>
            <select
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
              disabled={isPending}
              className="form-input bg-white"
            >
              <option value="">-- Select Country --</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.flagEmoji} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
              disabled={isPending}
              className="form-input bg-white"
            >
              <option value="DRAFT">Draft (not visible to sales)</option>
              <option value="ACTIVE">Active (visible to sales)</option>
              <option value="INACTIVE">Inactive (hidden)</option>
            </select>
          </div>
        </div>
      </FormSection>

      {/* SECTION 3: DESCRIPTION */}
      <FormSection title="Description" description="Help sales agents understand and pitch this product">
        <div className="space-y-4">
          <div>
            <Label>Short Description</Label>
            <input
              type="text"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="One-line summary for cards and search results"
              disabled={isPending}
              maxLength={200}
              className="form-input"
            />
            <p className="text-xs text-slate-500 mt-1">{shortDesc.length}/200 characters</p>
          </div>

          <div>
            <Label>Long Description</Label>
            <textarea
              value={longDesc}
              onChange={(e) => setLongDesc(e.target.value)}
              placeholder="Full description for the product detail page..."
              disabled={isPending}
              rows={5}
              className="form-input resize-none"
            />
          </div>
        </div>
      </FormSection>

      {/* SECTION 4: LOGISTICS */}
      <FormSection title="Logistics" description="Practical details about the experience">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Duration (hours)</Label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              placeholder="e.g., 4.5"
              disabled={isPending}
              className="form-input"
            />
          </div>

          <div>
            <Label>Language</Label>
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="English, Arabic, French..."
              disabled={isPending}
              className="form-input"
            />
          </div>

          <div className="md:col-span-2">
            <Label>Meeting Point</Label>
            <input
              type="text"
              value={meetingPoint}
              onChange={(e) => setMeetingPoint(e.target.value)}
              placeholder="e.g., Hotel pickup or main entrance of the Egyptian Museum"
              disabled={isPending}
              className="form-input"
            />
          </div>
        </div>
      </FormSection>

      {/* SECTION 5: INCLUSIONS / EXCLUSIONS */}
      <FormSection title="What's Included" description="Set clear expectations">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ListEditor
            label="Inclusions"
            placeholder="e.g., English-speaking guide"
            values={inclusions}
            onChange={setInclusions}
            disabled={isPending}
          />
          <ListEditor
            label="Exclusions"
            placeholder="e.g., Personal expenses"
            values={exclusions}
            onChange={setExclusions}
            disabled={isPending}
          />
        </div>
      </FormSection>

      {/* SECTION 6: POLICIES */}
      <FormSection title="Policies & Information" description="Important details for customers">
        <div className="space-y-4">
          <div>
            <Label>Cancellation Policy</Label>
            <textarea
              value={cancellationPolicy}
              onChange={(e) => setCancellationPolicy(e.target.value)}
              placeholder="e.g., Free cancellation up to 24 hours before..."
              disabled={isPending}
              rows={3}
              className="form-input resize-none"
            />
          </div>

          <div>
            <Label>Important Information</Label>
            <textarea
              value={importantInfo}
              onChange={(e) => setImportantInfo(e.target.value)}
              placeholder="Dress code, restrictions, what to bring..."
              disabled={isPending}
              rows={3}
              className="form-input resize-none"
            />
          </div>
        </div>
      </FormSection>

      {/* SECTION 7: IMAGES */}
      <FormSection title="Images" description="Upload product photos (first image is the cover)">
        <ProductImageManager images={images} onChange={setImages} disabled={isPending} />
      </FormSection>

      {/* SUBMIT */}
      <div className="flex items-center justify-end gap-3 pt-4 sticky bottom-0 bg-slate-50 -mx-8 px-8 py-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => router.push("/products")}
          disabled={isPending}
          className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "create" ? "Create Product" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}
