import { z } from "zod";

export const createShareLinkSchema = z.object({
    expiresAt: z.coerce.date().optional(),
    showScopeItems: z.boolean().optional(),
    showRequests: z.boolean().optional(),
    showChangeOrders: z.boolean().optional(),
})

export type CreateShareLinkSchema = z.infer<typeof createShareLinkSchema>;