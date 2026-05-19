import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";
import { getCountriesForHotels, getHotelById } from "../../actions";
import { HotelForm } from "../../hotel-form";
import { HotelNav } from "../../hotel-nav";

export default async function EditHotelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["PRODUCT", "ADMIN"]);

  const { id } = await params;
  const [hotel, countries] = await Promise.all([
    getHotelById(id),
    getCountriesForHotels(),
  ]);

  if (!hotel) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/admin/hotels"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Hotels
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">{hotel.name}</h1>
        <p className="text-slate-500 mt-1">Edit hotel details</p>
      </div>

      <HotelNav hotelId={id} />

      <HotelForm
        mode="edit"
        hotelId={id}
        countries={countries}
        initialData={{
          name: hotel.name,
          slug: hotel.slug,
          brand: hotel.brand,
          starRating: hotel.starRating,
          countryId: hotel.countryId,
          address: hotel.address,
          shortDesc: hotel.shortDesc,
          longDesc: hotel.longDesc,
          amenities: hotel.amenities ?? [],
          policies: hotel.policies,
          cancellationPolicy: hotel.cancellationPolicy,
          importantInfo: hotel.importantInfo,
          contactName: hotel.contactName,
          contactEmail: hotel.contactEmail,
          contactPhone: hotel.contactPhone,
          reservationEmail: hotel.reservationEmail,
          status: hotel.status,
          images: hotel.images.map((img) => ({
            url: img.url,
            isCover: img.isCover,
            sortOrder: img.sortOrder ?? 0,
          })),
        }}
      />
    </div>
  );
}
