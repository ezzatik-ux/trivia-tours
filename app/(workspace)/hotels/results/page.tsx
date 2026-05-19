import { requireAuth } from "@/lib/auth-utils";
import { searchHotels } from "../actions";
import { ResultsClient } from "../results-client";

type SearchParams = Promise<{
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  pax?: string;
}>;

export default async function HotelResultsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAuth();

  const params = await searchParams;

  const hotels = await searchHotels({
    destination: params.destination,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    pax: params.pax ? parseInt(params.pax) : 2,
  });

  return <ResultsClient hotels={hotels} searchParams={params} />;
}
