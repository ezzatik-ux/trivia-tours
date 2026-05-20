import { requireAuth } from "@/lib/auth-utils";
import {
  getKpiStats,
  getStatusDistribution,
  getRevenueTrend,
  getTopCountries,
  getTopAgents,
  getTopProducts,
  getUpcomingTravel,
  type DateRange,
} from "./actions";
import {
  getHotelKpiStats,
  getHotelStatusDistribution,
  getTopHotels,
  getRevenueComparison,
} from "./hotel-actions";
import { AnalyticsView } from "./analytics-view";
import { HotelAnalyticsSection } from "./hotel-analytics-section";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: DateRange }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;
  const range: DateRange = params.range ?? "month";

  const [
    kpi,
    statusDistribution,
    revenueTrend,
    topCountries,
    topAgents,
    topProducts,
    upcomingTravel,
    hotelKpi,
    hotelStatusDistribution,
    topHotels,
  ] = await Promise.all([
    getKpiStats(range),
    getStatusDistribution(range),
    getRevenueTrend(),
    getTopCountries(range),
    user.role === "OPS" || user.role === "ADMIN" ? getTopAgents(range) : Promise.resolve([]),
    getTopProducts(range),
    getUpcomingTravel(),
    getHotelKpiStats(range),
    getHotelStatusDistribution(range),
    getTopHotels(range, 8),
  ]);

  const revenueComparison = await getRevenueComparison(range, kpi.revenue ?? 0);

  return (
    <AnalyticsView
      range={range}
      kpi={kpi}
      statusDistribution={statusDistribution}
      revenueTrend={revenueTrend}
      topCountries={topCountries}
      topAgents={topAgents}
      topProducts={topProducts}
      upcomingTravel={upcomingTravel}
      canExport={user.role === "OPS" || user.role === "ADMIN"}
    >
      <HotelAnalyticsSection
        range={range}
        kpi={hotelKpi}
        statusDistribution={hotelStatusDistribution}
        topHotels={topHotels}
        revenueComparison={revenueComparison}
        canExport={user.role === "OPS" || user.role === "ADMIN"}
      />
    </AnalyticsView>
  );
}
