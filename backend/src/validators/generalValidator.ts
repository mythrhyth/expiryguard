import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g. #2563EB)").optional(),
});

export const departmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters"),
});
