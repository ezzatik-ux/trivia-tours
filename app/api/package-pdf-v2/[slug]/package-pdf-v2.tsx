import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

type Day = {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  locationName: string | null;
  images: { url: string; isCover: boolean; sortOrder: number }[];
};

type PackageData = {
  name: string;
  slug: string;
  code: string | null;
  shortDesc: string | null;
  overview: string | null;
  durationDays: number;
  durationNights: number | null;
  inclusions: string[];
  exclusions: string[];
  highlights: string[];
  cancellationPolicy: string | null;
  importantInfo: string | null;
  countryName: string | null;
  countryCode: string | null;
  days: Day[];
  accommodations: {
    hotelName: string;
    cityName: string | null;
    nights: number;
    boardBasis: "RO" | "BB" | "HB" | "FB" | "AI";
    startDate: string | null;
    roomType: string | null;
  }[];
  images: { url: string; isCover: boolean }[];
  fromPrice: string | null;
};

const BOARD_BASIS_LABELS: Record<
  "RO" | "BB" | "HB" | "FB" | "AI",
  string
> = {
  RO: "Room Only",
  BB: "Bed & Breakfast",
  HB: "Half Board",
  FB: "Full Board",
  AI: "All Inclusive",
};

type Props = {
  pkg: PackageData;
  qrDataUrl: string;
};

const COLORS = {
  red: "#e4242c",
  dark: "#04040c",
  textGray: "#475569",
  lightGray: "#94a3b8",
  border: "#e2e8f0",
  bg: "#f8fafc",
  white: "#ffffff",
  emerald: "#059669",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.dark,
    // Clear fixed header (~36pt) + footer (~52pt) so content never overlaps
    paddingTop: 56,
    paddingBottom: 64,
    paddingHorizontal: 40,
  },
  // Thin repeating bar — pinned top of every page (separate from page-1 ref strip)
  pageHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pageHeaderBrand: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.dark,
    letterSpacing: 0.5,
  },
  pageHeaderBrandAccent: { color: COLORS.red },
  pageHeaderMeta: {
    fontSize: 8,
    color: COLORS.textGray,
    textAlign: "right",
    maxWidth: "65%",
  },
  refStrip: {
    backgroundColor: COLORS.red,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 4,
    marginBottom: 18,
  },
  refLeft: { flexDirection: "column", flex: 1, paddingRight: 12 },
  refLabel: {
    fontSize: 7,
    color: COLORS.white,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
    opacity: 0.9,
  },
  refNumber: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  refMeta: {
    fontSize: 9,
    color: COLORS.white,
    marginTop: 4,
    opacity: 0.95,
  },
  qrBox: {
    backgroundColor: COLORS.white,
    padding: 4,
    borderRadius: 4,
  },
  qrImage: { width: 60, height: 60 },
  coverImage: {
    width: "100%",
    height: 180,
    objectFit: "cover",
    borderRadius: 4,
    marginBottom: 18,
  },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 8,
    color: COLORS.red,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bodyText: {
    fontSize: 10,
    color: COLORS.dark,
    lineHeight: 1.5,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 4,
    paddingRight: 8,
  },
  bulletMark: {
    width: 14,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  bulletInclude: { color: COLORS.emerald },
  bulletExclude: { color: COLORS.red },
  bulletHighlight: { color: COLORS.red },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: COLORS.dark,
    lineHeight: 1.4,
  },
  dayBlock: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dayTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.dark,
    marginBottom: 3,
  },
  dayLocation: {
    fontSize: 9,
    color: COLORS.textGray,
    marginBottom: 3,
  },
  dayDesc: {
    fontSize: 9,
    color: COLORS.textGray,
    lineHeight: 1.4,
  },
  dayImageRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  dayThumb: { width: 80, height: 60, objectFit: "cover", borderRadius: 4 },
  accTable: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
  },
  accHeaderRow: {
    flexDirection: "row",
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  accRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  accHeaderCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textGray,
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  accCell: {
    fontSize: 9,
    color: COLORS.dark,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  accColHotel: { flex: 4 },
  accColDest: { flex: 2.5 },
  accColRoom: { flex: 2.5 },
  accColNights: { flex: 1.5 },
  accColBasis: { flex: 1.5 },
  accKey: {
    fontSize: 8,
    color: COLORS.textGray,
    marginTop: 6,
  },
  twoCol: { flexDirection: "row", gap: 16 },
  col: { flex: 1 },
  priceBox: {
    backgroundColor: COLORS.bg,
    padding: 14,
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: { fontSize: 10, color: COLORS.textGray },
  priceValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLORS.red,
  },
  notesBox: {
    backgroundColor: "#fef3c7",
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
    marginTop: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#78350f",
    lineHeight: 1.4,
  },
  // Pinned bottom of every page — absolute only (no flow/marginTop tricks)
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerCol: { flexDirection: "column", maxWidth: "70%" },
  footerText: {
    fontSize: 7,
    color: COLORS.textGray,
    lineHeight: 1.3,
  },
  footerTextBold: {
    fontSize: 8,
    color: COLORS.dark,
    fontFamily: "Helvetica-Bold",
    marginBottom: 1,
  },
  pageNumber: {
    fontSize: 8,
    color: COLORS.textGray,
    fontFamily: "Helvetica-Bold",
  },
});

function formatShortDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function durationLabel(days: number, nights: number | null) {
  const dayPart = `${days} ${days === 1 ? "day" : "days"}`;
  if (nights == null) return dayPart;
  return `${dayPart} / ${nights} ${nights === 1 ? "night" : "nights"}`;
}

export function PackagePDFv2({ pkg, qrDataUrl }: Props) {
  const coverUrl =
    pkg.images.find((img) => img.isCover)?.url ?? pkg.images[0]?.url ?? null;

  const hasHighlights = pkg.highlights.length > 0;
  const hasInclusions = pkg.inclusions.length > 0;
  const hasExclusions = pkg.exclusions.length > 0;
  const hasDays = pkg.days.length > 0;
  const hasAccommodations = pkg.accommodations.length > 0;
  const usedBoardCodes = Array.from(
    new Set(pkg.accommodations.map((a) => a.boardBasis))
  ) as Array<"RO" | "BB" | "HB" | "FB" | "AI">;

  const metaParts = [
    pkg.countryName,
    durationLabel(pkg.durationDays, pkg.durationNights),
  ].filter(Boolean);

  const headerMeta = pkg.code
    ? `${pkg.name} · ${pkg.code}`
    : pkg.name;

  return (
    <Document
      title={`${pkg.name} — Package Brochure (v2)`}
      author="Trivia Egypt"
      subject={`Package brochure for ${pkg.name}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Fixed header — repeats every page */}
        <View style={styles.pageHeader} fixed>
          <Text style={styles.pageHeaderBrand}>
            Trivia <Text style={styles.pageHeaderBrandAccent}>Pro</Text>
          </Text>
          <Text style={styles.pageHeaderMeta}>{headerMeta}</Text>
        </View>

        {/* Ref / fast-facts strip (page 1 flow) */}
        <View style={styles.refStrip}>
          <View style={styles.refLeft}>
            <Text style={styles.refLabel}>Package</Text>
            <Text style={styles.refNumber}>{pkg.name}</Text>
            {pkg.code ? (
              <Text style={styles.refMeta}>Reference: {pkg.code}</Text>
            ) : null}
            {metaParts.length > 0 && (
              <Text style={styles.refMeta}>{metaParts.join(" · ")}</Text>
            )}
          </View>
          <View style={styles.qrBox}>
            <Image src={qrDataUrl} style={styles.qrImage} />
          </View>
        </View>

        {coverUrl ? (
          <Image src={coverUrl} style={styles.coverImage} />
        ) : null}

        {pkg.shortDesc ? (
          <View style={styles.section}>
            <Text style={styles.bodyText}>{pkg.shortDesc}</Text>
          </View>
        ) : null}

        {pkg.overview ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.bodyText}>{pkg.overview}</Text>
          </View>
        ) : null}

        {hasHighlights ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Highlights</Text>
            {pkg.highlights.map((item, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={[styles.bulletMark, styles.bulletHighlight]}>
                  •
                </Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {hasDays ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Itinerary</Text>
            {pkg.days.map((day) => {
              const dayThumbs = [...day.images]
                .sort((a, b) => (b.isCover ? 1 : 0) - (a.isCover ? 1 : 0))
                .slice(0, 2);
              return (
                <View key={day.id} style={styles.dayBlock} wrap={false}>
                  <Text style={styles.dayTitle}>
                    Day {day.dayNumber}: {day.title}
                  </Text>
                  {day.locationName ? (
                    <Text style={styles.dayLocation}>{day.locationName}</Text>
                  ) : null}
                  {day.description ? (
                    <Text style={styles.dayDesc}>{day.description}</Text>
                  ) : null}
                  {dayThumbs.length > 0 ? (
                    <View style={styles.dayImageRow}>
                      {dayThumbs.map((img, i) => (
                        <Image key={i} src={img.url} style={styles.dayThumb} />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {hasAccommodations ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accommodation</Text>
            <View style={styles.accTable}>
              <View style={styles.accHeaderRow}>
                <Text style={[styles.accHeaderCell, styles.accColHotel]}>
                  Hotel
                </Text>
                <Text style={[styles.accHeaderCell, styles.accColDest]}>
                  Destination
                </Text>
                <Text style={[styles.accHeaderCell, styles.accColRoom]}>
                  Room
                </Text>
                <Text style={[styles.accHeaderCell, styles.accColNights]}>
                  Nights
                </Text>
                <Text style={[styles.accHeaderCell, styles.accColBasis]}>
                  Basis
                </Text>
              </View>
              {pkg.accommodations.map((acc, idx) => (
                <View key={idx} style={styles.accRow}>
                  <Text style={[styles.accCell, styles.accColHotel]}>
                    {acc.hotelName}
                  </Text>
                  <Text style={[styles.accCell, styles.accColDest]}>
                    {acc.cityName || "—"}
                  </Text>
                  <Text style={[styles.accCell, styles.accColRoom]}>
                    {acc.roomType || "—"}
                  </Text>
                  <Text style={[styles.accCell, styles.accColNights]}>
                    {acc.nights} {acc.nights === 1 ? "night" : "nights"}
                  </Text>
                  <Text style={[styles.accCell, styles.accColBasis]}>
                    {acc.boardBasis}
                  </Text>
                </View>
              ))}
            </View>
            {usedBoardCodes.length > 0 ? (
              <Text style={styles.accKey}>
                Key —{" "}
                {usedBoardCodes
                  .map((code) => `${code}: ${BOARD_BASIS_LABELS[code]}`)
                  .join(" · ")}
              </Text>
            ) : null}
          </View>
        ) : null}

        {(hasInclusions || hasExclusions) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{"What's Included"}</Text>
            <View style={styles.twoCol}>
              {hasInclusions ? (
                <View style={styles.col}>
                  <Text
                    style={{
                      fontSize: 9,
                      fontFamily: "Helvetica-Bold",
                      marginBottom: 6,
                      color: COLORS.dark,
                    }}
                  >
                    Included
                  </Text>
                  {pkg.inclusions.map((item, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <Text style={[styles.bulletMark, styles.bulletInclude]}>
                        ✓
                      </Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {hasExclusions ? (
                <View style={styles.col}>
                  <Text
                    style={{
                      fontSize: 9,
                      fontFamily: "Helvetica-Bold",
                      marginBottom: 6,
                      color: COLORS.dark,
                    }}
                  >
                    Not included
                  </Text>
                  {pkg.exclusions.map((item, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <Text style={[styles.bulletMark, styles.bulletExclude]}>
                        ✕
                      </Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>
              {pkg.fromPrice ? "From" : "Pricing"}
            </Text>
            <Text style={styles.priceValue}>
              {pkg.fromPrice
                ? `$${parseFloat(pkg.fromPrice).toFixed(0)} per person`
                : "Contact for pricing"}
            </Text>
          </View>
        </View>

        {pkg.cancellationPolicy ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cancellation Policy</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{pkg.cancellationPolicy}</Text>
            </View>
          </View>
        ) : null}

        {pkg.importantInfo ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Important Information</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{pkg.importantInfo}</Text>
            </View>
          </View>
        ) : null}

        {/* Fixed footer — absolute bottom, repeats every page */}
        <View style={styles.footer} fixed>
          <View style={styles.footerCol}>
            <Text style={styles.footerTextBold}>Trivia Egypt</Text>
            <Text style={styles.footerText}>
              20 El-Kawthar, Dokki, Giza · +20 101 991 1016 ·
              operations@triviaeg.com · Issued {formatShortDate(new Date())}
            </Text>
          </View>
          <Text
            style={styles.pageNumber}
            fixed
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
