import { z } from "zod";

export const createWalletSchema = z.object({
    address: z.string({
        error: "Please provide a valid wallet address"
    }).min(1, "Address is required").regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
    chain: z.enum(["ETH_MAINNET"], {
        error: "Unsupported chain. Please select a valid one"
    }),
    isPrimary: z.boolean({
        error: "Please provide a valid boolean value"
    }).optional(),
});