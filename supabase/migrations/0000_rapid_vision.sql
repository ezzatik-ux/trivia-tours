CREATE TYPE "public"."booking_status" AS ENUM('NEW', 'ACK', 'SUPPLIER_CONTACTED', 'CONFIRMED', 'VOUCHER_ISSUED', 'OPERATED', 'CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."hotel_booking_status" AS ENUM('NEW', 'ACK', 'HOTEL_CONTACTED', 'AWAITING_INVOICE', 'CONFIRMED', 'VOUCHER_ISSUED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."hotel_status" AS ENUM('DRAFT', 'ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."meal_plan" AS ENUM('RO', 'BB', 'HB', 'FB', 'AI');--> statement-breakpoint
CREATE TYPE "public"."occupancy" AS ENUM('SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'PARTIAL', 'PAID', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('DRAFT', 'ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('TOUR', 'EXCURSION', 'ACTIVITY', 'TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('DRAFT', 'SENT', 'CONVERTED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."transfer_direction" AS ENUM('ONE_WAY', 'RETURN');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('SALES', 'OPS', 'PRODUCT', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('SEDAN', 'SUV', 'VAN', 'MINIBUS', 'COACH');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid,
	"changes" jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"from_status" "booking_status",
	"to_status" "booking_status" NOT NULL,
	"changed_by" uuid NOT NULL,
	"note" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_no" varchar(30) NOT NULL,
	"sales_order_no" varchar(50) NOT NULL,
	"quote_id" uuid,
	"sales_agent_id" uuid NOT NULL,
	"assigned_ops_id" uuid,
	"product_id" uuid NOT NULL,
	"rate_id" uuid NOT NULL,
	"supplier_id" uuid,
	"customer_name" varchar(255) NOT NULL,
	"customer_email" varchar(255),
	"customer_phone" varchar(50),
	"customer_country" varchar(100),
	"customer_nationality" varchar(100),
	"travel_date" date NOT NULL,
	"pickup_time" varchar(10),
	"pickup_location" text,
	"dropoff_location" text,
	"adults" integer DEFAULT 0 NOT NULL,
	"children" integer DEFAULT 0 NOT NULL,
	"infants" integer DEFAULT 0 NOT NULL,
	"total_pax" integer NOT NULL,
	"unit_adult" numeric(10, 2) NOT NULL,
	"unit_child" numeric(10, 2) NOT NULL,
	"unit_infant" numeric(10, 2) NOT NULL,
	"net_cost" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	"status" "booking_status" DEFAULT 'NEW' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"special_requests" text,
	"internal_notes" text,
	"supplier_ref" varchar(100),
	"voucher_url" text,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_booking_no_unique" UNIQUE("booking_no")
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(3) NOT NULL,
	"name" varchar(100) NOT NULL,
	"flag_emoji" varchar(10),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "countries_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "hotel_booking_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"changed_by" uuid,
	"note" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotel_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_no" text NOT NULL,
	"sales_order_no" text NOT NULL,
	"invoice_no_odoo" text,
	"sales_agent_id" uuid NOT NULL,
	"assigned_ops_id" uuid,
	"hotel_id" uuid NOT NULL,
	"room_type_id" uuid NOT NULL,
	"rate_id" uuid NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text,
	"customer_phone" text,
	"customer_country" text,
	"customer_nationality" text,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"nights" integer NOT NULL,
	"num_rooms" integer DEFAULT 1 NOT NULL,
	"occupancy" "occupancy" DEFAULT 'DOUBLE' NOT NULL,
	"adults" integer DEFAULT 2 NOT NULL,
	"children" integer DEFAULT 0 NOT NULL,
	"infants" integer DEFAULT 0 NOT NULL,
	"unit_rate" numeric(10, 2) NOT NULL,
	"child_supplements" numeric(10, 2) DEFAULT '0',
	"season_surcharge" numeric(10, 2) DEFAULT '0',
	"early_bird_discount" numeric(10, 2) DEFAULT '0',
	"net_cost" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"hotel_confirmation_ref" text,
	"email_sent_to_hotel" boolean DEFAULT false,
	"email_sent_at" timestamp with time zone,
	"status" "hotel_booking_status" DEFAULT 'NEW' NOT NULL,
	"payment_status" text DEFAULT 'PENDING',
	"special_requests" text,
	"internal_notes" text,
	"cancellation_reason" text,
	"confirmed_at" timestamp with time zone,
	"voucher_issued_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hotel_bookings_booking_no_unique" UNIQUE("booking_no")
);
--> statement-breakpoint
CREATE TABLE "hotel_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"is_cover" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotel_rate_seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"name" text NOT NULL,
	"valid_from" date NOT NULL,
	"valid_to" date NOT NULL,
	"surcharge_per_night" numeric(10, 2) DEFAULT '0',
	"priority" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotel_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"room_type_id" uuid NOT NULL,
	"season_id" uuid,
	"valid_from" date NOT NULL,
	"valid_to" date NOT NULL,
	"net_single" numeric(10, 2) DEFAULT '0',
	"net_double" numeric(10, 2) NOT NULL,
	"net_triple" numeric(10, 2) DEFAULT '0',
	"net_quad" numeric(10, 2) DEFAULT '0',
	"markup_pct" numeric(5, 2) DEFAULT '0',
	"commission_pct" numeric(5, 2) DEFAULT '0',
	"sell_single" numeric(10, 2) DEFAULT '0',
	"sell_double" numeric(10, 2) DEFAULT '0',
	"sell_triple" numeric(10, 2) DEFAULT '0',
	"sell_quad" numeric(10, 2) DEFAULT '0',
	"meal_plan" "meal_plan" DEFAULT 'RO' NOT NULL,
	"child_age_min" integer DEFAULT 2,
	"child_age_max" integer DEFAULT 11,
	"child_rate" numeric(10, 2) DEFAULT '0',
	"child_meal_supplement" numeric(10, 2) DEFAULT '0',
	"early_bird_days" integer,
	"early_bird_pct" numeric(5, 2),
	"min_nights" integer DEFAULT 1,
	"max_nights" integer,
	"original_currency" text DEFAULT 'USD',
	"exchange_rate_at_upload" numeric(12, 6) DEFAULT '1',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotel_room_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"max_occupancy" integer DEFAULT 2 NOT NULL,
	"bed_config" text,
	"size_m2" numeric(6, 2),
	"view" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"amenities" jsonb DEFAULT '[]'::jsonb,
	"total_rooms" integer,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"brand" text,
	"star_rating" integer,
	"country_id" uuid NOT NULL,
	"city_id" uuid,
	"address" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"short_desc" text,
	"long_desc" text,
	"amenities" jsonb DEFAULT '[]'::jsonb,
	"policies" text,
	"cancellation_policy" text,
	"important_info" text,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"reservation_email" text,
	"status" "hotel_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hotels_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"related_booking_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"action_type" varchar(100) NOT NULL,
	"performed_by" uuid NOT NULL,
	"notes" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"icon" varchar(50),
	CONSTRAINT "product_categories_name_unique" UNIQUE("name"),
	CONSTRAINT "product_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_category_map" (
	"product_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "product_category_map_product_id_category_id_pk" PRIMARY KEY("product_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt_text" varchar(255),
	"is_cover" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "product_type" NOT NULL,
	"country_id" uuid NOT NULL,
	"city_id" uuid,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"short_desc" text,
	"long_desc" text,
	"duration_hours" numeric(5, 2),
	"language" varchar(100),
	"meeting_point" text,
	"inclusions" jsonb DEFAULT '[]'::jsonb,
	"exclusions" jsonb DEFAULT '[]'::jsonb,
	"cancellation_policy" text,
	"important_info" text,
	"status" "product_status" DEFAULT 'DRAFT' NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_no" varchar(30) NOT NULL,
	"sales_agent_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"rate_id" uuid NOT NULL,
	"travel_date" date NOT NULL,
	"adults" integer DEFAULT 0 NOT NULL,
	"children" integer DEFAULT 0 NOT NULL,
	"infants" integer DEFAULT 0 NOT NULL,
	"unit_adult" numeric(10, 2) NOT NULL,
	"unit_child" numeric(10, 2) NOT NULL,
	"unit_infant" numeric(10, 2) NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	"status" "quote_status" DEFAULT 'DRAFT' NOT NULL,
	"notes" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_quote_no_unique" UNIQUE("quote_no")
);
--> statement-breakpoint
CREATE TABLE "rate_seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"season_id" uuid,
	"supplier_id" uuid,
	"net_adult" numeric(10, 2) DEFAULT '0' NOT NULL,
	"net_child" numeric(10, 2) DEFAULT '0' NOT NULL,
	"net_infant" numeric(10, 2) DEFAULT '0' NOT NULL,
	"markup_pct" numeric(5, 2) DEFAULT '0' NOT NULL,
	"sell_adult" numeric(10, 2) DEFAULT '0' NOT NULL,
	"sell_child" numeric(10, 2) DEFAULT '0' NOT NULL,
	"sell_infant" numeric(10, 2) DEFAULT '0' NOT NULL,
	"min_pax" integer DEFAULT 1,
	"max_pax" integer,
	"child_age_min" integer DEFAULT 2,
	"child_age_max" integer DEFAULT 11,
	"valid_from" date NOT NULL,
	"valid_to" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"country_id" uuid,
	"contact_name" varchar(150),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"payment_terms" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfers" (
	"product_id" uuid PRIMARY KEY NOT NULL,
	"from_location" varchar(255) NOT NULL,
	"to_location" varchar(255) NOT NULL,
	"vehicle_type" "vehicle_type" NOT NULL,
	"max_pax" integer NOT NULL,
	"luggage_capacity" integer,
	"direction" "transfer_direction" DEFAULT 'ONE_WAY' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email_verified" timestamp with time zone,
	"image_url" text,
	"google_id" varchar(255),
	"role" "user_role" DEFAULT 'SALES' NOT NULL,
	"country_scope" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_sales_agent_id_users_id_fk" FOREIGN KEY ("sales_agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_assigned_ops_id_users_id_fk" FOREIGN KEY ("assigned_ops_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_rate_id_rates_id_fk" FOREIGN KEY ("rate_id") REFERENCES "public"."rates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_booking_status_history" ADD CONSTRAINT "hotel_booking_status_history_booking_id_hotel_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."hotel_bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_booking_status_history" ADD CONSTRAINT "hotel_booking_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_bookings" ADD CONSTRAINT "hotel_bookings_sales_agent_id_users_id_fk" FOREIGN KEY ("sales_agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_bookings" ADD CONSTRAINT "hotel_bookings_assigned_ops_id_users_id_fk" FOREIGN KEY ("assigned_ops_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_bookings" ADD CONSTRAINT "hotel_bookings_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_bookings" ADD CONSTRAINT "hotel_bookings_room_type_id_hotel_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."hotel_room_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_bookings" ADD CONSTRAINT "hotel_bookings_rate_id_hotel_rates_id_fk" FOREIGN KEY ("rate_id") REFERENCES "public"."hotel_rates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_images" ADD CONSTRAINT "hotel_images_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_rate_seasons" ADD CONSTRAINT "hotel_rate_seasons_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_rates" ADD CONSTRAINT "hotel_rates_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_rates" ADD CONSTRAINT "hotel_rates_room_type_id_hotel_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."hotel_room_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_rates" ADD CONSTRAINT "hotel_rates_season_id_hotel_rate_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."hotel_rate_seasons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_room_types" ADD CONSTRAINT "hotel_room_types_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_booking_id_bookings_id_fk" FOREIGN KEY ("related_booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_actions" ADD CONSTRAINT "ops_actions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_actions" ADD CONSTRAINT "ops_actions_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category_map" ADD CONSTRAINT "product_category_map_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category_map" ADD CONSTRAINT "product_category_map_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_sales_agent_id_users_id_fk" FOREIGN KEY ("sales_agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_rate_id_rates_id_fk" FOREIGN KEY ("rate_id") REFERENCES "public"."rates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_seasons" ADD CONSTRAINT "rate_seasons_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rates" ADD CONSTRAINT "rates_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rates" ADD CONSTRAINT "rates_season_id_rate_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."rate_seasons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rates" ADD CONSTRAINT "rates_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rates" ADD CONSTRAINT "rates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_user_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_agent_idx" ON "bookings" USING btree ("sales_agent_id");--> statement-breakpoint
CREATE INDEX "bookings_ops_idx" ON "bookings" USING btree ("assigned_ops_id");--> statement-breakpoint
CREATE INDEX "bookings_travel_date_idx" ON "bookings" USING btree ("travel_date");--> statement-breakpoint
CREATE INDEX "bookings_sales_order_idx" ON "bookings" USING btree ("sales_order_no");--> statement-breakpoint
CREATE INDEX "cities_country_idx" ON "cities" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "products_country_idx" ON "products" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "products_type_idx" ON "products" USING btree ("type");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_search_idx" ON "products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "quotes_agent_idx" ON "quotes" USING btree ("sales_agent_id");--> statement-breakpoint
CREATE INDEX "quotes_status_idx" ON "quotes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rates_product_idx" ON "rates" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "rates_validity_idx" ON "rates" USING btree ("valid_from","valid_to");