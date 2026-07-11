CREATE TYPE "public"."board_basis" AS ENUM('RO', 'BB', 'HB', 'FB', 'AI');--> statement-breakpoint
CREATE TABLE "package_accommodation_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accommodation_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt_text" varchar(255),
	"is_cover" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package_accommodations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"hotel_name" varchar(255) NOT NULL,
	"city_name" varchar(255),
	"nights" integer DEFAULT 1 NOT NULL,
	"board_basis" "board_basis" DEFAULT 'BB' NOT NULL,
	"start_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "package_accommodation_images" ADD CONSTRAINT "package_accommodation_images_accommodation_id_package_accommodations_id_fk" FOREIGN KEY ("accommodation_id") REFERENCES "public"."package_accommodations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_accommodations" ADD CONSTRAINT "package_accommodations_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "package_accommodation_images_accommodation_idx" ON "package_accommodation_images" USING btree ("accommodation_id");--> statement-breakpoint
CREATE INDEX "package_accommodations_package_idx" ON "package_accommodations" USING btree ("package_id");