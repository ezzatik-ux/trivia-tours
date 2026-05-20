import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { getHotelBookingDetail } from "@/app/(workspace)/ops/hotel-queue/actions";
import { HotelVoucherPDF } from "./hotel-voucher-pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { bookingId } = await params;

  const booking = await getHotelBookingDetail(bookingId);
  if (!booking) {
    return new NextResponse("Booking not found", { status: 404 });
  }

  // Generate QR code linking back to internal booking page
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trivia-tours.vercel.app";
  const qrUrl = `${appUrl}/ops/hotel-bookings/${booking.id}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 200,
    margin: 1,
    color: { dark: "#04040c", light: "#FFFFFF" },
  });

  // Generate PDF
  const pdfBuffer = await renderToBuffer(
    HotelVoucherPDF({ booking, qrDataUrl })
  );

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="voucher-${booking.bookingNo}.pdf"`,
    },
  });
}
