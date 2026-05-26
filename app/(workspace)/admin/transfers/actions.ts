"use server";

import { db } from "@/lib/db";
import {
  transferLocations,
  transferRoutes,
  transferRates,
  countries,
  suppliers,
} from "@/lib/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";

const ROLES = ["OPS", "PRODUCT", "ADMIN"] as const;

export type VehicleType = "SEDAN" | "SUV" | "VAN" | "MINIBUS" | "COACH";
export type LocationType = "AIRPORT" | "HOTEL" | "CITY" | "ZONE" | "LANDMARK" | "PORT";

export type TransferRouteRow = {
  id: string;
  country_id: string;
  from_location_id: string;
  to_location_id: string;
  supplier_id: string | null;
  estimated_duration_min: number | null;
  is_active: boolean;
  from_name: string;
  from_type: string;
  to_name: string;
  to_type: string;
  country_name: string | null;
  supplier_name: string | null;
  rate_count: number;
};

// ─── DROPDOWN DATA ───────────────────────────

export async function getCountriesForTransfers() {
  await requireRole([...ROLES]);
  return db
    .select({ id: countries.id, code: countries.code, name: countries.name })
    .from(countries)
    .where(eq(countries.isActive, true))
    .orderBy(countries.name);
}

export async function getSuppliersForTransfers() {
  await requireRole([...ROLES]);
  return db
    .select({ id: suppliers.id, name: suppliers.name })
    .from(suppliers)
    .where(eq(suppliers.isActive, true))
    .orderBy(suppliers.name);
}

// ─── LOCATIONS ───────────────────────────────

export async function getTransferLocations() {
  await requireRole([...ROLES]);
  return db
    .select({
      id: transferLocations.id,
      name: transferLocations.name,
      type: transferLocations.type,
      cityName: transferLocations.cityName,
      code: transferLocations.code,
      isActive: transferLocations.isActive,
      countryId: transferLocations.countryId,
      countryName: countries.name,
    })
    .from(transferLocations)
    .leftJoin(countries, eq(transferLocations.countryId, countries.id))
    .orderBy(asc(transferLocations.name));
}

export async function createLocation(input: {
  name: string;
  type: LocationType;
  countryId: string;
  cityName?: string | null;
  code?: string | null;
}) {
  await requireRole([...ROLES]);
  try {
    if (!input.name.trim()) return { success: false, error: "Name is required" };
    const [row] = await db
      .insert(transferLocations)
      .values({
        name: input.name.trim(),
        type: input.type,
        countryId: input.countryId,
        cityName: input.cityName?.trim() || null,
        code: input.code?.trim()?.toUpperCase() || null,
      })
      .returning({ id: transferLocations.id });
    revalidatePath("/admin/transfers");
    revalidatePath("/admin/transfers/locations");
    return { success: true, id: row.id };
  } catch (e) {
    console.error("createLocation error:", e);
    return { success: false, error: "Failed to create location" };
  }
}

export async function updateLocation(
  id: string,
  input: {
    name: string;
    type: LocationType;
    countryId: string;
    cityName?: string | null;
    code?: string | null;
    isActive: boolean;
  }
) {
  await requireRole([...ROLES]);
  try {
    await db
      .update(transferLocations)
      .set({
        name: input.name.trim(),
        type: input.type,
        countryId: input.countryId,
        cityName: input.cityName?.trim() || null,
        code: input.code?.trim()?.toUpperCase() || null,
        isActive: input.isActive,
      })
      .where(eq(transferLocations.id, id));
    revalidatePath("/admin/transfers");
    revalidatePath("/admin/transfers/locations");
    return { success: true };
  } catch (e) {
    console.error("updateLocation error:", e);
    return { success: false, error: "Failed to update location" };
  }
}

export async function deleteLocation(id: string) {
  await requireRole([...ROLES]);
  try {
    await db.delete(transferLocations).where(eq(transferLocations.id, id));
    revalidatePath("/admin/transfers");
    revalidatePath("/admin/transfers/locations");
    return { success: true };
  } catch {
    return { success: false, error: "Cannot delete — location may be used by a route" };
  }
}

// ─── ROUTES ──────────────────────────────────

export async function getTransferRoutes() {
  await requireRole([...ROLES]);
  const rows = await db.execute(sql`
    SELECT r.id, r.country_id, r.from_location_id, r.to_location_id,
           r.supplier_id, r.estimated_duration_min, r.is_active,
           fl.name AS from_name, fl.type AS from_type,
           tl.name AS to_name, tl.type AS to_type,
           c.name AS country_name,
           s.name AS supplier_name,
           (SELECT COUNT(*)::int FROM transfer_rates tr WHERE tr.route_id = r.id AND tr.is_active = true) AS rate_count
    FROM transfer_routes r
    LEFT JOIN transfer_locations fl ON fl.id = r.from_location_id
    LEFT JOIN transfer_locations tl ON tl.id = r.to_location_id
    LEFT JOIN countries c ON c.id = r.country_id
    LEFT JOIN suppliers s ON s.id = r.supplier_id
    ORDER BY c.name, fl.name
  `);
  return rows as unknown as TransferRouteRow[];
}

export async function getRouteById(id: string) {
  await requireRole([...ROLES]);
  const routes = await getTransferRoutes();
  return routes.find((r) => r.id === id) ?? null;
}

export async function createRoute(input: {
  countryId: string;
  fromLocationId: string;
  toLocationId: string;
  supplierId?: string | null;
  estimatedDurationMin?: number | null;
}) {
  await requireRole([...ROLES]);
  try {
    if (input.fromLocationId === input.toLocationId) {
      return { success: false, error: "From and To must be different locations" };
    }
    const [row] = await db
      .insert(transferRoutes)
      .values({
        countryId: input.countryId,
        fromLocationId: input.fromLocationId,
        toLocationId: input.toLocationId,
        supplierId: input.supplierId || null,
        estimatedDurationMin: input.estimatedDurationMin ?? null,
      })
      .returning({ id: transferRoutes.id });
    revalidatePath("/admin/transfers");
    return { success: true, id: row.id };
  } catch (e) {
    console.error("createRoute error:", e);
    return { success: false, error: "Failed to create route" };
  }
}

export async function updateRoute(
  id: string,
  input: { supplierId?: string | null; estimatedDurationMin?: number | null; isActive: boolean }
) {
  await requireRole([...ROLES]);
  try {
    await db
      .update(transferRoutes)
      .set({
        supplierId: input.supplierId || null,
        estimatedDurationMin: input.estimatedDurationMin ?? null,
        isActive: input.isActive,
        updatedAt: new Date(),
      })
      .where(eq(transferRoutes.id, id));
    revalidatePath("/admin/transfers");
    revalidatePath(`/admin/transfers/${id}/rates`);
    return { success: true };
  } catch (e) {
    console.error("updateRoute error:", e);
    return { success: false, error: "Failed to update route" };
  }
}

export async function deleteRoute(id: string) {
  await requireRole([...ROLES]);
  try {
    await db.delete(transferRoutes).where(eq(transferRoutes.id, id));
    revalidatePath("/admin/transfers");
    return { success: true };
  } catch {
    return { success: false, error: "Cannot delete — route may have bookings" };
  }
}

// ─── RATES (per-vehicle rate card) ───────────

export async function getRouteRates(routeId: string) {
  await requireRole([...ROLES]);
  return db
    .select()
    .from(transferRates)
    .where(eq(transferRates.routeId, routeId))
    .orderBy(asc(transferRates.sellPrice));
}

export async function createRate(input: {
  routeId: string;
  vehicleType: VehicleType;
  maxPax: number;
  maxLuggage?: number | null;
  netPrice: number;
  markupPct: number;
  sellPrice: number;
}) {
  await requireRole([...ROLES]);
  try {
    await db.insert(transferRates).values({
      routeId: input.routeId,
      vehicleType: input.vehicleType,
      maxPax: input.maxPax,
      maxLuggage: input.maxLuggage ?? null,
      netPrice: input.netPrice.toString(),
      markupPct: input.markupPct.toString(),
      sellPrice: input.sellPrice.toString(),
    });
    revalidatePath("/admin/transfers");
    revalidatePath(`/admin/transfers/${input.routeId}/rates`);
    return { success: true };
  } catch (e) {
    console.error("createRate error:", e);
    return { success: false, error: "Failed to add rate" };
  }
}

export async function updateRate(
  id: string,
  input: {
    routeId: string;
    vehicleType: VehicleType;
    maxPax: number;
    maxLuggage?: number | null;
    netPrice: number;
    markupPct: number;
    sellPrice: number;
    isActive: boolean;
  }
) {
  await requireRole([...ROLES]);
  try {
    await db
      .update(transferRates)
      .set({
        vehicleType: input.vehicleType,
        maxPax: input.maxPax,
        maxLuggage: input.maxLuggage ?? null,
        netPrice: input.netPrice.toString(),
        markupPct: input.markupPct.toString(),
        sellPrice: input.sellPrice.toString(),
        isActive: input.isActive,
        updatedAt: new Date(),
      })
      .where(eq(transferRates.id, id));
    revalidatePath("/admin/transfers");
    revalidatePath(`/admin/transfers/${input.routeId}/rates`);
    return { success: true };
  } catch (e) {
    console.error("updateRate error:", e);
    return { success: false, error: "Failed to update rate" };
  }
}

export async function deleteRate(id: string, routeId: string) {
  await requireRole([...ROLES]);
  try {
    await db.delete(transferRates).where(eq(transferRates.id, id));
    revalidatePath("/admin/transfers");
    revalidatePath(`/admin/transfers/${routeId}/rates`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete rate" };
  }
}
