import { requireAuth } from "@/lib/auth-utils";
import { searchHotels } from "../actions";
import { ResultsClient } from "../results-client";

type SearchParams = Promise<{
  destination?: string;
  query?: string;
  checkIn?: string;
  checkOut?: string;
  pax?: string;
  adults?: string;
  children?: string;
  rooms?: string;
  childAges?: string;
  starRatings?: string;
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
    query: params.query,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    pax: params.pax ? parseInt(params.pax) : 2,
    starRatings: params.starRatings
      ?.split(",")
      .map((s) => parseInt(s, 10))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= 5),
  });

  return <ResultsClient hotels={hotels} searchParams={params} />;
}
