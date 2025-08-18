import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createWalletController, deleteWalletController, getWalletsController, setPrimaryWalletController } from "../controllers/wallet.controller";
import { validateBody } from "../middleware/validate";
import { createWalletSchema } from "../validation/wallet.schema";

const walletRouter = Router();

walletRouter.get("/", requireAuth, getWalletsController)

walletRouter.post("/", requireAuth, validateBody(createWalletSchema), createWalletController)

walletRouter.patch("/:id/primary", requireAuth, setPrimaryWalletController)

walletRouter.delete("/:id", requireAuth, deleteWalletController)

export default walletRouter;