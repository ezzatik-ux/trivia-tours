/**
 * Trivia Tours — Database Schema (Drizzle ORM + PostgreSQL)
 * All monetary values in USD. Markup per rate. One-shot customer data.
 */

import {
    pgTable,
    pgEnum,
    uuid,
    text,
    varchar,
    integer,
    numeric,
    boolean,
    timestamp,
    date,
    jsonb,
    primaryKey,
    index,
  } from "drizzle-orm/pg-core";
  import { relations } from "drizzle-orm";
  
  /* ============================================================
     ENUMS
  ============================================================ */
  export const productTypeEnum = pgEnum("product_type", [
    "TOUR",
    "EXCURSION",
    "ACTIVITY",
    "TRANSFER",
  ]);
  
  export const productStatusEnum = pgEnum("product_status", [
    "DRAFT",
    "ACTIVE",
    "INACTIVE",
  ]);
  
  export const userRoleEnum = pgEnum("user_role", [
    "SALES",
    "OPS",
    "PRODUCT",
    "ADMIN",
  ]);
  
  export const quoteStatusEnum = pgEnum("quote_status", [
    "DRAFT",
    "SENT",
    "CONVERTED",
    "EXPIRED",
  ]);
  
  export const bookingStatusEnum = pgEnum("booking_status", [
    "NEW",
    "ACK",
    "SUPPLIER_CONTACTED",
    "CONFIRMED",
    "VOUCHER_ISSUED",
    "OPERATED",
    "CLOSED",
    "CANCELLED",
  ]);
  
  export const paymentStatusEnum = pgEnum("payment_status", [
    "PENDING",
    "PARTIAL",
    "PAID",
    "REFUNDED",
  ]);
  
  export const vehicleTypeEnum = pgEnum("vehicle_type", [
    "SEDAN",
    "SUV",
    "VAN",
    "MINIBUS",
    "COACH",
  ]);
  
  export const transferDirectionEnum = pgEnum("transfer_direction", [
    "ONE_WAY",
    "RETURN",
  ]);
  
  /* ============================================================
     USERS & AUTH
  ============================================================ */
  export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    imageUrl: text("image_url"),
    googleId: varchar("google_id", { length: 255 }).unique(),
    role: userRoleEnum("role").notNull().default("SALES"),
    countryScope: jsonb("country_scope").$type<string[]>().default([]),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  });
  
  /* ============================================================
     GEOGRAPHY
  ============================================================ */
  export const countries = pgTable("countries", {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 3 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    flagEmoji: varchar("flag_emoji", { length: 10 }),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  });
  
  export const cities = pgTable(
    "cities",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      countryId: uuid("country_id")
        .notNull()
        .references(() => countries.id, { onDelete: "cascade" }),
      name: varchar("name", { length: 100 }).notNull(),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
      countryIdx: index("cities_country_idx").on(t.countryId),
    })
  );
  
  /* ============================================================
     SUPPLIERS
  ============================================================ */
  export const suppliers = pgTable("suppliers", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
    countryId: uuid("country_id").references(() => countries.id),
    contactName: varchar("contact_name", { length: 150 }),
    contactEmail: varchar("contact_email", { length: 255 }),
    contactPhone: varchar("contact_phone", { length: 50 }),
    paymentTerms: text("payment_terms"),
    notes: text("notes"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  });
  
  /* ============================================================
     PRODUCT CATEGORIES
  ============================================================ */
  export const productCategories = pgTable("product_categories", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    icon: varchar("icon", { length: 50 }),
  });
  
  /* ============================================================
     PRODUCTS (Unified: Tour, Excursion, Activity, Transfer)
  ============================================================ */
  export const products = pgTable(
    "products",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      type: productTypeEnum("type").notNull(),
      countryId: uuid("country_id")
        .notNull()
        .references(() => countries.id),
      cityId: uuid("city_id").references(() => cities.id),
      name: varchar("name", { length: 255 }).notNull(),
      slug: varchar("slug", { length: 255 }).notNull().unique(),
      shortDesc: text("short_desc"),
      longDesc: text("long_desc"),
      durationHours: numeric("duration_hours", { precision: 5, scale: 2 }),
      language: varchar("language", { length: 100 }),
      meetingPoint: text("meeting_point"),
      inclusions: jsonb("inclusions").$type<string[]>().default([]),
      exclusions: jsonb("exclusions").$type<string[]>().default([]),
      cancellationPolicy: text("cancellation_policy"),
      importantInfo: text("important_info"),
      status: productStatusEnum("status").notNull().default("DRAFT"),
      createdBy: uuid("created_by").references(() => users.id),
      updatedBy: uuid("updated_by").references(() => users.id),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
      countryIdx: index("products_country_idx").on(t.countryId),
      typeIdx: index("products_type_idx").on(t.type),
      statusIdx: index("products_status_idx").on(t.status),
      searchIdx: index("products_search_idx").on(t.name),
    })
  );
  
  export const productImages = pgTable("product_images", {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    altText: varchar("alt_text", { length: 255 }),
    isCover: boolean("is_cover").notNull().default(false),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  });
  
  export const productCategoryMap = pgTable(
    "product_category_map",
    {
      productId: uuid("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
      categoryId: uuid("category_id")
        .notNull()
        .references(() => productCategories.id, { onDelete: "cascade" }),
    },
    (t) => ({
      pk: primaryKey({ columns: [t.productId, t.categoryId] }),
    })
  );
  
  /* ============================================================
     TRANSFER EXTENSION
  ============================================================ */
  export const transfers = pgTable("transfers", {
    productId: uuid("product_id")
      .primaryKey()
      .references(() => products.id, { onDelete: "cascade" }),
    fromLocation: varchar("from_location", { length: 255 }).notNull(),
    toLocation: varchar("to_location", { length: 255 }).notNull(),
    vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
    maxPax: integer("max_pax").notNull(),
    luggageCapacity: integer("luggage_capacity"),
    direction: transferDirectionEnum("direction").notNull().default("ONE_WAY"),
  });
  
  /* ============================================================
     RATES (USD only, markup per rate set by PT)
  ============================================================ */
  export const rateSeasons = pgTable("rate_seasons", {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 50 }).notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  });
  
  export const rates = pgTable(
    "rates",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      productId: uuid("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
      seasonId: uuid("season_id").references(() => rateSeasons.id, {
        onDelete: "set null",
      }),
      supplierId: uuid("supplier_id").references(() => suppliers.id),
      netAdult: numeric("net_adult", { precision: 10, scale: 2 }).notNull().default("0"),
      netChild: numeric("net_child", { precision: 10, scale: 2 }).notNull().default("0"),
      netInfant: numeric("net_infant", { precision: 10, scale: 2 }).notNull().default("0"),
      markupPct: numeric("markup_pct", { precision: 5, scale: 2 }).notNull().default("0"),
      sellAdult: numeric("sell_adult", { precision: 10, scale: 2 }).notNull().default("0"),
      sellChild: numeric("sell_child", { precision: 10, scale: 2 }).notNull().default("0"),
      sellInfant: numeric("sell_infant", { precision: 10, scale: 2 }).notNull().default("0"),
      minPax: integer("min_pax").default(1),
      maxPax: integer("max_pax"),
      childAgeMin: integer("child_age_min").default(2),
      childAgeMax: integer("child_age_max").default(11),
      validFrom: date("valid_from").notNull(),
      validTo: date("valid_to").notNull(),
      isActive: boolean("is_active").notNull().default(true),
      createdBy: uuid("created_by").references(() => users.id),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
      productIdx: index("rates_product_idx").on(t.productId),
      validityIdx: index("rates_validity_idx").on(t.validFrom, t.validTo),
    })
  );
  
  /* ============================================================
     QUOTES
  ============================================================ */
  export const quotes = pgTable(
    "quotes",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      quoteNo: varchar("quote_no", { length: 30 }).notNull().unique(),
      salesAgentId: uuid("sales_agent_id")
        .notNull()
        .references(() => users.id),
      productId: uuid("product_id")
        .notNull()
        .references(() => products.id),
      rateId: uuid("rate_id")
        .notNull()
        .references(() => rates.id),
      travelDate: date("travel_date").notNull(),
      adults: integer("adults").notNull().default(0),
      children: integer("children").notNull().default(0),
      infants: integer("infants").notNull().default(0),
      unitAdult: numeric("unit_adult", { precision: 10, scale: 2 }).notNull(),
      unitChild: numeric("unit_child", { precision: 10, scale: 2 }).notNull(),
      unitInfant: numeric("unit_infant", { precision: 10, scale: 2 }).notNull(),
      totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
      status: quoteStatusEnum("status").notNull().default("DRAFT"),
      notes: text("notes"),
      expiresAt: timestamp("expires_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
      agentIdx: index("quotes_agent_idx").on(t.salesAgentId),
      statusIdx: index("quotes_status_idx").on(t.status),
    })
  );
  
  /* ============================================================
     BOOKINGS
  ============================================================ */
  export const bookings = pgTable(
    "bookings",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      bookingNo: varchar("booking_no", { length: 30 }).notNull().unique(),
      salesOrderNo: varchar("sales_order_no", { length: 50 }).notNull(),
      quoteId: uuid("quote_id").references(() => quotes.id),
      salesAgentId: uuid("sales_agent_id")
        .notNull()
        .references(() => users.id),
      assignedOpsId: uuid("assigned_ops_id").references(() => users.id),
      productId: uuid("product_id")
        .notNull()
        .references(() => products.id),
      rateId: uuid("rate_id")
        .notNull()
        .references(() => rates.id),
      supplierId: uuid("supplier_id").references(() => suppliers.id),
      customerName: varchar("customer_name", { length: 255 }).notNull(),
      customerEmail: varchar("customer_email", { length: 255 }),
      customerPhone: varchar("customer_phone", { length: 50 }),
      customerCountry: varchar("customer_country", { length: 100 }),
      customerNationality: varchar("customer_nationality", { length: 100 }),
      travelDate: date("travel_date").notNull(),
      pickupTime: varchar("pickup_time", { length: 10 }),
      pickupLocation: text("pickup_location"),
      dropoffLocation: text("dropoff_location"),
      adults: integer("adults").notNull().default(0),
      children: integer("children").notNull().default(0),
      infants: integer("infants").notNull().default(0),
      totalPax: integer("total_pax").notNull(),
      unitAdult: numeric("unit_adult", { precision: 10, scale: 2 }).notNull(),
      unitChild: numeric("unit_child", { precision: 10, scale: 2 }).notNull(),
      unitInfant: numeric("unit_infant", { precision: 10, scale: 2 }).notNull(),
      netCost: numeric("net_cost", { precision: 12, scale: 2 }).notNull().default("0"),
      totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
      status: bookingStatusEnum("status").notNull().default("NEW"),
      paymentStatus: paymentStatusEnum("payment_status").notNull().default("PENDING"),
      specialRequests: text("special_requests"),
      internalNotes: text("internal_notes"),
      supplierRef: varchar("supplier_ref", { length: 100 }),
      voucherUrl: text("voucher_url"),
      confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
      cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
      cancellationReason: text("cancellation_reason"),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
      statusIdx: index("bookings_status_idx").on(t.status),
      agentIdx: index("bookings_agent_idx").on(t.salesAgentId),
      opsIdx: index("bookings_ops_idx").on(t.assignedOpsId),
      travelDateIdx: index("bookings_travel_date_idx").on(t.travelDate),
      salesOrderIdx: index("bookings_sales_order_idx").on(t.salesOrderNo),
    })
  );
  
  /* ============================================================
     BOOKING WORKFLOW
  ============================================================ */
  export const bookingStatusHistory = pgTable("booking_status_history", {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    fromStatus: bookingStatusEnum("from_status"),
    toStatus: bookingStatusEnum("to_status").notNull(),
    changedBy: uuid("changed_by")
      .notNull()
      .references(() => users.id),
    note: text("note"),
    changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
  });
  
  export const opsActions = pgTable("ops_actions", {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    actionType: varchar("action_type", { length: 100 }).notNull(),
    performedBy: uuid("performed_by")
      .notNull()
      .references(() => users.id),
    notes: text("notes"),
    attachments: jsonb("attachments").$type<string[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  });
  
  /* ============================================================
     NOTIFICATIONS
  ============================================================ */
  export const notifications = pgTable(
    "notifications",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
      type: varchar("type", { length: 50 }).notNull(),
      title: varchar("title", { length: 255 }).notNull(),
      message: text("message"),
      relatedBookingId: uuid("related_booking_id").references(() => bookings.id, {
        onDelete: "cascade",
      }),
      isRead: boolean("is_read").notNull().default(false),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
      userUnreadIdx: index("notifications_user_unread_idx").on(t.userId, t.isRead),
    })
  );
  
  /* ============================================================
     AUDIT LOG
  ============================================================ */
  export const auditLog = pgTable(
    "audit_log",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      userId: uuid("user_id").references(() => users.id),
      action: varchar("action", { length: 100 }).notNull(),
      entityType: varchar("entity_type", { length: 50 }).notNull(),
      entityId: uuid("entity_id"),
      changes: jsonb("changes"),
      ipAddress: varchar("ip_address", { length: 45 }),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
      entityIdx: index("audit_entity_idx").on(t.entityType, t.entityId),
      userIdx: index("audit_user_idx").on(t.userId),
    })
  );
  
  /* ============================================================
     RELATIONS
  ============================================================ */
  export const countriesRelations = relations(countries, ({ many }) => ({
    cities: many(cities),
    products: many(products),
    suppliers: many(suppliers),
  }));
  
  export const citiesRelations = relations(cities, ({ one, many }) => ({
    country: one(countries, { fields: [cities.countryId], references: [countries.id] }),
    products: many(products),
  }));
  
  export const productsRelations = relations(products, ({ one, many }) => ({
    country: one(countries, { fields: [products.countryId], references: [countries.id] }),
    city: one(cities, { fields: [products.cityId], references: [cities.id] }),
    images: many(productImages),
    categories: many(productCategoryMap),
    rates: many(rates),
    seasons: many(rateSeasons),
    transfer: one(transfers, { fields: [products.id], references: [transfers.productId] }),
  }));
  
  export const ratesRelations = relations(rates, ({ one }) => ({
    product: one(products, { fields: [rates.productId], references: [products.id] }),
    season: one(rateSeasons, { fields: [rates.seasonId], references: [rateSeasons.id] }),
    supplier: one(suppliers, { fields: [rates.supplierId], references: [suppliers.id] }),
  }));
  
  export const bookingsRelations = relations(bookings, ({ one, many }) => ({
    product: one(products, { fields: [bookings.productId], references: [products.id] }),
    rate: one(rates, { fields: [bookings.rateId], references: [rates.id] }),
    supplier: one(suppliers, { fields: [bookings.supplierId], references: [suppliers.id] }),
    salesAgent: one(users, { fields: [bookings.salesAgentId], references: [users.id] }),
    assignedOps: one(users, { fields: [bookings.assignedOpsId], references: [users.id] }),
    quote: one(quotes, { fields: [bookings.quoteId], references: [quotes.id] }),
    statusHistory: many(bookingStatusHistory),
    opsActions: many(opsActions),
  }));