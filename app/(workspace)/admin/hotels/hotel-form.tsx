"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star, Hotel as HotelIcon } from "lucide-react";
import { AmenityPicker } from "@/components/ui/amenity-picker";
import { ProductImageManager, type ProductImage } from "@/components/ui/product-image-manager";
import { countryFlagEmoji } from "@/components/ui/country-flag";
import { HOTEL_FACILITIES } from "@/lib/hotel-options";
import { createHotel, updateHotel, type HotelInput } from "./actions";

type Country = {
  id: string;
  code: string | null;
  name: string;
};

type Props = {
  mode: "create" | "edit";
  hotelId?: string;
  countries: Country[];
  initialData?: Partial<HotelInput> & { images?: ProductImage[] };
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function HotelForm({ mode, hotelId, countries, initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugManual, setSlugManual] = useState(mode === "edit");
  const [brand, setBrand] = useState(initialData?.brand ?? "");
  const [starRating, setStarRating] = useState<number | null>(initialData?.starRating ?? null);
  const [countryId, setCountryId] = useState(initialData?.countryId ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [shortDesc, setShortDesc] = useState(initialData?.shortDesc ?? "");
  const [longDesc, setLongDesc] = useState(initialData?.longDesc ?? "");
  const [amenities, setAmenities] = useState<string[]>(initialData?.amenities ?? []);
  const [policies, setPolicies] = useState(initialData?.policies ?? "");
  const [cancellationPolicy, setCancellationPolicy] = useState(initialData?.cancellationPolicy ?? "");
  const [importantInfo, setImportantInfo] = useState(initialData?.importantInfo ?? "");
  const [contactName, setContactName] = useState(initialData?.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(initialData?.contactPhone ?? "");
  const [reservationEmail, setReservationEmail] = useState(initialData?.reservationEmail ?? "");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "INACTIVE">(initialData?.status ?? "DRAFT");
  const [images, setImages] = useState<ProductImage[]>(initialData?.images ?? []);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManual) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Hotel name is required");
      return;
    }
    if (!countryId) {
      setError("Please select a country");
      return;
    }

    const input: HotelInput = {
      name,
      slug,
      brand: brand || null,
      starRating,
      countryId,
      address: address || null,
      shortDesc: shortDesc || null,
      longDesc: longDesc || null,
      amenities,
      policies: policies || null,
      cancellationPolicy: cancellationPolicy || null,
      importantInfo: importantInfo || null,
      contactName: contactName || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      reservationEmail: reservationEmail || null,
      status,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createHotel(input, images)
          : await updateHotel(hotelId!, input, images);

      if (result.success) {
        if (mode === "create" && "hotelId" in result && result.hotelId) {
          router.push(`/admin/hotels/${result.hotelId}/edit`);
        } else {
          router.push("/admin/hotels");
        }
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

      <Section title="General Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label required>Hotel Name</Label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., The Oberoi Beach Resort, Sahl Hasheesh"
              required
              disabled={isPending}
              className="form-input"
            />
          </div>

          <div>
            <Label>Brand / Chain</Label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., Oberoi Hotels & Resorts"
              disabled={isPending}
              className="form-input"
            />
          </div>

          <div>
            <Label>Star Rating</Label>
            <div className="flex items-center gap-2">
              {[3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setStarRating(starRating === r ? null : r)}
                  disabled={isPending}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all ${
                    starRating === r
                      ? "border-amber-400 bg-amber-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="font-semibold text-slate-900">{r}</span>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label required>Country</Label>
            <select
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
              required
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
              onChange={(e) => setStatus(e.target.value as "DRAFT" | "ACTIVE" | "INACTIVE")}
              disabled={isPending}
              className="form-input bg-white"
            >
              <option value="DRAFT">Draft (not visible to sales)</option>
              <option value="ACTIVE">Active (bookable)</option>
              <option value="INACTIVE">Inactive (hidden)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <Label>URL Slug</Label>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(slugify(e.target.value)); setSlugManual(true); }}
              placeholder="auto-generated"
              disabled={isPending}
              className="form-input font-mono text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <Label>Address</Label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address"
              disabled={isPending}
              rows={2}
              className="form-input resize-none"
            />
          </div>
        </div>
      </Section>

      <Section title="Description">
        <div className="space-y-4">
          <div>
            <Label>Short Description (for cards)</Label>
            <input
              type="text"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="One-liner for hotel listings"
              maxLength={200}
              disabled={isPending}
              className="form-input"
            />
            <p className="text-xs text-slate-500 mt-1">{shortDesc.length}/200 characters</p>
          </div>

          <div>
            <Label>Long Description</Label>
            <textarea
              value={longDesc}
              onChange={(e) => setLongDesc(e.target.value)}
              placeholder="Full description for the hotel detail page..."
              disabled={isPending}
              rows={6}
              className="form-input resize-none"
            />
          </div>
        </div>
      </Section>

      <Section title="Facilities">
        <AmenityPicker
          groups={HOTEL_FACILITIES}
          selected={amenities}
          onChange={setAmenities}
        />
      </Section>

      <Section title="Hotel Contact">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Contact Name</Label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g., Sales Manager"
              disabled={isPending}
              className="form-input"
            />
          </div>
          <div>
            <Label>Contact Phone</Label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+20 100 555 1234"
              disabled={isPending}
              className="form-input"
            />
          </div>
          <div>
            <Label>Sales Email</Label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="sales@hotel.com"
              disabled={isPending}
              className="form-input"
            />
          </div>
          <div>
            <Label>Reservation Email</Label>
            <input
              type="email"
              value={reservationEmail}
              onChange={(e) => setReservationEmail(e.target.value)}
              placeholder="reservations@hotel.com"
              disabled={isPending}
              className="form-input"
            />
            <p className="text-xs text-slate-500 mt-1">
              Used when Ops sends booking confirmation emails
            </p>
          </div>
        </div>
      </Section>

      <Section title="Policies">
        <div className="space-y-4">
          <div>
            <Label>Cancellation Policy</Label>
            <textarea
              value={cancellationPolicy}
              onChange={(e) => setCancellationPolicy(e.target.value)}
              placeholder="e.g., 60 days prior to arrival: no fee..."
              disabled={isPending}
              rows={4}
              className="form-input resize-none"
            />
          </div>
          <div>
            <Label>Hotel Policies (check-in time, etc.)</Label>
            <textarea
              value={policies}
              onChange={(e) => setPolicies(e.target.value)}
              placeholder="Check-in 14:00, Check-out 12:00..."
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
              placeholder="Dress code, restrictions, what to know..."
              disabled={isPending}
              rows={3}
              className="form-input resize-none"
            />
          </div>
        </div>
      </Section>

      <Section title="Images">
        <ProductImageManager images={images} onChange={setImages} disabled={isPending} />
      </Section>

      <div className="flex items-center justify-end gap-3 pt-4 sticky bottom-0 bg-slate-50 -mx-8 px-8 py-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => router.push("/admin/hotels")}
          disabled={isPending}
          className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 text-sm font-medium text-white bg-trivia-500 hover:bg-trivia-600 rounded-lg disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "create" ? "Create Hotel" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="text-base font-semibold text-slate-900 mb-5">{title}</h3>
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
