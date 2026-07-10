"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ListEditor } from "@/components/ui/list-editor";
import { countryFlagEmoji } from "@/components/ui/country-flag";
import {
  createPackage,
  updatePackage,
  type PackageInput,
} from "./actions";

type PackageStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

type Country = {
  id: string;
  code: string | null;
  name: string;
};

type PackageEditing = {
  id: string;
  name: string;
  slug: string;
  countryId: string;
  shortDesc: string | null;
  overview: string | null;
  durationDays: number;
  durationNights: number | null;
  inclusions: string[] | null;
  exclusions: string[] | null;
  highlights: string[] | null;
  cancellationPolicy: string | null;
  importantInfo: string | null;
  status: PackageStatus;
};

type Props = {
  editing: PackageEditing | null;
  countries: Country[];
};

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

export function PackageForm({ editing, countries }: Props) {
  const router = useRouter();
  const isEdit = !!editing;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit);
  const [countryId, setCountryId] = useState(editing?.countryId ?? "");
  const [shortDesc, setShortDesc] = useState(editing?.shortDesc ?? "");
  const [overview, setOverview] = useState(editing?.overview ?? "");
  const [durationDays, setDurationDays] = useState(
    editing?.durationDays?.toString() ?? "1"
  );
  const [durationNights, setDurationNights] = useState(
    editing?.durationNights?.toString() ?? ""
  );
  const [inclusions, setInclusions] = useState<string[]>(
    editing?.inclusions ?? []
  );
  const [exclusions, setExclusions] = useState<string[]>(
    editing?.exclusions ?? []
  );
  const [highlights, setHighlights] = useState<string[]>(
    editing?.highlights ?? []
  );
  const [cancellationPolicy, setCancellationPolicy] = useState(
    editing?.cancellationPolicy ?? ""
  );
  const [importantInfo, setImportantInfo] = useState(
    editing?.importantInfo ?? ""
  );
  const [status, setStatus] = useState<PackageStatus>(
    editing?.status ?? "DRAFT"
  );

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
      setError("Package name is required");
      return;
    }
    if (!slug.trim()) {
      setError("Slug is required");
      return;
    }
    if (!countryId) {
      setError("Please select a country");
      return;
    }

    const days = parseInt(durationDays, 10);
    if (!Number.isFinite(days) || days < 1) {
      setError("Duration must be at least 1 day");
      return;
    }

    const nightsParsed =
      durationNights.trim() === ""
        ? null
        : parseInt(durationNights, 10);

    const input: PackageInput = {
      name,
      slug,
      countryId,
      shortDesc: shortDesc || null,
      overview: overview || null,
      durationDays: days,
      durationNights: nightsParsed,
      inclusions,
      exclusions,
      highlights,
      cancellationPolicy: cancellationPolicy || null,
      importantInfo: importantInfo || null,
      status,
    };

    startTransition(async () => {
      const result = isEdit
        ? await updatePackage(editing!.id, input)
        : await createPackage(input);

      if (result.success) {
        router.push("/admin/packages");
        router.refresh();
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <FormSection title="General Information" description="The essentials">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label required>Package Name</Label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Cairo & Nile Classic 7 Days"
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
                  {countryFlagEmoji(c.code)} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PackageStatus)}
              disabled={isPending}
              className="form-input bg-white"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div>
            <Label required>Duration (days)</Label>
            <input
              type="number"
              min={1}
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              disabled={isPending}
              className="form-input"
            />
          </div>

          <div>
            <Label>Duration (nights)</Label>
            <input
              type="number"
              min={0}
              value={durationNights}
              onChange={(e) => setDurationNights(e.target.value)}
              placeholder="Optional"
              disabled={isPending}
              className="form-input"
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Description" description="What guests will experience">
        <div className="space-y-4">
          <div>
            <Label>Short Description</Label>
            <textarea
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="One-line summary for cards and search"
              disabled={isPending}
              rows={2}
              className="form-input resize-none"
            />
          </div>
          <div>
            <Label>Overview</Label>
            <textarea
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="Full package overview for the detail page"
              disabled={isPending}
              rows={5}
              className="form-input resize-none"
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Highlights & Inclusions" description="Set clear expectations">
        <div className="space-y-6">
          <ListEditor
            label="Highlights"
            placeholder="e.g., Private Sphinx photo stop"
            values={highlights}
            onChange={setHighlights}
            disabled={isPending}
          />
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
        </div>
      </FormSection>

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

      <div className="flex items-center justify-end gap-3 pt-4 sticky bottom-0 bg-slate-50 -mx-8 px-8 py-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => router.push("/admin/packages")}
          disabled={isPending}
          className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 text-sm font-medium text-white bg-trivia-500 hover:bg-trivia-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Create Package"}
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
        {description && (
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}
