CREATE INDEX "collections_user_id_idx" ON "collections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "item_collections_collection_id_idx" ON "item_collections" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "item_tags_item_id_idx" ON "item_tags" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "items_user_id_type_id_idx" ON "items" USING btree ("user_id","type_id");--> statement-breakpoint
CREATE INDEX "tags_user_id_idx" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tags_name_idx" ON "tags" USING btree ("name");