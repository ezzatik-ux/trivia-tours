import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { getPackageDetailBySlug } from "@/app/(workspace)/packages/[slug]/actions";
import { PackagePDF } from "./package-pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { slug } = await params;

  // ACTIVE-only (null if missing or draft)
  const pkg = await getPackageDetailBySlug(slug);
  if (!pkg) {
    return new NextResponse("Package not found", { status: 404 });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://trivia-tours.vercel.app";
  const qrUrl = `${appUrl}/packages/${slug}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 200,
    margin: 1,
    color: { dark: "#04040c", light: "#FFFFFF" },
  });

  const pdfBuffer = await renderToBuffer(
    PackagePDF({ pkg, qrDataUrl })
  );

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="package-${slug}.pdf"`,
    },
  });
}
