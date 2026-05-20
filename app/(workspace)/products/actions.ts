"use server";

import { db } from "@/lib/db";
import { products, countries, productImages } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";

/**
 * Fetch all products with their country + cover image
 */
export async function getProducts() {
  await requireRole(["PRODUCT", "ADMIN"]);

  const result = await db
    .select({
      id: products.id,
      type: products.type,
      name: products.name,
      slug: products.slug,
      shortDesc: products.shortDesc,
      durationHours: products.durationHours,
      status: products.status,
      countryId: products.countryId,
      countryName: countries.name,
      countryCode: countries.code,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      coverImage: sql<string | null>`(
        SELECT url FROM ${productImages}
        WHERE ${productImages.productId} = ${products.id}
        AND ${productImages.isCover} = true
        LIMIT 1
      )`.as("cover_image"),
    })
    .from(products)
    .leftJoin(countries, eq(products.countryId, countries.id))
    .orderBy(desc(products.createdAt));

  return result;
}

/**
 * Fetch active countries for filter dropdown
 */
export async function getCountriesForFilter() {
  return db
    .select({
      id: countries.id,
      code: countries.code,
      name: countries.name,
    })
    .from(countries)
    .where(eq(countries.isActive, true))
    .orderBy(countries.sortOrder);
}

/**
 * Cycle through product status: DRAFT → ACTIVE → INACTIVE → DRAFT
 */
export async function cycleProductStatus(
  id: string,
  currentStatus: "DRAFT" | "ACTIVE" | "INACTIVE"
) {
  await requireRole(["PRODUCT", "ADMIN"]);

  const nextStatus: "DRAFT" | "ACTIVE" | "INACTIVE" =
    currentStatus === "DRAFT" ? "ACTIVE"
    : currentStatus === "ACTIVE" ? "INACTIVE"
    : "DRAFT";

  try {
    await db
      .update(products)
      .set({ status: nextStatus })
      .where(eq(products.id, id));

    revalidatePath("/products");
    return { success: true, status: nextStatus };
  } catch (error) {
    console.error("cycleProductStatus error:", error);
    return { success: false, error: "Failed to update product status" };
  }
}

/**
 * Delete a product (hard delete — use sparingly)
 */
export async function deleteProduct(id: string) {
  await requireRole(["PRODUCT", "ADMIN"]);

  try {
    await db.delete(products).where(eq(products.id, id));
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("deleteProduct error:", error);
    return { success: false, error: "Failed to delete product" };
  }
}

export type ProductInput = {
  type: "TOUR" | "EXCURSION" | "ACTIVITY" | "TRANSFER";
  countryId: string;
  name: string;
  slug: string;
  shortDesc?: string | null;
  longDesc?: string | null;
  durationHours?: number | null;
  language?: string | null;
  meetingPoint?: string | null;
  inclusions?: string[];
  exclusions?: string[];
  cancellationPolicy?: string | null;
  importantInfo?: string | null;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
};

export type ProductImageInput = {
  url: string;
  isCover: boolean;
  sortOrder: number;
};

/**
 * Get a single product with its images for edit form
 */
export async function getProductById(id: string) {
  await requireRole(["PRODUCT", "ADMIN"]);

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) return null;

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, id))
    .orderBy(productImages.sortOrder);

  return { ...product, images };
}

/**
 * Create new product with optional images
 */
export async function createProduct(
  input: ProductInput,
  images: ProductImageInput[]
) {
  await requireRole(["PRODUCT", "ADMIN"]);

  if (!input.name?.trim()) {
    return { success: false, error: "Product name is required" };
  }
  if (!input.countryId) {
    return { success: false, error: "Country is required" };
  }

  try {
    const [created] = await db
      .insert(products)
      .values({
        type: input.type,
        countryId: input.countryId,
        name: input.name.trim(),
        slug: input.slug.trim(),
        shortDesc: input.shortDesc?.trim() || null,
        longDesc: input.longDesc?.trim() || null,
        durationHours: input.durationHours?.toString() || null,
        language: input.language?.trim() || null,
        meetingPoint: input.meetingPoint?.trim() || null,
        inclusions: input.inclusions ?? [],
        exclusions: input.exclusions ?? [],
        cancellationPolicy: input.cancellationPolicy?.trim() || null,
        importantInfo: input.importantInfo?.trim() || null,
        status: input.status,
      })
      .returning();

    if (images.length > 0) {
      await db.insert(productImages).values(
        images.map((img, idx) => ({
          productId: created.id,
          url: img.url,
          isCover: img.isCover,
          sortOrder: idx,
        }))
      );
    }

    revalidatePath("/products");
    return { success: true, productId: created.id };
  } catch (error) {
    console.error("createProduct error:", error);
    return {
      success: false,
      error: "Failed to create product. Slug may already exist.",
    };
  }
}

/**
 * Update existing product (replaces images entirely)
 */
export async function updateProduct(
  id: string,
  input: ProductInput,
  images: ProductImageInput[]
) {
  await requireRole(["PRODUCT", "ADMIN"]);

  if (!input.name?.trim()) {
    return { success: false, error: "Product name is required" };
  }

  try {
    await db
      .update(products)
      .set({
        type: input.type,
        countryId: input.countryId,
        name: input.name.trim(),
        slug: input.slug.trim(),
        shortDesc: input.shortDesc?.trim() || null,
        longDesc: input.longDesc?.trim() || null,
        durationHours: input.durationHours?.toString() || null,
        language: input.language?.trim() || null,
        meetingPoint: input.meetingPoint?.trim() || null,
        inclusions: input.inclusions ?? [],
        exclusions: input.exclusions ?? [],
        cancellationPolicy: input.cancellationPolicy?.trim() || null,
        importantInfo: input.importantInfo?.trim() || null,
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    await db.delete(productImages).where(eq(productImages.productId, id));
    if (images.length > 0) {
      await db.insert(productImages).values(
        images.map((img, idx) => ({
          productId: id,
          url: img.url,
          isCover: img.isCover,
          sortOrder: idx,
        }))
      );
    }

    revalidatePath("/products");
    revalidatePath(`/products/${id}/edit`);
    return { success: true };
  } catch (error) {
    console.error("updateProduct error:", error);
    return { success: false, error: "Failed to update product" };
  }
}
