import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth-utils";
import { getBookingById } from "@/app/(workspace)/bookings/actions";

export default async function OpsBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["OPS", "ADMIN"]);

  const { id } = await params;
  const data = await getBookingById(id);

  if (!data) notFound();

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href="/ops/queue"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to queue
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">{data.productName}</h1>
        <p className="text-slate-500 mt-1 font-mono text-sm">{data.booking.bookingNo}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-400 mb-2">⚙️ Full Ops detail view comes in Substep 4.2</p>
        <p className="text-xs text-slate-400">
          Will include: status changer, supplier coordination, internal notes timeline, voucher generation
        </p>
      </div>
    </div>
  );
}
