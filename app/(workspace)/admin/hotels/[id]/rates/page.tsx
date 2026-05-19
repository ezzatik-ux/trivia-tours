import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";
import { getHotelById } from "../../actions";
import { getRoomTypesByHotel } from "../../room-types-actions";
import { getSeasonsByHotel } from "../../seasons-actions";
import { getRatesByHotel } from "../../rates-actions";
import { HotelNav } from "../../hotel-nav";
import { RatesTable } from "../../rates-table";

export default async function HotelRatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["PRODUCT", "ADMIN"]);

  const { id } = await params;

  const [hotel, roomTypes, seasons, rates] = await Promise.all([
    getHotelById(id),
    getRoomTypesByHotel(id),
    getSeasonsByHotel(id),
    getRatesByHotel(id),
  ]);

  if (!hotel) notFound();

  return (
    <div className="space-y-6 max-w-7xl">
      <Link
        href="/admin/hotels"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Hotels
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">{hotel.name}</h1>
        <p className="text-slate-500 mt-1">Manage rates per room type and season</p>
      </div>

      <HotelNav hotelId={id} />

      <RatesTable
        hotelId={id}
        rates={rates}
        roomTypes={roomTypes.filter((rt) => rt.isActive)}
        seasons={seasons.filter((s) => s.isActive)}
      />
    </div>
  );
}
