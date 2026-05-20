import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { getProductForBooking } from "../actions";
import { BookingForm } from "./booking-form";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requireAuth();

  const params = await searchParams;

  // Validate required quote params
  const requiredKeys = [
    "productId",
    "rateId",
    "travelDate",
    "adults",
    "children",
    "infants",
    "unitAdult",
    "unitChild",
    "unitInfant",
    "totalPrice",
  ];

  const missing = requiredKeys.filter((k) => !params[k]);
  if (missing.length > 0) {
    // No quote → bounce back to search
    redirect("/search");
  }

  const quote = {
    productId: params.productId,
    rateId: params.rateId,
    travelDate: params.travelDate,
    adults: parseInt(params.adults),
    children: parseInt(params.children),
    infants: parseInt(params.infants),
    unitAdult: parseFloat(params.unitAdult),
    unitChild: parseFloat(params.unitChild),
    unitInfant: parseFloat(params.unitInfant),
    totalPrice: parseFloat(params.totalPrice),
  };

  const product = await getProductForBooking(quote.productId);
  if (!product) {
    redirect("/search");
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <Link
        href={`/search/product/${quote.productId}`}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to product
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Create Booking</h1>
        <p className="text-slate-500 mt-1">
          Complete customer and pickup details to confirm the booking
        </p>
      </div>

      <BookingForm
        quote={quote}
        product={{
          name: product.name,
          type: product.type,
          countryName: product.countryName,
          countryCode: product.countryCode,
        }}
      />
    </div>
  );
}
