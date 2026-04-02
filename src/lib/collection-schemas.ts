import { z } from "zod";

export const createCollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
});

export const updateCollectionSchema = createCollectionSchema.extend({
  id: z.string().min(1),
  isFavorite: z
    .string()
    .transform((v) => v === "true")
    .optional(),
});

export const deleteCollectionSchema = z.object({
  id: z.string().min(1),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
