"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Bed,
  Users,
  Ruler,
  Eye,
  Calendar,
  Info,
  AlertCircle,
  Hotel as HotelIcon,
} from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";
import { BookingModal } from "./booking-modal";

type RoomTypeWithRate = {
  id: string;
  hotelId: string;
  name: string;
  description: string | null;
  maxOccupancy: number;
  bedConfig: string | null;
  sizeM2: string | null;
  view: string | null;
  amenities: string[] | null;
  images: string[] | null;
  rate: {
    id: string;
    netSingle: string | null;
    netDouble: string;
    netTriple: string | null;
    netQuad: string | null;
    sellSingle: string | null;
    sellDouble: string | null;
    sellTriple: string | null;
    sellQuad: string | null;
    mealPlan: "RO" | "BB" | "HB" | "FB" | "AI";
    childAgeMin: number | null;
    childAgeMax: number | null;
    childRate: string | null;
    earlyBirdDays: number | null;
    earlyBirdPct: string | null;
    minNights: number | null;
    maxNights: number | null;
  } | null;
};

type HotelDetail = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  starRating: number | null;
  shortDesc: string | null;
  longDesc: string | null;
  address: string | null;
  amenities: string[] | null;
  policies: string | null;
  cancellationPolicy: string | null;
  importantInfo: string | null;
  countryName: string | null;
  countryFlag: string | null;
  images: Array<{ id: string; url: string; caption: string | null; isCover: boolean }>;
  rooms: RoomTypeWithRate[];
};

type Props = {
  hotel: HotelDetail;
  checkIn: string;
  checkOut: string;
  pax: number;
};

const MEAL_PLAN_LABELS: Record<string, string> = {
  RO: "Room Only",
  BB: "Bed & Breakfast",
  HB: "Half Board",
  FB: "Full Board",
  AI: "All Inclusive",
};

const MEAL_PLAN_COLORS: Record<string, string> = {
  RO: "bg-slate-100 text-slate-700",
  BB: "bg-blue-100 text-blue-700",
  HB: "bg-amber-100 text-amber-700",
  FB: "bg-orange-100 text-orange-700",
  AI: "bg-purple-100 text-purple-700",
};

export function HotelDetailClient({ hotel, checkIn, checkOut, pax }: Props) {
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomTypeWithRate | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const nights =
    checkIn && checkOut
      ? Math.max(
          1,
          Math.ceil(
            (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  const coverImage = hotel.images.find((i) => i.isCover) ?? hotel.images[0];
  const galleryImages = hotel.images.filter((i) => i.url);

  function handleSelectRoom(room: RoomTypeWithRate) {
    setSelectedRoom(room);
    setBookingModalOpen(true);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const searchParamsString = useMemo(() => {
    const p = new URLSearchParams();
    if (checkIn) p.set("checkIn", checkIn);
    if (checkOut) p.set("checkOut", checkOut);
    if (pax) p.set("pax", pax.toString());
    return p.toString();
  }, [checkIn, checkOut, pax]);

  const roomsWithRates = hotel.rooms.filter((r) => r.rate);
  const roomsWithoutRates = hotel.rooms.filter((r) => !r.rate);

  return (
    <>
      <div className="space-y-6 max-w-6xl">
        {/* Breadcrumb */}
        <Link
          href={`/hotels/results?${searchParamsString}`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to search results
        </Link>

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={hotel.starRating} size="md" />
            {hotel.brand && (
              <span className="text-sm text-slate-500">· {hotel.brand}</span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{hotel.name}</h1>
          <div className="flex items-center gap-1.5 text-slate-600 mt-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            {hotel.countryFlag} {hotel.countryName}
            {hotel.address && <span className="text-slate-400">· {hotel.address}</span>}
          </div>
        </div>

        {/* Image Gallery */}
        {galleryImages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-96">
            {/* Main image */}
            <div className="md:col-span-3 rounded-2xl overflow-hidden bg-slate-100">
              <img
                src={galleryImages[selectedImageIdx]?.url ?? coverImage?.url}
                alt={hotel.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="hidden md:grid grid-rows-3 gap-3">
                {galleryImages.slice(0, 3).map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`rounded-xl overflow-hidden ${
                      selectedImageIdx === idx ? "ring-2 ring-trivia-500" : ""
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Info + Rooms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {hotel.longDesc && (
              <section className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">About this property</h2>
                <p className="text-slate-700 whitespace-pre-wrap">{hotel.longDesc}</p>
              </section>
            )}

            {/* Amenities */}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 gap-2">
                  {hotel.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-trivia-500" />
                      {a}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Available Rooms */}
            <section id="rooms" className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Available rooms</h2>
              <p className="text-sm text-slate-500 mb-4">
                {nights > 0 ? (
                  <>
                    For {nights} {nights === 1 ? "night" : "nights"} ({formatDate(checkIn)}{" "}
                    → {formatDate(checkOut)})
                  </>
                ) : (
                  "Choose your dates to see rates"
                )}
              </p>

              {roomsWithRates.length === 0 && roomsWithoutRates.length === 0 ? (
                <div className="text-center py-8">
                  <Bed className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No room types defined</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {roomsWithRates.map((room) => (
                    <RoomRow
                      key={room.id}
                      room={room}
                      nights={nights}
                      onSelect={() => handleSelectRoom(room)}
                    />
                  ))}

                  {roomsWithoutRates.length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-2">
                        Not available for selected dates:
                      </p>
                      {roomsWithoutRates.map((room) => (
                        <div
                          key={room.id}
                          className="text-sm text-slate-400 italic py-2"
                        >
                          {room.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Policies */}
            {(hotel.cancellationPolicy || hotel.policies || hotel.importantInfo) && (
              <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Policies & Information</h2>

                {hotel.policies && (
                  <PolicyBlock icon={Info} title="Hotel policies" body={hotel.policies} />
                )}

                {hotel.cancellationPolicy && (
                  <PolicyBlock
                    icon={Calendar}
                    title="Cancellation policy"
                    body={hotel.cancellationPolicy}
                  />
                )}

                {hotel.importantInfo && (
                  <PolicyBlock
                    icon={AlertCircle}
                    title="Important information"
                    body={hotel.importantInfo}
                  />
                )}
              </section>
            )}
          </div>

          {/* Right: Sticky booking summary */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-3">Your search</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Check-in
                    </div>
                    <div className="font-medium text-slate-900">
                      {checkIn ? formatDate(checkIn) : "Not selected"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Check-out
                    </div>
                    <div className="font-medium text-slate-900">
                      {checkOut ? formatDate(checkOut) : "Not selected"}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        Nights
                      </div>
                      <div className="font-medium text-slate-900">{nights}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        Guests
                      </div>
                      <div className="font-medium text-slate-900">{pax}</div>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/hotels/results?${searchParamsString}`}
                  className="mt-4 block text-center text-sm text-trivia-600 hover:underline font-medium"
                >
                  Modify search
                </Link>
              </div>

              <div className="bg-trivia-50 border border-trivia-100 rounded-2xl p-4">
                <p className="text-xs text-trivia-900 font-medium mb-1">💡 Quick tip</p>
                <p className="text-xs text-trivia-700">
                  Scroll down to view available rooms. Click &quot;Select Room&quot; to start
                  the booking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedRoom && (
        <BookingModal
          open={bookingModalOpen}
          onClose={() => {
            setBookingModalOpen(false);
            setSelectedRoom(null);
          }}
          hotelId={hotel.id}
          hotelName={hotel.name}
          room={selectedRoom}
          checkIn={checkIn}
          checkOut={checkOut}
          nights={nights}
          pax={pax}
        />
      )}
    </>
  );
}

// ─── Room Row Component ──────────────────────

function RoomRow({
  room,
  nights,
  onSelect,
}: {
  room: RoomTypeWithRate;
  nights: number;
  onSelect: () => void;
}) {
  if (!room.rate) return null;

  const sellDouble = Number(room.rate.sellDouble ?? 0);
  const totalForStay = sellDouble * nights;

  return (
    <div className="border border-slate-200 rounded-xl p-4 hover:border-trivia-300 hover:shadow-soft transition-all">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Room image */}
        <div className="md:w-40 h-32 md:h-auto flex-shrink-0 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
          {room.images && room.images.length > 0 ? (
            <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" />
          ) : (
            <Bed className="w-10 h-10 text-slate-300" />
          )}
        </div>

        {/* Room info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">{room.name}</h3>
              {room.description && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{room.description}</p>
              )}
            </div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${
                MEAL_PLAN_COLORS[room.rate.mealPlan]
              }`}
            >
              {room.rate.mealPlan}
            </span>
          </div>

          {/* Specs */}
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-600">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" />
              Max {room.maxOccupancy}
            </div>
            {room.sizeM2 && (
              <div className="flex items-center gap-1">
                <Ruler className="w-3 h-3 text-slate-400" />
                {parseFloat(room.sizeM2).toFixed(0)} m²
              </div>
            )}
            {room.view && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-400" />
                {room.view}
              </div>
            )}
            {room.bedConfig && (
              <div className="flex items-center gap-1">
                <Bed className="w-3 h-3 text-slate-400" />
                {room.bedConfig}
              </div>
            )}
          </div>

          {/* Meal plan label */}
          <p className="text-xs text-slate-500 mt-2">
            <span className="font-medium">Meal plan:</span>{" "}
            {MEAL_PLAN_LABELS[room.rate.mealPlan]}
          </p>
        </div>

        {/* Pricing + CTA */}
        <div className="md:w-44 flex flex-col items-stretch md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
          <div className="text-right">
            <div className="text-xs text-slate-500">Per night</div>
            <div className="text-2xl font-bold text-trivia-600">${sellDouble.toFixed(0)}</div>
            {nights > 1 && (
              <div className="text-xs text-slate-500 mt-0.5">
                ${totalForStay.toFixed(0)} total
              </div>
            )}
          </div>
          <button
            onClick={onSelect}
            className="mt-3 w-full md:w-auto px-4 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            Select room
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Policy Block ────────────────────────────

function PolicyBlock({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-medium text-slate-900 text-sm mb-1">{title}</h4>
        <p className="text-sm text-slate-600 whitespace-pre-wrap">{body}</p>
      </div>
    </div>
  );
}
