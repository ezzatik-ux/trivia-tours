ALTER TABLE "packages" ADD COLUMN "code" varchar(20);--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_code_unique" UNIQUE("code");