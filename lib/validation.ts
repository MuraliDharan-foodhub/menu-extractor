import { z } from "zod";

export const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  price: z.number().min(0, "Price must be non-negative"),
  variants: z
    .array(z.object({ name: z.string(), price: z.number() }))
    .optional(),
  dietaryTags: z.array(z.string()),
  available: z.boolean(),
  confidence: z.number().min(0).max(1),
});

export const MenuCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Category name is required"),
  items: z.array(MenuItemSchema),
});

export const ExtractedMenuSchema = z.object({
  categories: z.array(MenuCategorySchema),
  currency: z.string(),
  extractionConfidence: z.number(),
  rawText: z.string(),
});

export const CreateMenuSchema = ExtractedMenuSchema.refine(
  (data) =>
    data.categories.length > 0 &&
    data.categories.some((c) => c.items.length > 0),
  { message: "Menu must have at least one category with one item" }
);

export const UploadRequestSchema = z.object({
  image: z.string().min(1, "Image is required"),
});

export const AddMenuItemFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  dietaryTags: z.array(z.string()),
  available: z.boolean(),
});

export type AddMenuItemFormValues = z.infer<typeof AddMenuItemFormSchema>;
