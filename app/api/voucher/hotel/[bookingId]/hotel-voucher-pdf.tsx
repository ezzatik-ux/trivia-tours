import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

type Booking = {
  id: string;
  bookingNo: string;
  status: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerNationality: string | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  numRooms: number;
  occupancy: string | null;
  adults: number;
  children: number;
  totalPrice: string;
  specialRequests: string | null;
  hotelName: string | null;
  hotelBrand: string | null;
  hotelAddress: string | null;
  hotelContactPhone: string | null;
  hotelCancellationPolicy: string | null;
  countryName: string | null;
  roomTypeName: string | null;
  roomBedConfig: string | null;
  rateMealPlan: string | null;
  hotelConfirmationRef: string | null;
  createdAt: Date;
};

type Props = {
  booking: Booking;
  qrDataUrl: string;
};

const MEAL_PLAN_LABELS: Record<string, string> = {
  RO: "Room Only",
  BB: "Bed & Breakfast",
  HB: "Half Board",
  FB: "Full Board",
  AI: "All Inclusive",
};

const COLORS = {
  red: "#e4242c",
  redDark: "#a3181e",
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
    padding: 0,
  },
  header: {
    backgroundColor: COLORS.dark,
    padding: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brand: { flexDirection: "column" },
  brandName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  brandRed: { color: COLORS.red },
  brandTag: {
    fontSize: 8,
    color: COLORS.lightGray,
    marginTop: 3,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  docType: { flexDirection: "column", alignItems: "flex-end" },
  docTypeText: {
    fontSize: 9,
    color: COLORS.lightGray,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  docTypeTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
  },
  refStrip: {
    backgroundColor: COLORS.red,
    paddingVertical: 14,
    paddingHorizontal: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refLeft: { flexDirection: "column" },
  refLabel: {
    fontSize: 7,
    color: "#fce7eb",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  refNumber: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    letterSpacing: 1,
  },
  qrBox: {
    backgroundColor: COLORS.white,
    padding: 4,
    borderRadius: 4,
  },
  qrImage: { width: 60, height: 60 },
  content: { padding: 30, paddingBottom: 100 },
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
  row: { flexDirection: "row", marginBottom: 6 },
  col: { flex: 1 },
  fieldLabel: {
    fontSize: 7,
    color: COLORS.lightGray,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 11,
    color: COLORS.dark,
    fontFamily: "Helvetica-Bold",
  },
  fieldValueRegular: { fontSize: 10, color: COLORS.dark },
  hotelName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLORS.dark,
    marginBottom: 4,
  },
  hotelBrand: { fontSize: 10, color: COLORS.textGray, marginBottom: 4 },
  hotelLocation: { fontSize: 10, color: COLORS.textGray, marginBottom: 2 },
  confirmedBox: {
    backgroundColor: "#d1fae5",
    borderWidth: 1,
    borderColor: COLORS.emerald,
    borderRadius: 4,
    padding: 8,
    marginTop: 6,
  },
  confirmedLabel: {
    fontSize: 7,
    color: "#065f46",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  confirmedValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#065f46",
  },
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
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: COLORS.red,
  },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  statusBadge: {
    backgroundColor: COLORS.emerald,
    color: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
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
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.dark,
    padding: 18,
    paddingHorizontal: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerCol: { flexDirection: "column" },
  footerLabel: {
    fontSize: 7,
    color: COLORS.lightGray,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 9,
    color: COLORS.white,
    fontFamily: "Helvetica-Bold",
  },
  footerRight: { flexDirection: "column", alignItems: "flex-end" },
});

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function HotelVoucherPDF({ booking, qrDataUrl }: Props) {
  const totalPrice = Number(booking.totalPrice);
  const isConfirmed = [
    "CONFIRMED",
    "VOUCHER_ISSUED",
    "CHECKED_IN",
    "CHECKED_OUT",
    "COMPLETED",
  ].includes(booking.status);

  return (
    <Document
      title={`Voucher ${booking.bookingNo}`}
      author="Trivia Egypt"
      subject={`Hotel Reservation Voucher for ${booking.customerName}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Text style={styles.brandName}>
              Trivia <Text style={styles.brandRed}>Tours</Text>
            </Text>
            <Text style={styles.brandTag}>Internal Platform</Text>
          </View>
          <View style={styles.docType}>
            <Text style={styles.docTypeText}>Document</Text>
            <Text style={styles.docTypeTitle}>Hotel Voucher</Text>
          </View>
        </View>

        <View style={styles.refStrip}>
          <View style={styles.refLeft}>
            <Text style={styles.refLabel}>Booking Reference</Text>
            <Text style={styles.refNumber}>{booking.bookingNo}</Text>
          </View>
          <View style={styles.qrBox}>
            <Image src={qrDataUrl} style={styles.qrImage} />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hotel</Text>
            <Text style={styles.hotelName}>{booking.hotelName ?? "—"}</Text>
            {booking.hotelBrand && (
              <Text style={styles.hotelBrand}>{booking.hotelBrand}</Text>
            )}
            <Text style={styles.hotelLocation}>
              {booking.countryName ?? ""}
              {booking.hotelAddress ? ` · ${booking.hotelAddress}` : ""}
            </Text>
            {booking.hotelContactPhone && (
              <Text style={styles.hotelLocation}>
                Phone: {booking.hotelContactPhone}
              </Text>
            )}

            {booking.hotelConfirmationRef && (
              <View style={styles.confirmedBox}>
                <Text style={styles.confirmedLabel}>
                  Hotel Confirmation Number
                </Text>
                <Text style={styles.confirmedValue}>
                  {booking.hotelConfirmationRef}
                </Text>
              </View>
            )}

            <View style={styles.statusRow}>
              <Text style={styles.statusBadge}>
                {isConfirmed ? "CONFIRMED" : booking.status.replace(/_/g, " ")}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guest Information</Text>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Lead Guest</Text>
                <Text style={styles.fieldValue}>{booking.customerName}</Text>
              </View>
              {booking.customerNationality && (
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Nationality</Text>
                  <Text style={styles.fieldValueRegular}>
                    {booking.customerNationality}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.row}>
              {booking.customerEmail && (
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <Text style={styles.fieldValueRegular}>
                    {booking.customerEmail}
                  </Text>
                </View>
              )}
              {booking.customerPhone && (
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Phone</Text>
                  <Text style={styles.fieldValueRegular}>
                    {booking.customerPhone}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stay Details</Text>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Check-in</Text>
                <Text style={styles.fieldValue}>
                  {formatDate(booking.checkIn)}
                </Text>
                <Text style={styles.fieldValueRegular}>After 14:00</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Check-out</Text>
                <Text style={styles.fieldValue}>
                  {formatDate(booking.checkOut)}
                </Text>
                <Text style={styles.fieldValueRegular}>Before 12:00</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Duration</Text>
                <Text style={styles.fieldValueRegular}>
                  {booking.nights}{" "}
                  {booking.nights === 1 ? "night" : "nights"}
                </Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Guests</Text>
                <Text style={styles.fieldValueRegular}>
                  {booking.adults} adult{booking.adults !== 1 ? "s" : ""}
                  {booking.children > 0 && `, ${booking.children} children`}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Room Details</Text>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Room Type</Text>
                <Text style={styles.fieldValue}>
                  {booking.roomTypeName ?? "—"}
                </Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Rooms / Occupancy</Text>
                <Text style={styles.fieldValueRegular}>
                  {booking.numRooms} room{booking.numRooms !== 1 ? "s" : ""} ·{" "}
                  {(booking.occupancy ?? "DOUBLE").charAt(0) +
                    (booking.occupancy ?? "DOUBLE").slice(1).toLowerCase()}
                </Text>
              </View>
            </View>
            <View style={styles.row}>
              {booking.roomBedConfig && (
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Bed Configuration</Text>
                  <Text style={styles.fieldValueRegular}>
                    {booking.roomBedConfig}
                  </Text>
                </View>
              )}
              {booking.rateMealPlan && (
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Meal Plan</Text>
                  <Text style={styles.fieldValueRegular}>
                    {booking.rateMealPlan} ·{" "}
                    {MEAL_PLAN_LABELS[booking.rateMealPlan]}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {booking.specialRequests && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Special Requests</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{booking.specialRequests}</Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Total Amount</Text>
              <Text style={styles.priceValue}>${totalPrice.toFixed(2)}</Text>
            </View>
          </View>

          {booking.hotelCancellationPolicy && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cancellation Policy</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>
                  {booking.hotelCancellationPolicy}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.footer} fixed>
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>Issued By</Text>
            <Text style={styles.footerValue}>Trivia Egypt</Text>
            <Text style={styles.footerLabel}>
              20 El-Kawthar, Dokki, Giza · +20 101 991 1016
            </Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.footerLabel}>Issue Date</Text>
            <Text style={styles.footerValue}>
              {formatShortDate(new Date())}
            </Text>
            <Text style={styles.footerLabel}>operations@triviaeg.com</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
