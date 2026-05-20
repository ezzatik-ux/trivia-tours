import Link from "next/link";
import {
  TrendingUp,
  Calendar,
  Hotel,
  Plane,
  Search,
  BarChart3,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import {
  getHotelDashboardStats,
  getRecentHotelBookings,
  getUrgentHotelBookings,
} from "./hotel-stats-actions";
import {
  getTourDashboardStats,
  getRecentTourBookings,
} from "./tour-stats-actions";
import { HotelDashboardWidget } from "./hotel-dashboard-widget";
import { ToursDashboardWidget } from "./tours-dashboard-widget";

export default async function DashboardPage() {
  const user = await requireAuth();

  const [
    hotelStats,
    recentHotelBookings,
    urgentHotelBookings,
    tourStats,
    recentTourBookings,
  ] = await Promise.all([
    getHotelDashboardStats(),
    getRecentHotelBookings(5),
    user.role === "OPS" || user.role === "ADMIN"
      ? getUrgentHotelBookings(4)
      : Promise.resolve([]),
    getTourDashboardStats(),
    getRecentTourBookings(5),
  ]);

  // Calculate combined revenue
  const combinedRevenue = tourStats.bookings.revenue + hotelStats.bookings.revenue;
  const combinedBookings = tourStats.bookings.thisMonth + hotelStats.bookings.thisMonth;
  const combinedPending = tourStats.bookings.pending + hotelStats.bookings.pending;

  const greeting = getGreeting();
  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      {/* ━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-gradient-to-br from-trivia-900 via-trivia-900 to-slate-900 rounded-3xl shadow-elevated p-6 md:p-8 text-white relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-trivia-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-trivia-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-trivia-300" />
              <span className="text-xs uppercase tracking-[0.15em] text-white/60 font-semibold">
                {greeting}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {firstName}</h1>
            <p className="text-white/70 mt-1 text-sm">
              {getRoleSubtitle(user.role)}
            </p>
          </div>

          {/* Quick action — varies by role */}
          <QuickAction role={user.role} />
        </div>

        {/* Quick stats inline */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 relative z-10">
          <HeroStat
            label="This month"
            value={combinedBookings}
            sublabel={`${combinedBookings === 1 ? "booking" : "bookings"} created`}
            icon={Calendar}
          />
          <HeroStat
            label="Revenue MTD"
            value={`$${combinedRevenue.toFixed(0)}`}
            sublabel={user.role === "SALES" ? "your total" : "team total"}
            icon={TrendingUp}
          />
          <HeroStat
            label="Pending"
            value={combinedPending}
            sublabel={combinedPending === 0 ? "all clear" : "need attention"}
            icon={Calendar}
            highlight={combinedPending > 0 && (user.role === "OPS" || user.role === "ADMIN")}
          />
          <HeroStat
            label="Catalog"
            value={tourStats.catalog.activeProducts + hotelStats.catalog.activeHotels}
            sublabel="active products"
            icon={BarChart3}
          />
        </div>
      </div>

      {/* ━━ TOURS WIDGET ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ToursDashboardWidget
        role={user.role as "SALES" | "OPS" | "PRODUCT" | "ADMIN"}
        stats={tourStats}
        recentBookings={recentTourBookings}
      />

      {/* ━━ HOTELS WIDGET ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <HotelDashboardWidget
        role={user.role as "SALES" | "OPS" | "PRODUCT" | "ADMIN"}
        stats={hotelStats}
        recentBookings={recentHotelBookings}
        urgentBookings={urgentHotelBookings}
      />

      {/* ━━ QUICK LINKS GRID ━━━━━━━━━━━━━━━━━━━━━ */}
      <QuickLinksGrid role={user.role} />
    </div>
  );
}

// ─── HERO STAT ───────────────────────────────

function HeroStat({
  label,
  value,
  sublabel,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: number | string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 backdrop-blur-sm transition-all ${
        highlight
          ? "bg-trivia-500/30 border border-trivia-400/50"
          : "bg-white/10 border border-white/10"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-white/60" />
        <p className="text-[10px] uppercase tracking-wider text-white/60 font-semibold">
          {label}
        </p>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      {sublabel && (
        <p className={`text-[10px] mt-0.5 ${highlight ? "text-trivia-100" : "text-white/50"}`}>
          {sublabel}
        </p>
      )}
    </div>
  );
}

// ─── QUICK ACTION (role-specific) ────────────

function QuickAction({ role }: { role: string }) {
  if (role === "SALES" || role === "ADMIN") {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
        <Link
          href="/search"
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm"
        >
          <Plane className="w-3.5 h-3.5" />
          New Tour Booking
        </Link>
        <Link
          href="/hotels"
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium shadow-brand transition-colors"
        >
          <Hotel className="w-3.5 h-3.5" />
          New Hotel Booking
        </Link>
      </div>
    );
  }

  if (role === "OPS") {
    return (
      <Link
        href="/ops/queue"
        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium shadow-brand transition-colors w-full md:w-auto"
      >
        View Queue
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    );
  }

  if (role === "PRODUCT") {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
        <Link
          href="/products/new"
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm"
        >
          <Plane className="w-3.5 h-3.5" />
          Add Tour
        </Link>
        <Link
          href="/admin/hotels/new"
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium shadow-brand transition-colors"
        >
          <Hotel className="w-3.5 h-3.5" />
          Add Hotel
        </Link>
      </div>
    );
  }

  return null;
}

// ─── QUICK LINKS GRID ────────────────────────

function QuickLinksGrid({ role }: { role: string }) {
  const links = getQuickLinks(role);

  if (links.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Quick Access
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group bg-white border border-slate-200 hover:border-trivia-300 rounded-2xl p-4 transition-all hover:shadow-soft"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-trivia-50 flex items-center justify-center mb-3 transition-colors">
                <Icon className="w-5 h-5 text-slate-600 group-hover:text-trivia-600 transition-colors" />
              </div>
              <p className="font-semibold text-slate-900 text-sm group-hover:text-trivia-700 transition-colors">
                {link.label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{link.description}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ─── HELPERS ─────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getRoleSubtitle(role: string) {
  const subtitles: Record<string, string> = {
    SALES: "Browse the catalog, build quotes, and manage your bookings",
    OPS: "Process bookings, coordinate with suppliers, issue vouchers",
    PRODUCT: "Maintain the catalog and keep rates current",
    ADMIN: "Full platform access — manage everything",
  };
  return subtitles[role] ?? "Standard user access";
}

function getQuickLinks(role: string) {
  const allLinks = [
    {
      label: "Search Tours",
      description: "Find tours by country",
      href: "/search",
      icon: Search,
      roles: ["SALES", "ADMIN"],
    },
    {
      label: "Find Hotels",
      description: "Search hotel inventory",
      href: "/hotels",
      icon: Hotel,
      roles: ["SALES", "ADMIN"],
    },
    {
      label: "My Bookings",
      description: "All your reservations",
      href: "/bookings",
      icon: Calendar,
      roles: ["SALES", "ADMIN"],
    },
    {
      label: "Tour Queue",
      description: "Active tour bookings",
      href: "/ops/queue",
      icon: Calendar,
      roles: ["OPS", "ADMIN"],
    },
    {
      label: "Hotel Queue",
      description: "Active hotel bookings",
      href: "/ops/hotel-queue",
      icon: Hotel,
      roles: ["OPS", "ADMIN"],
    },
    {
      label: "Analytics",
      description: "Performance insights",
      href: "/analytics",
      icon: BarChart3,
      roles: ["SALES", "OPS", "ADMIN"],
    },
    {
      label: "Manage Tours",
      description: "Catalog & rates",
      href: "/products",
      icon: Plane,
      roles: ["PRODUCT", "ADMIN"],
    },
    {
      label: "Manage Hotels",
      description: "Hotel catalog",
      href: "/admin/hotels",
      icon: Hotel,
      roles: ["PRODUCT", "ADMIN"],
    },
  ];

  return allLinks.filter((link) => link.roles.includes(role));
}
