import { createElement, type ReactElement } from "react";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import {
  bookings,
  products,
  productImages,
  countries,
  suppliers,
  bookingStatusHistory,
  notifications,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { VoucherTemplate } from "@/app/(workspace)/ops/bookings/[id]/voucher/voucher-template";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await params;

    const [data] = await db
      .select({
        booking: bookings,
        productName: products.name,
        productType: products.type,
        productDuration: products.durationHours,
        productLanguage: products.language,
        productMeetingPoint: products.meetingPoint,
        productInclusions: products.inclusions,
        productExclusions: products.exclusions,
        productCancellation: products.cancellationPolicy,
        productImportant: products.importantInfo,
        countryName: countries.name,
        countryFlag: countries.flagEmoji,
        supplierName: suppliers.name,
        supplierPhone: suppliers.contactPhone,
      })
      .from(bookings)
      .leftJoin(products, eq(bookings.productId, products.id))
      .leftJoin(countries, eq(products.countryId, countries.id))
      .leftJoin(suppliers, eq(bookings.supplierId, suppliers.id))
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!data) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const [coverImg] = await db
      .select({ url: productImages.url })
      .from(productImages)
      .where(eq(productImages.productId, data.booking.productId))
      .limit(1);

    const qrCodeDataUrl = await QRCode.toDataURL(
      `https://trivia-tours.vercel.app/bookings/${bookingId}`,
      {
        width: 240,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      }
    );

    const voucherProps = {
      bookingNo: data.booking.bookingNo,
      issuedDate: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      productName: data.productName ?? "Tour Product",
      productType: data.productType ?? "Tour",
      countryName: data.countryName,
      countryFlag: data.countryFlag,
      durationHours:
        data.productDuration != null ? String(data.productDuration) : null,
      coverImage: coverImg?.url ?? null,
      customerName: data.booking.customerName,
      customerEmail: data.booking.customerEmail,
      customerPhone: data.booking.customerPhone,
      travelDate: String(data.booking.travelDate),
      pickupTime: data.booking.pickupTime,
      pickupLocation: data.booking.pickupLocation,
      dropoffLocation: data.booking.dropoffLocation,
      adults: data.booking.adults,
      children: data.booking.children,
      infants: data.booking.infants,
      totalPax: data.booking.totalPax,
      meetingPoint: data.productMeetingPoint,
      language: data.productLanguage,
      inclusions: data.productInclusions ?? [],
      exclusions: data.productExclusions ?? [],
      cancellationPolicy: data.productCancellation,
      importantInfo: data.productImportant,
      supplierName: data.supplierName,
      supplierPhone: data.supplierPhone,
      supplierRef: data.booking.supplierRef,
      qrCodeDataUrl,
    };

    const pdfBuffer = await renderToBuffer(
      createElement(VoucherTemplate, voucherProps) as ReactElement<DocumentProps>
    );

    if (data.booking.status === "CONFIRMED") {
      await db
        .update(bookings)
        .set({
          status: "VOUCHER_ISSUED",
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

      await db.insert(bookingStatusHistory).values({
        bookingId,
        fromStatus: "CONFIRMED",
        toStatus: "VOUCHER_ISSUED",
        changedBy: session.user.id,
        note: "Voucher PDF generated",
      });

      await db.insert(notifications).values({
        userId: data.booking.salesAgentId,
        type: "BOOKING_STATUS",
        title: `Voucher ready: ${data.booking.bookingNo}`,
        message:
          "PDF voucher has been generated and is ready to send to the customer",
        relatedBookingId: bookingId,
      });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="voucher-${data.booking.bookingNo}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Voucher generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate voucher", details: String(error) },
      { status: 500 }
    );
  }
}
