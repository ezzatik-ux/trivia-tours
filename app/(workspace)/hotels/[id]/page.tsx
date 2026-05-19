import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { getHotelDetailForSales } from "../actions";
import { HotelDetailClient } from "./hotel-detail-client";

type SearchParams = Promise<{
  checkIn?: string;
  checkOut?: string;
  pax?: string;
}>;

export default async function HotelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  await requireAuth();

  const { id } = await params;
  const sp = await searchParams;

  const hotel = await getHotelDetailForSales(id, sp.checkIn, sp.checkOut);

  if (!hotel) notFound();

  return (
    <HotelDetailClient
      hotel={hotel}
      checkIn={sp.checkIn ?? ""}
      checkOut={sp.checkOut ?? ""}
      pax={sp.pax ? parseInt(sp.pax) : 2}
    />
  );
}
