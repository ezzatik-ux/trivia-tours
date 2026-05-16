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
import { AnalyticsView } from "./analytics-view";

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
  ] = await Promise.all([
    getKpiStats(range),
    getStatusDistribution(range),
    getRevenueTrend(),
    getTopCountries(range),
    user.role === "OPS" || user.role === "ADMIN" ? getTopAgents(range) : Promise.resolve([]),
    getTopProducts(range),
    getUpcomingTravel(),
  ]);

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
    />
  );
}
