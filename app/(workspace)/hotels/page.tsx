import { requireAuth } from "@/lib/auth-utils";
import { getCountriesWithHotels } from "./actions";
import { HotelSearchHero } from "./hotel-search-hero";

export default async function HotelsLandingPage() {
  await requireAuth();
  const countries = await getCountriesWithHotels();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Find Hotels</h1>
        <p className="text-slate-500 mt-1">
          Search across {countries.length} destinations with confirmed availability
        </p>
      </div>

      <HotelSearchHero countries={countries} />
    </div>
  );
}
