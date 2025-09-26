import { scopeItemStatus } from "@prisma/client";
import { z } from "zod";

export const createScopeItemSchema = z.object({
    description: z.string().min(1, "Description is required").max(1000, "Description too long"),
    name: z.string().min(1, "Name is required").max(100, "Name too long"),
});

export const deleteScopeItemSchema = z.object({
    id: z.cuid("Invalid scope item ID"),
});

export const updateScopeItemSchema = z.object({
    description: z.string().min(1, "Description is required").max(1000, "Description too long"),
    name: z.string().min(1, "Name is required").max(100, "Name too long"),
    status: z.enum([scopeItemStatus.PENDING, scopeItemStatus.COMPLETED, scopeItemStatus.IN_PROGRESS]),
});
  

export type CreateScopeItemSchema = z.infer<typeof createScopeItemSchema>;
export type DeleteScopeItemSchema = z.infer<typeof deleteScopeItemSchema>;
export type UpdateScopeItemSchema = z.infer<typeof updateScopeItemSchema>;