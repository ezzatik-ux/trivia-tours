CREATE TYPE "public"."transfer_trip_type" AS ENUM('ONE_WAY', 'ROUND_TRIP');--> statement-breakpoint
CREATE TABLE "transfer_vehicle_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"tier" integer DEFAULT 1 NOT NULL,
	"base_vehicle_type" "vehicle_type",
	"example_models" text,
	"description" text,
	"image_url" text,
	"max_pax" integer DEFAULT 3 NOT NULL,
	"max_luggage" integer DEFAULT 3,
	"amenities" jsonb DEFAULT '[]'::jsonb,
	"driver_languages" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transfer_bookings" ADD COLUMN "trip_type" "transfer_trip_type" DEFAULT 'ONE_WAY' NOT NULL;--> statement-breakpoint
ALTER TABLE "transfer_bookings" ADD COLUMN "arrival_terminal" varchar(20);--> statement-breakpoint
ALTER TABLE "transfer_bookings" ADD COLUMN "greeting_sign" text;--> statement-breakpoint
ALTER TABLE "transfer_bookings" ADD COLUMN "return_date" date;--> statement-breakpoint
ALTER TABLE "transfer_bookings" ADD COLUMN "return_pickup_time" varchar(10);--> statement-breakpoint
ALTER TABLE "transfer_bookings" ADD COLUMN "return_flight_number" varchar(20);--> statement-breakpoint
ALTER TABLE "transfer_bookings" ADD COLUMN "return_terminal" varchar(20);--> statement-breakpoint
ALTER TABLE "transfer_bookings" ADD COLUMN "return_flight_departure" varchar(10);--> statement-breakpoint
CREATE INDEX "transfer_vehicle_classes_active_idx" ON "transfer_vehicle_classes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "transfer_vehicle_classes_tier_idx" ON "transfer_vehicle_classes" USING btree ("tier");