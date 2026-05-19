"use client";

import { useState, useTransition, useMemo } from "react";
import { X, Loader2, DollarSign, Percent, Info, Sparkles, Baby, Users } from "lucide-react";
import { createRate, updateRate, type RateInput } from "./rates-actions";

type RoomType = {
  id: string;
  name: string;
};

type Season = {
  id: string;
  name: string;
  validFrom: string;
  validTo: string;
};

type Rate = RateInput & { id: string };

type Props = {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  roomTypes: RoomType[];
  seasons: Season[];
  existing?: Rate | null;
};

const MEAL_PLANS = [
  { value: "RO", label: "Room Only" },
  { value: "BB", label: "Bed & Breakfast" },
  { value: "HB", label: "Half Board" },
  { value: "FB", label: "Full Board" },
  { value: "AI", label: "All Inclusive" },
];

const CURRENCIES = ["USD", "EGP", "IDR", "EUR", "GBP", "AED", "SAR"];

export function RateModal({ open, onClose, hotelId, roomTypes, seasons, existing }: Props) {
  const isEditing = !!existing;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Pricing model: 'markup' or 'commission'
  const initialModel = existing
    ? (existing.commissionPct && existing.commissionPct > 0 ? "commission" : "markup")
    : "markup";
  const [pricingModel, setPricingModel] = useState<"markup" | "commission">(initialModel);

  // Form state
  const [roomTypeId, setRoomTypeId] = useState(existing?.roomTypeId ?? roomTypes[0]?.id ?? "");
  const [seasonId, setSeasonId] = useState(existing?.seasonId ?? "");
  const [validFrom, setValidFrom] = useState(
    existing?.validFrom ?? new Date().toISOString().split("T")[0]
  );
  const [validTo, setValidTo] = useState(
    existing?.validTo ??
      new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0]
  );

  // Net prices
  const [netSingle, setNetSingle] = useState(existing?.netSingle?.toString() ?? "0");
  const [netDouble, setNetDouble] = useState(existing?.netDouble?.toString() ?? "");
  const [netTriple, setNetTriple] = useState(existing?.netTriple?.toString() ?? "0");
  const [netQuad, setNetQuad] = useState(existing?.netQuad?.toString() ?? "0");

  // Pricing model values
  const [markupPct, setMarkupPct] = useState(existing?.markupPct?.toString() ?? "25");
  const [commissionPct, setCommissionPct] = useState(existing?.commissionPct?.toString() ?? "15");

  // Meal plan
  const [mealPlan, setMealPlan] = useState<"RO" | "BB" | "HB" | "FB" | "AI">(existing?.mealPlan ?? "BB");

  // Child policy
  const [childAgeMin, setChildAgeMin] = useState(existing?.childAgeMin?.toString() ?? "2");
  const [childAgeMax, setChildAgeMax] = useState(existing?.childAgeMax?.toString() ?? "11");
  const [childRate, setChildRate] = useState(existing?.childRate?.toString() ?? "0");
  const [childMealSupplement, setChildMealSupplement] = useState(existing?.childMealSupplement?.toString() ?? "0");

  // Early bird
  const [earlyBirdDays, setEarlyBirdDays] = useState(existing?.earlyBirdDays?.toString() ?? "");
  const [earlyBirdPct, setEarlyBirdPct] = useState(existing?.earlyBirdPct?.toString() ?? "");

  // Booking rules
  const [minNights, setMinNights] = useState(existing?.minNights?.toString() ?? "1");
  const [maxNights, setMaxNights] = useState(existing?.maxNights?.toString() ?? "");

  // Currency
  const [originalCurrency, setOriginalCurrency] = useState(existing?.originalCurrency ?? "USD");
  const [exchangeRate, setExchangeRate] = useState(existing?.exchangeRateAtUpload?.toString() ?? "1");

  const [isActive, setIsActive] = useState(existing?.isActive ?? true);

  // Calculate live preview
  const preview = useMemo(() => {
    const multiplier =
      pricingModel === "commission"
        ? 1 / (1 - (parseFloat(commissionPct) || 0) / 100)
        : 1 + (parseFloat(markupPct) || 0) / 100;

    return {
      single: ((parseFloat(netSingle) || 0) * multiplier).toFixed(2),
      double: ((parseFloat(netDouble) || 0) * multiplier).toFixed(2),
      triple: ((parseFloat(netTriple) || 0) * multiplier).toFixed(2),
      quad: ((parseFloat(netQuad) || 0) * multiplier).toFixed(2),
      multiplier: multiplier.toFixed(3),
    };
  }, [pricingModel, markupPct, commissionPct, netSingle, netDouble, netTriple, netQuad]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!roomTypeId) {
      setError("Please select a room type");
      return;
    }
    if (!netDouble || parseFloat(netDouble) <= 0) {
      setError("Net Double price is required and must be greater than 0");
      return;
    }

    const input: RateInput = {
      hotelId,
      roomTypeId,
      seasonId: seasonId || null,
      validFrom,
      validTo,
      netSingle: parseFloat(netSingle) || 0,
      netDouble: parseFloat(netDouble),
      netTriple: parseFloat(netTriple) || 0,
      netQuad: parseFloat(netQuad) || 0,
      markupPct: pricingModel === "markup" ? parseFloat(markupPct) || 0 : 0,
      commissionPct: pricingModel === "commission" ? parseFloat(commissionPct) || 0 : 0,
      mealPlan,
      childAgeMin: parseInt(childAgeMin) || 2,
      childAgeMax: parseInt(childAgeMax) || 11,
      childRate: parseFloat(childRate) || 0,
      childMealSupplement: parseFloat(childMealSupplement) || 0,
      earlyBirdDays: earlyBirdDays ? parseInt(earlyBirdDays) : null,
      earlyBirdPct: earlyBirdPct ? parseFloat(earlyBirdPct) : null,
      minNights: parseInt(minNights) || 1,
      maxNights: maxNights ? parseInt(maxNights) : null,
      originalCurrency,
      exchangeRateAtUpload: parseFloat(exchangeRate) || 1,
      isActive,
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateRate(existing!.id, input)
        : await createRate(input);

      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-trivia-600" />
            <h2 className="text-xl font-semibold text-slate-900">
              {isEditing ? "Edit Rate" : "Add New Rate"}
            </h2>
          </div>
          <button onClick={onClose} disabled={isPending} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* === ROOM & SEASON === */}
          <Section title="Apply To" icon={Users}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>Room Type</Label>
                <select
                  value={roomTypeId}
                  onChange={(e) => setRoomTypeId(e.target.value)}
                  required
                  disabled={isPending}
                  className="form-input bg-white"
                >
                  <option value="">-- Select room type --</option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Season</Label>
                <select
                  value={seasonId}
                  onChange={(e) => setSeasonId(e.target.value)}
                  disabled={isPending}
                  className="form-input bg-white"
                >
                  <option value="">-- No specific season --</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label required>Valid From</Label>
                <input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  required
                  disabled={isPending}
                  className="form-input"
                />
              </div>
              <div>
                <Label required>Valid To</Label>
                <input
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  required
                  disabled={isPending}
                  className="form-input"
                />
              </div>
            </div>
          </Section>

          {/* === PRICING MODEL === */}
          <Section title="Pricing Model" icon={Percent}>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => setPricingModel("markup")}
                disabled={isPending}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  pricingModel === "markup"
                    ? "border-trivia-500 bg-trivia-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="font-semibold text-slate-900 text-sm">Markup Model</div>
                <div className="text-xs text-slate-500 mt-1">
                  Net + markup% = Sell <span className="italic">(e.g., Bambootel)</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPricingModel("commission")}
                disabled={isPending}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  pricingModel === "commission"
                    ? "border-trivia-500 bg-trivia-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="font-semibold text-slate-900 text-sm">Commission Model</div>
                <div className="text-xs text-slate-500 mt-1">
                  Hotel pays commission% <span className="italic">(e.g., Oberoi)</span>
                </div>
              </button>
            </div>

            {pricingModel === "markup" ? (
              <div>
                <Label required>Markup %</Label>
                <div className="relative">
                  <input
                    type="number"
                    value={markupPct}
                    onChange={(e) => setMarkupPct(e.target.value)}
                    step="0.1"
                    min="0"
                    disabled={isPending}
                    className="form-input pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                </div>
              </div>
            ) : (
              <div>
                <Label required>Commission %</Label>
                <div className="relative">
                  <input
                    type="number"
                    value={commissionPct}
                    onChange={(e) => setCommissionPct(e.target.value)}
                    step="0.1"
                    min="0"
                    max="50"
                    disabled={isPending}
                    className="form-input pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                </div>
              </div>
            )}
          </Section>

          {/* === NET PRICES === */}
          <Section title="Net Prices (USD)" icon={DollarSign}>
            <div className="grid grid-cols-4 gap-3">
              <PriceInput label="Single" value={netSingle} onChange={setNetSingle} disabled={isPending} />
              <PriceInput
                label="Double"
                value={netDouble}
                onChange={setNetDouble}
                disabled={isPending}
                required
              />
              <PriceInput label="Triple" value={netTriple} onChange={setNetTriple} disabled={isPending} />
              <PriceInput label="Quad" value={netQuad} onChange={setNetQuad} disabled={isPending} />
            </div>

            {/* Live preview */}
            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Sell Prices (auto-calculated · multiplier ×{preview.multiplier})
              </div>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <PriceDisplay label="Single" value={preview.single} />
                <PriceDisplay label="Double" value={preview.double} highlight />
                <PriceDisplay label="Triple" value={preview.triple} />
                <PriceDisplay label="Quad" value={preview.quad} />
              </div>
            </div>
          </Section>

          {/* === MEAL PLAN === */}
          <Section title="Meal Plan" icon={Info}>
            <div className="grid grid-cols-5 gap-2">
              {MEAL_PLANS.map((mp) => (
                <button
                  key={mp.value}
                  type="button"
                  onClick={() => setMealPlan(mp.value as "RO" | "BB" | "HB" | "FB" | "AI")}
                  disabled={isPending}
                  className={`p-2 rounded-lg border-2 text-center transition-all ${
                    mealPlan === mp.value
                      ? "border-trivia-500 bg-trivia-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="font-bold text-sm text-slate-900">{mp.value}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{mp.label}</div>
                </button>
              ))}
            </div>
          </Section>

          {/* === CHILD POLICY === */}
          <Section title="Child Policy" icon={Baby} collapsible>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label>Age Min</Label>
                <input
                  type="number"
                  value={childAgeMin}
                  onChange={(e) => setChildAgeMin(e.target.value)}
                  min="0"
                  max="17"
                  disabled={isPending}
                  className="form-input"
                />
              </div>
              <div>
                <Label>Age Max</Label>
                <input
                  type="number"
                  value={childAgeMax}
                  onChange={(e) => setChildAgeMax(e.target.value)}
                  min="0"
                  max="17"
                  disabled={isPending}
                  className="form-input"
                />
              </div>
              <PriceInput
                label="Child Rate"
                value={childRate}
                onChange={setChildRate}
                disabled={isPending}
              />
              <PriceInput
                label="Meal Supplement"
                value={childMealSupplement}
                onChange={setChildMealSupplement}
                disabled={isPending}
              />
            </div>
          </Section>

          {/* === EARLY BIRD === */}
          <Section title="Early Bird Discount" icon={Sparkles} collapsible>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Book X Days Before</Label>
                <input
                  type="number"
                  value={earlyBirdDays}
                  onChange={(e) => setEarlyBirdDays(e.target.value)}
                  placeholder="e.g., 90"
                  min="1"
                  disabled={isPending}
                  className="form-input"
                />
              </div>
              <div>
                <Label>Discount %</Label>
                <div className="relative">
                  <input
                    type="number"
                    value={earlyBirdPct}
                    onChange={(e) => setEarlyBirdPct(e.target.value)}
                    placeholder="e.g., 15"
                    step="0.1"
                    min="0"
                    max="50"
                    disabled={isPending}
                    className="form-input pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Leave blank if no early bird discount applies
            </p>
          </Section>

          {/* === BOOKING RULES === */}
          <Section title="Booking Rules" icon={Info} collapsible>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min Nights</Label>
                <input
                  type="number"
                  value={minNights}
                  onChange={(e) => setMinNights(e.target.value)}
                  min="1"
                  disabled={isPending}
                  className="form-input"
                />
              </div>
              <div>
                <Label>Max Nights (optional)</Label>
                <input
                  type="number"
                  value={maxNights}
                  onChange={(e) => setMaxNights(e.target.value)}
                  placeholder="No limit"
                  min="1"
                  disabled={isPending}
                  className="form-input"
                />
              </div>
            </div>
          </Section>

          {/* === CURRENCY REFERENCE === */}
          <Section title="Currency Reference" icon={DollarSign} collapsible>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Original Currency</Label>
                <select
                  value={originalCurrency}
                  onChange={(e) => setOriginalCurrency(e.target.value)}
                  disabled={isPending}
                  className="form-input bg-white"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Exchange Rate to USD</Label>
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  step="0.000001"
                  min="0"
                  disabled={isPending}
                  className="form-input"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              For accounting reference only. Net prices above are already in USD.
            </p>
          </Section>

          {/* === ACTIVE === */}
          <div className="pt-3 border-t border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isPending}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">
                Active (available for booking)
              </span>
            </label>
          </div>

          {/* === ACTIONS === */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white -mx-6 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-sm font-medium text-white bg-trivia-500 hover:bg-trivia-600 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Rate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Helper components ───────────────────────

function Section({
  title,
  icon: Icon,
  children,
  collapsible,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="pt-2 border-t border-slate-100 first:border-0 first:pt-0">
      <button
        type="button"
        onClick={() => collapsible && setOpen(!open)}
        className={`flex items-center gap-2 mb-3 w-full text-left ${collapsible ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
      >
        <Icon className="w-4 h-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {collapsible && (
          <span className="text-xs text-slate-400 ml-auto">{open ? "Hide" : "Show"}</span>
        )}
      </button>
      {(!collapsible || open) && children}
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-slate-600 mb-1">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function PriceInput({
  label,
  value,
  onChange,
  disabled,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          step="0.01"
          min="0"
          disabled={disabled}
          className="form-input pl-6 text-sm"
          placeholder="0.00"
        />
      </div>
    </div>
  );
}

function PriceDisplay({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] text-emerald-700 uppercase tracking-wider font-semibold">{label}</p>
      <p
        className={`font-mono font-bold ${highlight ? "text-emerald-900 text-base" : "text-emerald-800 text-sm"}`}
      >
        ${value}
      </p>
    </div>
  );
}
