import { z } from "zod";

export const createScopeItemSchema = z.object({
    description: z.string().min(1, "Description is required").max(1000, "Description too long"),
});

export const deleteScopeItemSchema = z.object({
    id: z.cuid("Invalid scope item ID"),
});

export const updateScopeItemSchema = z.object({
    description: z.string().min(1, "Description is required").max(1000, "Description too long"),
  });
  

export type CreateScopeItemSchema = z.infer<typeof createScopeItemSchema>;
export type DeleteScopeItemSchema = z.infer<typeof deleteScopeItemSchema>;
export type UpdateScopeItemSchema = z.infer<typeof updateScopeItemSchema>;