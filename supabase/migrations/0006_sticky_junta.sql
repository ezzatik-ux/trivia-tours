CREATE TABLE "package_day_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt_text" varchar(255),
	"is_cover" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "package_day_images" ADD CONSTRAINT "package_day_images_day_id_package_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."package_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "package_day_images_day_idx" ON "package_day_images" USING btree ("day_id");