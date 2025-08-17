import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createWallet, deleteWallet, getWallets, setPrimaryWallet } from "../controllers/wallet.controller";
import { validateBody } from "../middleware/validate";
import { createWalletSchema } from "../validation/wallet.schema";

const walletRouter = Router();

walletRouter.get("/", requireAuth, getWallets)

walletRouter.post("/", requireAuth, validateBody(createWalletSchema), createWallet)

walletRouter.patch("/:id/primary", requireAuth, setPrimaryWallet)

walletRouter.delete("/:id", requireAuth, deleteWallet)

export default walletRouter;