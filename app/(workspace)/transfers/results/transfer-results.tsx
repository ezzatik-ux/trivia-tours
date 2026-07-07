"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Car, Users, Briefcase, Clock, MapPin, ArrowRight, Check } from "lucide-react";
import type { TransferSearchResult } from "../actions";
import type { TransferRateWithClass } from "@/lib/transfer-options";

type Props = {
  results: TransferSearchResult[];
  date: string;
  pax: number;
  searchQuery: string;
};

const VEHICLE_LABELS: Record<string, string> = {
  SEDAN: "Sedan",
  SUV: "SUV",
  VAN: "Van",
  MINIBUS: "Minibus",
  COACH: "Coach",
};

function formatDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function ClassImage({ imageUrl, alt }: { imageUrl: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!imageUrl || failed) {
    return (
      <div className="md:w-32 h-20 flex-shrink-0 rounded-lg bg-slate-100 flex items-center justify-center">
        <Car className="w-10 h-10 text-slate-400" />
      </div>
    );
  }
  return (
    <div className="md:w-32 h-20 flex-shrink-0 rounded-lg bg-slate-100 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function VehicleRateCard({
  v,
  routeId,
  searchQuery,
}: {
  v: TransferRateWithClass;
  routeId: string;
  searchQuery: string;
}) {
  const cls = v.vehicleClass;
  const displayName = cls?.name ?? VEHICLE_LABELS[v.vehicleType] ?? v.vehicleType;
  const displayMaxPax = cls?.maxPax ?? v.maxPax;
  const displayMaxLuggage = cls?.maxLuggage ?? v.maxLuggage;
  const amenities = cls?.amenities ?? [];
  const driverLanguages = cls?.driverLanguages ?? [];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-trivia-300 hover:shadow-soft transition-all">
      <div className="flex flex-col md:flex-row gap-4 md:items-center">
        <ClassImage imageUrl={cls?.imageUrl ?? null} alt={displayName} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900">{displayName}</h3>
          {cls?.exampleModels && (
            <p className="text-sm text-slate-500 mt-0.5">{cls.exampleModels}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" /> Up to {displayMaxPax}
            </span>
            {displayMaxLuggage != null && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-slate-400" /> {displayMaxLuggage} bags
              </span>
            )}
          </div>
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {amenities.map((a) => (
                <span
                  key={a}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600"
                >
                  {a}
                </span>
              ))}
            </div>
          )}
          {driverLanguages.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {driverLanguages.map((lang) => (
                <span
                  key={lang}
                  className="px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200 text-slate-600"
                >
                  {lang}
                </span>
              ))}
            </div>
          )}
          {!cls && (
            <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Meet &amp; greet</span>
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Fixed price</span>
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Free waiting</span>
            </div>
          )}
        </div>
        <div className="md:w-44 flex flex-col items-stretch md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
          <div className="text-right">
            <div className="text-xs text-slate-500">Total price</div>
            <div className="text-2xl font-bold text-trivia-600">${v.sellPrice.toFixed(0)}</div>
            <div className="text-[10px] text-slate-400">per vehicle</div>
          </div>
          <Link
            href={`/transfers/book?rateId=${v.rateId}&routeId=${routeId}&${searchQuery}`}
            className="mt-3 w-full md:w-auto px-4 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium text-center transition-colors shadow-sm"
          >
            Select vehicle
          </Link>
        </div>
      </div>
    </div>
  );
}

export function TransferResults({ results, date, pax, searchQuery }: Props) {
  const route = results[0]; // single directional route between two points

  return (
    <div className="space-y-4">
      <Link href="/transfers" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        Modify search
      </Link>

      {!route ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-medium mb-1">No transfers available for this route</p>
          <p className="text-sm text-slate-500 mb-4">
            Try different locations, or operations may not have rates set for this route yet.
          </p>
          <Link href="/transfers" className="inline-flex items-center gap-2 px-4 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Modify search
          </Link>
        </div>
      ) : (
        <>
          {/* Route header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <MapPin className="w-4 h-4 text-trivia-500" />
                {route.fromName}
                <ArrowRight className="w-4 h-4 text-slate-400" />
                {route.toName}
              </div>
              {route.estimatedDurationMin && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" /> ~{route.estimatedDurationMin} min
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {formatDate(date)} · {pax} {pax === 1 ? "passenger" : "passengers"}
              {route.countryName ? ` · ${route.countryName}` : ""}
            </p>
          </div>

          {/* Vehicle options */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">
              {route.vehicles.length} {route.vehicles.length === 1 ? "vehicle" : "vehicles"} available
            </h2>
            {route.vehicles.map((v) => (
              <VehicleRateCard
                key={v.rateId}
                v={v}
                routeId={route.routeId}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
