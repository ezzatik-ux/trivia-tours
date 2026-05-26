CREATE TYPE "public"."transfer_booking_status" AS ENUM('NEW', 'ACK', 'SUPPLIER_CONTACTED', 'CONFIRMED', 'VOUCHER_ISSUED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."transfer_location_type" AS ENUM('AIRPORT', 'HOTEL', 'CITY', 'ZONE', 'LANDMARK', 'PORT');--> statement-breakpoint
CREATE TABLE "transfer_booking_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"changed_by" uuid,
	"note" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfer_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_no" text NOT NULL,
	"sales_order_no" text NOT NULL,
	"invoice_no_odoo" text,
	"sales_agent_id" uuid NOT NULL,
	"assigned_ops_id" uuid,
	"route_id" uuid NOT NULL,
	"rate_id" uuid NOT NULL,
	"supplier_id" uuid,
	"vehicle_type" "vehicle_type" NOT NULL,
	"num_vehicles" integer DEFAULT 1 NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text,
	"customer_phone" text,
	"customer_nationality" text,
	"transfer_date" date NOT NULL,
	"pickup_time" varchar(10),
	"flight_number" varchar(20),
	"pax" integer DEFAULT 1 NOT NULL,
	"luggage_count" integer,
	"pickup_address" text,
	"dropoff_address" text,
	"unit_price" numeric(10, 2) NOT NULL,
	"net_cost" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"supplier_confirmation_ref" text,
	"email_sent_to_supplier" boolean DEFAULT false,
	"email_sent_at" timestamp with time zone,
	"status" "transfer_booking_status" DEFAULT 'NEW' NOT NULL,
	"payment_status" text DEFAULT 'PENDING',
	"special_requests" text,
	"internal_notes" text,
	"cancellation_reason" text,
	"confirmed_at" timestamp with time zone,
	"voucher_issued_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transfer_bookings_booking_no_unique" UNIQUE("booking_no")
);
--> statement-breakpoint
CREATE TABLE "transfer_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "transfer_location_type" NOT NULL,
	"city_name" text,
	"code" varchar(10),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfer_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_id" uuid NOT NULL,
	"vehicle_type" "vehicle_type" NOT NULL,
	"max_pax" integer NOT NULL,
	"max_luggage" integer,
	"net_price" numeric(10, 2) NOT NULL,
	"markup_pct" numeric(5, 2) DEFAULT '0',
	"sell_price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"valid_from" date,
	"valid_to" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfer_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_id" uuid NOT NULL,
	"from_location_id" uuid NOT NULL,
	"to_location_id" uuid NOT NULL,
	"supplier_id" uuid,
	"estimated_duration_min" integer,
	"distance_km" numeric(6, 1),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transfer_booking_status_history" ADD CONSTRAINT "transfer_booking_status_history_booking_id_transfer_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."transfer_bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_booking_status_history" ADD CONSTRAINT "transfer_booking_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_bookings" ADD CONSTRAINT "transfer_bookings_sales_agent_id_users_id_fk" FOREIGN KEY ("sales_agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_bookings" ADD CONSTRAINT "transfer_bookings_assigned_ops_id_users_id_fk" FOREIGN KEY ("assigned_ops_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_bookings" ADD CONSTRAINT "transfer_bookings_route_id_transfer_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."transfer_routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_bookings" ADD CONSTRAINT "transfer_bookings_rate_id_transfer_rates_id_fk" FOREIGN KEY ("rate_id") REFERENCES "public"."transfer_rates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_bookings" ADD CONSTRAINT "transfer_bookings_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_locations" ADD CONSTRAINT "transfer_locations_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_rates" ADD CONSTRAINT "transfer_rates_route_id_transfer_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."transfer_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_rates" ADD CONSTRAINT "transfer_rates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_routes" ADD CONSTRAINT "transfer_routes_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_routes" ADD CONSTRAINT "transfer_routes_from_location_id_transfer_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "public"."transfer_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_routes" ADD CONSTRAINT "transfer_routes_to_location_id_transfer_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "public"."transfer_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_routes" ADD CONSTRAINT "transfer_routes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transfer_bookings_status_idx" ON "transfer_bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transfer_bookings_agent_idx" ON "transfer_bookings" USING btree ("sales_agent_id");--> statement-breakpoint
CREATE INDEX "transfer_bookings_ops_idx" ON "transfer_bookings" USING btree ("assigned_ops_id");--> statement-breakpoint
CREATE INDEX "transfer_bookings_date_idx" ON "transfer_bookings" USING btree ("transfer_date");--> statement-breakpoint
CREATE INDEX "transfer_locations_country_idx" ON "transfer_locations" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "transfer_locations_type_idx" ON "transfer_locations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transfer_rates_route_idx" ON "transfer_rates" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "transfer_rates_vehicle_idx" ON "transfer_rates" USING btree ("vehicle_type");--> statement-breakpoint
CREATE INDEX "transfer_routes_from_idx" ON "transfer_routes" USING btree ("from_location_id");--> statement-breakpoint
CREATE INDEX "transfer_routes_to_idx" ON "transfer_routes" USING btree ("to_location_id");--> statement-breakpoint
CREATE INDEX "transfer_routes_country_idx" ON "transfer_routes" USING btree ("country_id");