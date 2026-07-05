import { z } from "zod";
import { Priority } from "../types/enums";

export const createRecordSchema = z.object({
  name: z.string().min(2, "Record name must be at least 2 characters"),
  description: z.string().optional(),
  categoryId: z.string().uuid("Invalid category ID"),
  ownerId: z.string().uuid("Invalid owner User ID"),
  departmentId: z.string().uuid("Invalid department ID"),
  vendor: z.string().optional().nullable(),
  documentNumber: z.string().optional().nullable(),
  issueDate: z.preprocess((val) => new Date(val as string), z.date()),
  expiryDate: z.preprocess((val) => new Date(val as string), z.date()),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  remarks: z.string().optional(),
});

export const updateRecordSchema = createRecordSchema.partial().extend({
  // Allows optional values on all fields for updates
});

export const renewRecordSchema = z.object({
  newExpiry: z.preprocess((val) => new Date(val as string), z.date()),
  remarks: z.string().optional(),
});
