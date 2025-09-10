import { z } from "zod";

export const createChangeOrderSchema = z.object({
  requestId: z.cuid(),
  priceUsd: z
    .number()
    .positive()
    .max(999999.99)
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
      message: "priceUsd must have at most 2 decimal places",
    }),
  extraDays: z.number().int().positive().max(365).optional(),
});

export const updateChangeOrderSchema = z.object({
  priceUsd: z
    .number()
    .positive()
    .max(999999.99)
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
      message: "priceUsd must have at most 2 decimal places",
    })
    .optional(),
  extraDays: z.number().int().positive().max(365).optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

export type CreateChangeOrderSchema = z.infer<typeof createChangeOrderSchema>;
export type UpdateChangeOrderSchema = z.infer<typeof updateChangeOrderSchema>;
