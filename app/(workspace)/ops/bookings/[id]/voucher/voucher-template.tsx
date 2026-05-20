import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { countryFlagEmoji } from "@/components/ui/country-flag";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#0f172a",
    marginBottom: 20,
  },
  brandSection: {
    flexDirection: "column",
  },
  brandLogo: {
    width: 60,
    height: 60,
    backgroundColor: "#0f172a",
    color: "#ffffff",
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 8,
    textAlign: "center",
    paddingTop: 18,
  },
  brandName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  brandTagline: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  voucherSection: {
    alignItems: "flex-end",
  },
  voucherLabel: {
    fontSize: 10,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  voucherNo: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  issuedDate: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 4,
  },

  // Product section
  productSection: {
    marginBottom: 20,
  },
  productImage: {
    width: "100%",
    height: 180,
    objectFit: "cover",
    borderRadius: 8,
    marginBottom: 12,
  },
  productName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: "row",
    gap: 12,
    fontSize: 9,
    color: "#475569",
  },
  productMetaItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Two-column info
  infoRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
  },
  infoCardTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  infoRowItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 8,
    color: "#64748b",
    width: 60,
  },
  infoValue: {
    fontSize: 9,
    color: "#1e293b",
    flex: 1,
    fontFamily: "Helvetica-Bold",
  },

  // Pickup/Logistics section
  logisticsBox: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fbbf24",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  logisticsTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#78350f",
    marginBottom: 8,
  },
  logisticsRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  logisticsLabel: {
    fontSize: 8,
    color: "#92400e",
    width: 80,
  },
  logisticsValue: {
    fontSize: 9,
    color: "#1e293b",
    flex: 1,
  },

  // Inclusions/Exclusions
  listSection: {
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 6,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 9,
    color: "#10b981",
    marginRight: 4,
  },
  bulletX: {
    fontSize: 9,
    color: "#ef4444",
    marginRight: 4,
  },
  listText: {
    fontSize: 9,
    color: "#334155",
    flex: 1,
  },

  // Emergency
  emergencyBox: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  emergencyTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#991b1b",
    marginBottom: 6,
  },
  emergencyText: {
    fontSize: 9,
    color: "#7f1d1d",
    marginBottom: 2,
  },

  // QR + Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  qrSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qrImage: {
    width: 60,
    height: 60,
  },
  qrLabel: {
    fontSize: 8,
    color: "#64748b",
    maxWidth: 100,
  },
  footerText: {
    fontSize: 8,
    color: "#64748b",
    textAlign: "right",
  },
  footerBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
});

export type VoucherProps = {
  bookingNo: string;
  issuedDate: string;
  productName: string;
  productType: string;
  countryName: string | null;
  countryCode: string | null;
  durationHours: string | null;
  coverImage: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  travelDate: string;
  pickupTime: string | null;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  adults: number;
  children: number;
  infants: number;
  totalPax: number;
  meetingPoint: string | null;
  language: string | null;
  inclusions: string[];
  exclusions: string[];
  cancellationPolicy: string | null;
  importantInfo: string | null;
  supplierName: string | null;
  supplierPhone: string | null;
  supplierRef: string | null;
  qrCodeDataUrl: string | null;
};

export function VoucherTemplate(props: VoucherProps) {
  const paxBreakdown = `${props.adults} adult${props.adults !== 1 ? "s" : ""}${
    props.children ? `, ${props.children} child${props.children !== 1 ? "ren" : ""}` : ""
  }${props.infants ? `, ${props.infants} infant${props.infants !== 1 ? "s" : ""}` : ""}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandSection}>
            <View style={styles.brandLogo}>
              <Text>T</Text>
            </View>
            <Text style={styles.brandName}>Trivia Tours</Text>
            <Text style={styles.brandTagline}>Egypt · Middle East · Worldwide</Text>
          </View>

          <View style={styles.voucherSection}>
            <Text style={styles.voucherLabel}>Booking Voucher</Text>
            <Text style={styles.voucherNo}>{props.bookingNo}</Text>
            <Text style={styles.issuedDate}>Issued: {props.issuedDate}</Text>
          </View>
        </View>

        {/* Product Section */}
        <View style={styles.productSection}>
          {props.coverImage && (
            <Image src={props.coverImage} style={styles.productImage} />
          )}
          <Text style={styles.productName}>{props.productName}</Text>
          <View style={styles.productMeta}>
            <Text>{props.countryName ? `${countryFlagEmoji(props.countryCode)} ${props.countryName}`.trim() : ""}</Text>
            <Text>•</Text>
            <Text>{props.productType}</Text>
            {props.durationHours && (
              <>
                <Text>•</Text>
                <Text>{props.durationHours} hours</Text>
              </>
            )}
            {props.language && (
              <>
                <Text>•</Text>
                <Text>{props.language}</Text>
              </>
            )}
          </View>
        </View>

        {/* Customer + Travel Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Customer</Text>
            <View style={styles.infoRowItem}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{props.customerName}</Text>
            </View>
            {props.customerPhone && (
              <View style={styles.infoRowItem}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{props.customerPhone}</Text>
              </View>
            )}
            {props.customerEmail && (
              <View style={styles.infoRowItem}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{props.customerEmail}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Travel</Text>
            <View style={styles.infoRowItem}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>
                {new Date(props.travelDate).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.infoRowItem}>
              <Text style={styles.infoLabel}>Passengers</Text>
              <Text style={styles.infoValue}>{paxBreakdown}</Text>
            </View>
            {props.pickupTime && (
              <View style={styles.infoRowItem}>
                <Text style={styles.infoLabel}>Pickup</Text>
                <Text style={styles.infoValue}>{props.pickupTime}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Logistics / Pickup */}
        {(props.pickupLocation || props.meetingPoint || props.dropoffLocation) && (
          <View style={styles.logisticsBox}>
            <Text style={styles.logisticsTitle}>📍 Logistics</Text>
            {props.pickupLocation && (
              <View style={styles.logisticsRow}>
                <Text style={styles.logisticsLabel}>Pickup:</Text>
                <Text style={styles.logisticsValue}>{props.pickupLocation}</Text>
              </View>
            )}
            {props.dropoffLocation && (
              <View style={styles.logisticsRow}>
                <Text style={styles.logisticsLabel}>Dropoff:</Text>
                <Text style={styles.logisticsValue}>{props.dropoffLocation}</Text>
              </View>
            )}
            {props.meetingPoint && (
              <View style={styles.logisticsRow}>
                <Text style={styles.logisticsLabel}>Meeting:</Text>
                <Text style={styles.logisticsValue}>{props.meetingPoint}</Text>
              </View>
            )}
          </View>
        )}

        {/* Inclusions */}
        {props.inclusions && props.inclusions.length > 0 && (
          <View style={styles.listSection}>
            <Text style={styles.listTitle}>What's Included</Text>
            {props.inclusions.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.bullet}>✓</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Exclusions */}
        {props.exclusions && props.exclusions.length > 0 && (
          <View style={styles.listSection}>
            <Text style={styles.listTitle}>Not Included</Text>
            {props.exclusions.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.bulletX}>✗</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Emergency Contact */}
        <View style={styles.emergencyBox}>
          <Text style={styles.emergencyTitle}>⚠️ Emergency Contacts</Text>
          {props.supplierName && (
            <Text style={styles.emergencyText}>
              Local Supplier: {props.supplierName}
              {props.supplierPhone ? ` — ${props.supplierPhone}` : ""}
            </Text>
          )}
          {props.supplierRef && (
            <Text style={styles.emergencyText}>
              Supplier Reference: {props.supplierRef}
            </Text>
          )}
          <Text style={styles.emergencyText}>
            Trivia Tours Operations: ops@triviaeg.com
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.qrSection}>
            {props.qrCodeDataUrl && (
              <Image src={props.qrCodeDataUrl} style={styles.qrImage} />
            )}
            <Text style={styles.qrLabel}>Scan to verify booking</Text>
          </View>

          <View>
            <Text style={styles.footerBold}>Trivia Egypt</Text>
            <Text style={styles.footerText}>www.triviaeg.com</Text>
            <Text style={styles.footerText}>Voucher #{props.bookingNo}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
