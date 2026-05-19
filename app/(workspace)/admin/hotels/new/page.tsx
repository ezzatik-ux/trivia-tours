import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth-utils";
import { getCountriesForHotels } from "../actions";
import { HotelForm } from "../hotel-form";

export default async function NewHotelPage() {
  await requireRole(["PRODUCT", "ADMIN"]);

  const countries = await getCountriesForHotels();

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
        <h1 className="text-3xl font-bold text-slate-900">Add New Hotel</h1>
        <p className="text-slate-500 mt-1">Add a new hotel from your contract</p>
      </div>

      <HotelForm mode="create" countries={countries} />
    </div>
  );
}
