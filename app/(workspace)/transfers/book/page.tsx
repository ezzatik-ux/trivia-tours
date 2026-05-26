import { requireAuth } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { getTransferBookingContext } from "../actions";
import { TransferBookingForm } from "./transfer-booking-form";

type SearchParams = Promise<{
  rateId?: string;
  routeId?: string;
  date?: string;
  pax?: string;
}>;

export default async function TransferBookPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAuth();
  const params = await searchParams;

  if (!params.rateId || !params.routeId) {
    redirect("/transfers");
  }

  const context = await getTransferBookingContext(params.routeId, params.rateId);
  if (!context) {
    redirect("/transfers");
  }

  return (
    <TransferBookingForm
      context={context}
      defaultDate={params.date ?? ""}
      defaultPax={params.pax ? parseInt(params.pax) : 2}
    />
  );
}
