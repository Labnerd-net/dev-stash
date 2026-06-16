CREATE TABLE "user_recently_viewed" (
	"user_id" text NOT NULL,
	"item_id" text NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_recently_viewed_user_id_item_id_pk" PRIMARY KEY("user_id","item_id")
);
--> statement-breakpoint
ALTER TABLE "user_recently_viewed" ADD CONSTRAINT "user_recently_viewed_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_recently_viewed" ADD CONSTRAINT "user_recently_viewed_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recently_viewed_user_id_idx" ON "user_recently_viewed" USING btree ("user_id");