ALTER TABLE "cities" ADD COLUMN "code" varchar(3);--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_code_unique" UNIQUE("code");