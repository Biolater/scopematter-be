import { z } from "zod";
import { RequestStatus } from "@prisma/client";


export const createRequestSchema = z.object({
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description too long"),
});

export const updateRequestSchema = z.object({
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description too long")
    .optional(),

  // Only allow IN_SCOPE or OUT_OF_SCOPE on update
  status: z.enum([RequestStatus.IN_SCOPE, RequestStatus.OUT_OF_SCOPE]).optional(),
});

export type CreateRequestSchema = z.infer<typeof createRequestSchema>;
export type UpdateRequestSchema = z.infer<typeof updateRequestSchema>;