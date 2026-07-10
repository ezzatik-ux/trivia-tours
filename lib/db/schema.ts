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
    unique,
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
    emailVerified: timestamp("email_verified", {
      withTimezone: true,
      mode: "date",
    }),
    image: text("image_url"),
    googleId: varchar("google_id", { length: 255 }).unique(),
    role: userRoleEnum("role").notNull().default("SALES"),
    countryScope: jsonb("country_scope").$type<string[]>().default([]),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  });

  export const usersRelations = relations(users, () => ({}));

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
    // Deny-by-default for Supabase API roles (anon/authenticated). The app's
    // server-side connection uses the table-owner role, which bypasses RLS.
  ).enableRLS();
  
  /* ============================================================
     HOTELS MODULE
  ============================================================ */
  export const hotelStatusEnum = pgEnum("hotel_status", ["DRAFT", "ACTIVE", "INACTIVE"]);
  export const mealPlanEnum = pgEnum("meal_plan", ["RO", "BB", "HB", "FB", "AI"]);
  export const occupancyEnum = pgEnum("occupancy", ["SINGLE", "DOUBLE", "TRIPLE", "QUAD"]);
  export const hotelBookingStatusEnum = pgEnum("hotel_booking_status", [
    "NEW",
    "ACK",
    "HOTEL_CONTACTED",
    "AWAITING_INVOICE",
    "CONFIRMED",
    "VOUCHER_ISSUED",
    "CHECKED_IN",
    "CHECKED_OUT",
    "COMPLETED",
    "CANCELLED",
  ]);

  export const hotels = pgTable("hotels", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    brand: text("brand"),
    starRating: integer("star_rating"),
    countryId: uuid("country_id")
      .notNull()
      .references(() => countries.id),
    cityId: uuid("city_id").references(() => cities.id),
    address: text("address"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    shortDesc: text("short_desc"),
    longDesc: text("long_desc"),
    amenities: jsonb("amenities").$type<string[]>().default([]),
    policies: text("policies"),
    cancellationPolicy: text("cancellation_policy"),
    importantInfo: text("important_info"),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    reservationEmail: text("reservation_email"),
    status: hotelStatusEnum("status").default("DRAFT").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  });

  export const hotelImages = pgTable("hotel_images", {
    id: uuid("id").primaryKey().defaultRandom(),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    caption: text("caption"),
    isCover: boolean("is_cover").default(false).notNull(),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  });

  export const hotelRoomTypes = pgTable("hotel_room_types", {
    id: uuid("id").primaryKey().defaultRandom(),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    maxOccupancy: integer("max_occupancy").default(2).notNull(),
    bedConfig: text("bed_config"),
    sizeM2: numeric("size_m2", { precision: 6, scale: 2 }),
    view: text("view"),
    images: jsonb("images").$type<string[]>().default([]),
    amenities: jsonb("amenities").$type<string[]>().default([]),
    totalRooms: integer("total_rooms"),
    sortOrder: integer("sort_order").default(0),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  });

  export const hotelRateSeasons = pgTable("hotel_rate_seasons", {
    id: uuid("id").primaryKey().defaultRandom(),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    validFrom: date("valid_from").notNull(),
    validTo: date("valid_to").notNull(),
    surchargePerNight: numeric("surcharge_per_night", { precision: 10, scale: 2 }).default("0"),
    priority: integer("priority").default(0),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  });

  export const hotelRates = pgTable("hotel_rates", {
    id: uuid("id").primaryKey().defaultRandom(),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    roomTypeId: uuid("room_type_id")
      .notNull()
      .references(() => hotelRoomTypes.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id").references(() => hotelRateSeasons.id, { onDelete: "set null" }),
    validFrom: date("valid_from").notNull(),
    validTo: date("valid_to").notNull(),
    netSingle: numeric("net_single", { precision: 10, scale: 2 }).default("0"),
    netDouble: numeric("net_double", { precision: 10, scale: 2 }).notNull(),
    netTriple: numeric("net_triple", { precision: 10, scale: 2 }).default("0"),
    netQuad: numeric("net_quad", { precision: 10, scale: 2 }).default("0"),
    markupPct: numeric("markup_pct", { precision: 5, scale: 2 }).default("0"),
    commissionPct: numeric("commission_pct", { precision: 5, scale: 2 }).default("0"),
    sellSingle: numeric("sell_single", { precision: 10, scale: 2 }).default("0"),
    sellDouble: numeric("sell_double", { precision: 10, scale: 2 }).default("0"),
    sellTriple: numeric("sell_triple", { precision: 10, scale: 2 }).default("0"),
    sellQuad: numeric("sell_quad", { precision: 10, scale: 2 }).default("0"),
    mealPlan: mealPlanEnum("meal_plan").default("RO").notNull(),
    childAgeMin: integer("child_age_min").default(2),
    childAgeMax: integer("child_age_max").default(11),
    childRate: numeric("child_rate", { precision: 10, scale: 2 }).default("0"),
    childMealSupplement: numeric("child_meal_supplement", { precision: 10, scale: 2 }).default("0"),
    earlyBirdDays: integer("early_bird_days"),
    earlyBirdPct: numeric("early_bird_pct", { precision: 5, scale: 2 }),
    minNights: integer("min_nights").default(1),
    maxNights: integer("max_nights"),
    originalCurrency: text("original_currency").default("USD"),
    exchangeRateAtUpload: numeric("exchange_rate_at_upload", { precision: 12, scale: 6 }).default("1"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  });

  export const hotelBookings = pgTable("hotel_bookings", {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingNo: text("booking_no").notNull().unique(),
    salesOrderNo: text("sales_order_no").notNull(),
    invoiceNoOdoo: text("invoice_no_odoo"),
    salesAgentId: uuid("sales_agent_id")
      .notNull()
      .references(() => users.id),
    assignedOpsId: uuid("assigned_ops_id").references(() => users.id),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id),
    roomTypeId: uuid("room_type_id")
      .notNull()
      .references(() => hotelRoomTypes.id),
    rateId: uuid("rate_id")
      .notNull()
      .references(() => hotelRates.id),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email"),
    customerPhone: text("customer_phone"),
    customerCountry: text("customer_country"),
    customerNationality: text("customer_nationality"),
    checkIn: date("check_in").notNull(),
    checkOut: date("check_out").notNull(),
    nights: integer("nights").notNull(),
    numRooms: integer("num_rooms").default(1).notNull(),
    occupancy: occupancyEnum("occupancy").default("DOUBLE").notNull(),
    adults: integer("adults").default(2).notNull(),
    children: integer("children").default(0).notNull(),
    infants: integer("infants").default(0).notNull(),
    unitRate: numeric("unit_rate", { precision: 10, scale: 2 }).notNull(),
    childSupplements: numeric("child_supplements", { precision: 10, scale: 2 }).default("0"),
    seasonSurcharge: numeric("season_surcharge", { precision: 10, scale: 2 }).default("0"),
    earlyBirdDiscount: numeric("early_bird_discount", { precision: 10, scale: 2 }).default("0"),
    netCost: numeric("net_cost", { precision: 10, scale: 2 }).notNull(),
    totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
    hotelConfirmationRef: text("hotel_confirmation_ref"),
    emailSentToHotel: boolean("email_sent_to_hotel").default(false),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    status: hotelBookingStatusEnum("status").default("NEW").notNull(),
    paymentStatus: text("payment_status").default("PENDING"),
    specialRequests: text("special_requests"),
    internalNotes: text("internal_notes"),
    cancellationReason: text("cancellation_reason"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    voucherIssuedAt: timestamp("voucher_issued_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  });

  export const hotelBookingStatusHistory = pgTable("hotel_booking_status_history", {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => hotelBookings.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    changedBy: uuid("changed_by").references(() => users.id),
    note: text("note"),
    changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
  });

  /* ============================================================
     RELATIONS
  ============================================================ */
  export const countriesRelations = relations(countries, ({ many }) => ({
    cities: many(cities),
    products: many(products),
    suppliers: many(suppliers),
    hotels: many(hotels),
  }));
  
  export const citiesRelations = relations(cities, ({ one, many }) => ({
    country: one(countries, { fields: [cities.countryId], references: [countries.id] }),
    products: many(products),
    hotels: many(hotels),
  }));

  export const hotelsRelations = relations(hotels, ({ one, many }) => ({
    country: one(countries, { fields: [hotels.countryId], references: [countries.id] }),
    city: one(cities, { fields: [hotels.cityId], references: [cities.id] }),
    images: many(hotelImages),
    roomTypes: many(hotelRoomTypes),
    rateSeasons: many(hotelRateSeasons),
    rates: many(hotelRates),
    bookings: many(hotelBookings),
  }));

  export const hotelRoomTypesRelations = relations(hotelRoomTypes, ({ one, many }) => ({
    hotel: one(hotels, { fields: [hotelRoomTypes.hotelId], references: [hotels.id] }),
    rates: many(hotelRates),
    bookings: many(hotelBookings),
  }));

  export const hotelRatesRelations = relations(hotelRates, ({ one }) => ({
    hotel: one(hotels, { fields: [hotelRates.hotelId], references: [hotels.id] }),
    roomType: one(hotelRoomTypes, { fields: [hotelRates.roomTypeId], references: [hotelRoomTypes.id] }),
    season: one(hotelRateSeasons, { fields: [hotelRates.seasonId], references: [hotelRateSeasons.id] }),
  }));

  export const hotelBookingsRelations = relations(hotelBookings, ({ one, many }) => ({
    hotel: one(hotels, { fields: [hotelBookings.hotelId], references: [hotels.id] }),
    roomType: one(hotelRoomTypes, { fields: [hotelBookings.roomTypeId], references: [hotelRoomTypes.id] }),
    rate: one(hotelRates, { fields: [hotelBookings.rateId], references: [hotelRates.id] }),
    salesAgent: one(users, { fields: [hotelBookings.salesAgentId], references: [users.id] }),
    assignedOps: one(users, { fields: [hotelBookings.assignedOpsId], references: [users.id] }),
    statusHistory: many(hotelBookingStatusHistory),
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

  /* ============================================================
     TRANSFERS MODULE (dedicated — per-vehicle, route-based)
     Separate from generic products/rates (which are per-person).
  ============================================================ */

  export const transferLocationTypeEnum = pgEnum("transfer_location_type", [
    "AIRPORT",
    "HOTEL",
    "CITY",
    "ZONE",
    "LANDMARK",
    "PORT",
  ]);

  export const transferBookingStatusEnum = pgEnum("transfer_booking_status", [
    "NEW",
    "ACK",
    "SUPPLIER_CONTACTED",
    "CONFIRMED",
    "VOUCHER_ISSUED",
    "COMPLETED",
    "CANCELLED",
  ]);

  export const transferTripTypeEnum = pgEnum("transfer_trip_type", ["ONE_WAY", "ROUND_TRIP"]);

  // Named places transfers run between (structured, not free text)
  export const transferLocations = pgTable(
    "transfer_locations",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      countryId: uuid("country_id")
        .notNull()
        .references(() => countries.id),
      name: text("name").notNull(),
      type: transferLocationTypeEnum("type").notNull(),
      cityName: text("city_name"), // freetext city/area label
      code: varchar("code", { length: 10 }), // e.g. airport IATA "HRG"
      isActive: boolean("is_active").default(true).notNull(),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
      countryIdx: index("transfer_locations_country_idx").on(t.countryId),
      typeIdx: index("transfer_locations_type_idx").on(t.type),
    })
  );

  // A directional route between two locations (A->B separate from B->A)
  export const transferRoutes = pgTable(
    "transfer_routes",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      countryId: uuid("country_id")
        .notNull()
        .references(() => countries.id),
      fromLocationId: uuid("from_location_id")
        .notNull()
        .references(() => transferLocations.id),
      toLocationId: uuid("to_location_id")
        .notNull()
        .references(() => transferLocations.id),
      supplierId: uuid("supplier_id").references(() => suppliers.id),
      estimatedDurationMin: integer("estimated_duration_min"),
      distanceKm: numeric("distance_km", { precision: 6, scale: 1 }),
      notes: text("notes"),
      isActive: boolean("is_active").default(true).notNull(),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
      fromIdx: index("transfer_routes_from_idx").on(t.fromLocationId),
      toIdx: index("transfer_routes_to_idx").on(t.toLocationId),
      countryIdx: index("transfer_routes_country_idx").on(t.countryId),
    })
  );

  /* ============================================================
     TRANSFER VEHICLE CLASSES (catalog — defined once, reused across routes)
  ============================================================ */

  export const transferVehicleClasses = pgTable(
    "transfer_vehicle_classes",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      name: text("name").notNull(), // "Standard", "Business", "Minivan VIP"
      tier: integer("tier").default(1).notNull(), // ordering: 1=Economy … higher=premium
      baseVehicleType: vehicleTypeEnum("base_vehicle_type"), // optional link to raw enum (SEDAN/VAN…)
      exampleModels: text("example_models"), // "Toyota Corolla and similar"
      description: text("description"),
      imageUrl: text("image_url"),
      maxPax: integer("max_pax").default(3).notNull(),
      maxLuggage: integer("max_luggage").default(3),
      amenities: jsonb("amenities").$type<string[]>().default([]),
      driverLanguages: jsonb("driver_languages").$type<string[]>().default([]),
      isActive: boolean("is_active").default(true).notNull(),
      sortOrder: integer("sort_order").default(0).notNull(),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
      activeIdx: index("transfer_vehicle_classes_active_idx").on(t.isActive),
      tierIdx: index("transfer_vehicle_classes_tier_idx").on(t.tier),
    })
  );

  // Per-vehicle rate card for a route. One row per vehicle type.
  export const transferRates = pgTable(
    "transfer_rates",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      routeId: uuid("route_id")
        .notNull()
        .references(() => transferRoutes.id, { onDelete: "cascade" }),
      vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
      vehicleClassId: uuid("vehicle_class_id").references(() => transferVehicleClasses.id),
      maxPax: integer("max_pax").notNull(),
      maxLuggage: integer("max_luggage"),
      netPrice: numeric("net_price", { precision: 10, scale: 2 }).notNull(),
      markupPct: numeric("markup_pct", { precision: 5, scale: 2 }).default("0"),
      sellPrice: numeric("sell_price", { precision: 10, scale: 2 }).notNull(),
      currency: text("currency").default("USD"),
      validFrom: date("valid_from"),
      validTo: date("valid_to"),
      isActive: boolean("is_active").default(true).notNull(),
      createdBy: uuid("created_by").references(() => users.id),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
      routeIdx: index("transfer_rates_route_idx").on(t.routeId),
      vehicleIdx: index("transfer_rates_vehicle_idx").on(t.vehicleType),
    })
  );

  // Transfer bookings (mirrors hotelBookings pattern)
  export const transferBookings = pgTable(
    "transfer_bookings",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      bookingNo: text("booking_no").notNull().unique(), // TR-YYMM-NNNNN
      salesOrderNo: text("sales_order_no").notNull(),
      invoiceNoOdoo: text("invoice_no_odoo"),
      salesAgentId: uuid("sales_agent_id")
        .notNull()
        .references(() => users.id),
      assignedOpsId: uuid("assigned_ops_id").references(() => users.id),
      routeId: uuid("route_id")
        .notNull()
        .references(() => transferRoutes.id),
      rateId: uuid("rate_id")
        .notNull()
        .references(() => transferRates.id),
      supplierId: uuid("supplier_id").references(() => suppliers.id),
      vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
      numVehicles: integer("num_vehicles").default(1).notNull(),
      tripType: transferTripTypeEnum("trip_type").default("ONE_WAY").notNull(),
      // Outbound airport details
      arrivalTerminal: varchar("arrival_terminal", { length: 20 }),
      greetingSign: text("greeting_sign"),
      // Return leg (round trip)
      returnDate: date("return_date"),
      returnPickupTime: varchar("return_pickup_time", { length: 10 }),
      returnFlightNumber: varchar("return_flight_number", { length: 20 }),
      returnTerminal: varchar("return_terminal", { length: 20 }),
      returnFlightDeparture: varchar("return_flight_departure", { length: 10 }),
      // Customer
      customerName: text("customer_name").notNull(),
      customerEmail: text("customer_email"),
      customerPhone: text("customer_phone"),
      customerNationality: text("customer_nationality"),
      // Trip
      transferDate: date("transfer_date").notNull(),
      pickupTime: varchar("pickup_time", { length: 10 }), // "14:30"
      flightNumber: varchar("flight_number", { length: 20 }),
      pax: integer("pax").default(1).notNull(),
      luggageCount: integer("luggage_count"),
      pickupAddress: text("pickup_address"),
      dropoffAddress: text("dropoff_address"),
      // Pricing (per-vehicle * numVehicles)
      unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
      netCost: numeric("net_cost", { precision: 10, scale: 2 }).notNull(),
      totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
      // Workflow
      supplierConfirmationRef: text("supplier_confirmation_ref"),
      emailSentToSupplier: boolean("email_sent_to_supplier").default(false),
      emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
      status: transferBookingStatusEnum("status").default("NEW").notNull(),
      paymentStatus: text("payment_status").default("PENDING"),
      specialRequests: text("special_requests"),
      internalNotes: text("internal_notes"),
      cancellationReason: text("cancellation_reason"),
      confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
      voucherIssuedAt: timestamp("voucher_issued_at", { withTimezone: true }),
      cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
      statusIdx: index("transfer_bookings_status_idx").on(t.status),
      agentIdx: index("transfer_bookings_agent_idx").on(t.salesAgentId),
      opsIdx: index("transfer_bookings_ops_idx").on(t.assignedOpsId),
      dateIdx: index("transfer_bookings_date_idx").on(t.transferDate),
    })
  );

  export const transferBookingStatusHistory = pgTable("transfer_booking_status_history", {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => transferBookings.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    changedBy: uuid("changed_by").references(() => users.id),
    note: text("note"),
    changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
  });

  /* ---- Transfer relations ---- */
  export const transferVehicleClassesRelations = relations(transferVehicleClasses, ({ many }) => ({
    rates: many(transferRates),
  }));

  export const transferLocationsRelations = relations(transferLocations, ({ one }) => ({
    country: one(countries, { fields: [transferLocations.countryId], references: [countries.id] }),
  }));

  export const transferRoutesRelations = relations(transferRoutes, ({ one, many }) => ({
    country: one(countries, { fields: [transferRoutes.countryId], references: [countries.id] }),
    fromLocation: one(transferLocations, { fields: [transferRoutes.fromLocationId], references: [transferLocations.id], relationName: "fromLocation" }),
    toLocation: one(transferLocations, { fields: [transferRoutes.toLocationId], references: [transferLocations.id], relationName: "toLocation" }),
    supplier: one(suppliers, { fields: [transferRoutes.supplierId], references: [suppliers.id] }),
    rates: many(transferRates),
    bookings: many(transferBookings),
  }));

  export const transferRatesRelations = relations(transferRates, ({ one }) => ({
    route: one(transferRoutes, { fields: [transferRates.routeId], references: [transferRoutes.id] }),
    vehicleClass: one(transferVehicleClasses, { fields: [transferRates.vehicleClassId], references: [transferVehicleClasses.id] }),
  }));

  export const transferBookingsRelations = relations(transferBookings, ({ one, many }) => ({
    route: one(transferRoutes, { fields: [transferBookings.routeId], references: [transferRoutes.id] }),
    rate: one(transferRates, { fields: [transferBookings.rateId], references: [transferRates.id] }),
    supplier: one(suppliers, { fields: [transferBookings.supplierId], references: [suppliers.id] }),
    salesAgent: one(users, { fields: [transferBookings.salesAgentId], references: [users.id] }),
    assignedOps: one(users, { fields: [transferBookings.assignedOpsId], references: [users.id] }),
    statusHistory: many(transferBookingStatusHistory),
  }));

  /* ============================================================
     PACKAGES MODULE (dedicated — multi-day itineraries)
  ============================================================ */
  export const packages = pgTable(
    "packages",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      slug: varchar("slug", { length: 255 }).notNull().unique(),
      name: varchar("name", { length: 255 }).notNull(),
      countryId: uuid("country_id")
        .notNull()
        .references(() => countries.id),
      cityId: uuid("city_id").references(() => cities.id),
      shortDesc: text("short_desc"),
      overview: text("overview"),
      durationDays: integer("duration_days").notNull(),
      durationNights: integer("duration_nights"),
      inclusions: jsonb("inclusions").$type<string[]>().default([]),
      exclusions: jsonb("exclusions").$type<string[]>().default([]),
      highlights: jsonb("highlights").$type<string[]>().default([]),
      cancellationPolicy: text("cancellation_policy"),
      importantInfo: text("important_info"),
      status: productStatusEnum("status").notNull().default("DRAFT"),
      createdBy: uuid("created_by").references(() => users.id),
      updatedBy: uuid("updated_by").references(() => users.id),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
      countryIdx: index("packages_country_idx").on(t.countryId),
      statusIdx: index("packages_status_idx").on(t.status),
      slugIdx: index("packages_slug_idx").on(t.slug),
    })
  );

  export const packageDays = pgTable(
    "package_days",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      packageId: uuid("package_id")
        .notNull()
        .references(() => packages.id, { onDelete: "cascade" }),
      dayNumber: integer("day_number").notNull(),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      locationName: varchar("location_name", { length: 255 }),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
      packageDayUnique: unique().on(t.packageId, t.dayNumber),
    })
  );

  export const packageImages = pgTable("package_images", {
    id: uuid("id").primaryKey().defaultRandom(),
    packageId: uuid("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    altText: varchar("alt_text", { length: 255 }),
    isCover: boolean("is_cover").notNull().default(false),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  });

  export const packageDayImages = pgTable(
    "package_day_images",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      dayId: uuid("day_id")
        .notNull()
        .references(() => packageDays.id, { onDelete: "cascade" }),
      url: text("url").notNull(),
      altText: varchar("alt_text", { length: 255 }),
      isCover: boolean("is_cover").notNull().default(false),
      sortOrder: integer("sort_order").default(0),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
      dayIdx: index("package_day_images_day_idx").on(t.dayId),
    })
  );

  export const packageRates = pgTable(
    "package_rates",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      packageId: uuid("package_id")
        .notNull()
        .references(() => packages.id, { onDelete: "cascade" }),
      label: varchar("label", { length: 100 }),
      netAdult: numeric("net_adult", { precision: 10, scale: 2 }).notNull().default("0"),
      netChild: numeric("net_child", { precision: 10, scale: 2 }).notNull().default("0"),
      markupPct: numeric("markup_pct", { precision: 5, scale: 2 }).notNull().default("0"),
      sellAdult: numeric("sell_adult", { precision: 10, scale: 2 }).notNull().default("0"),
      sellChild: numeric("sell_child", { precision: 10, scale: 2 }).notNull().default("0"),
      validFrom: date("valid_from").notNull(),
      validTo: date("valid_to").notNull(),
      minPax: integer("min_pax").default(1),
      maxPax: integer("max_pax"),
      childAgeMin: integer("child_age_min").default(2),
      childAgeMax: integer("child_age_max").default(11),
      isActive: boolean("is_active").notNull().default(true),
      createdBy: uuid("created_by").references(() => users.id),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
      packageIdx: index("package_rates_package_idx").on(t.packageId),
      validityIdx: index("package_rates_validity_idx").on(t.validFrom, t.validTo),
    })
  );

  /* ---- Package relations ---- */
  export const packagesRelations = relations(packages, ({ one, many }) => ({
    country: one(countries, { fields: [packages.countryId], references: [countries.id] }),
    city: one(cities, { fields: [packages.cityId], references: [cities.id] }),
    days: many(packageDays),
    images: many(packageImages),
    rates: many(packageRates),
  }));

  export const packageDaysRelations = relations(packageDays, ({ one, many }) => ({
    package: one(packages, { fields: [packageDays.packageId], references: [packages.id] }),
    images: many(packageDayImages),
  }));

  export const packageDayImagesRelations = relations(packageDayImages, ({ one }) => ({
    day: one(packageDays, { fields: [packageDayImages.dayId], references: [packageDays.id] }),
  }));

  export const packageImagesRelations = relations(packageImages, ({ one }) => ({
    package: one(packages, { fields: [packageImages.packageId], references: [packages.id] }),
  }));

  export const packageRatesRelations = relations(packageRates, ({ one }) => ({
    package: one(packages, { fields: [packageRates.packageId], references: [packages.id] }),
  }));

export * from "./auth-schema";