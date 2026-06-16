ALTER TABLE "collections" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "deleted_at" timestamp;