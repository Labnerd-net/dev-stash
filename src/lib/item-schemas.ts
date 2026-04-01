import { z } from "zod";

export const createItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  typeId: z.string().min(1, "Type is required"),
  content: z.string().optional(),
  url: z.union([z.string().url("Must be a valid URL"), z.literal("")]).optional(),
  description: z.string().optional(),
  language: z.string().optional(),
});

export const updateItemSchema = createItemSchema.extend({
  id: z.string().min(1),
  isFavorite: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  isPinned: z
    .string()
    .transform((v) => v === "true")
    .optional(),
});

export const deleteItemSchema = z.object({
  id: z.string().min(1),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
