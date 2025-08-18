import { Response } from "express";
import { ServiceError } from "./service-error";
import { sendError } from "./response";
import { ErrorCodes } from "./error-codes";
import { ServiceErrorCodes } from "./service-error-codes";

export function handleServiceError(res: Response, e: unknown, fallbackMsg: string) {
  if (e instanceof ServiceError) {
    switch (e.code) {
      // Wallet
      case ServiceErrorCodes.WALLET_EXISTS:
        return sendError(res, "Wallet already exists", ErrorCodes.VALIDATION_ERROR, 400);
      case ServiceErrorCodes.WALLET_NOT_FOUND:
        return sendError(res, "Wallet not found", ErrorCodes.NOT_FOUND, 404);
      case ServiceErrorCodes.ALREADY_PRIMARY:
        return sendError(res, "Wallet is already primary", ErrorCodes.VALIDATION_ERROR, 400);
      case ServiceErrorCodes.CANNOT_DELETE_PRIMARY:
        return sendError(res, "Cannot delete primary wallet", ErrorCodes.VALIDATION_ERROR, 400);

      // PaymentLink
      case ServiceErrorCodes.PAYMENTLINK_NOT_FOUND:
        return sendError(res, "Payment link not found", ErrorCodes.NOT_FOUND, 404);
      case ServiceErrorCodes.CHAIN_MISMATCH:
        return sendError(res, "Wallet chain does not match link chain", ErrorCodes.VALIDATION_ERROR, 400);
      case ServiceErrorCodes.UNSUPPORTED_ASSET:
        return sendError(res, "Unsupported asset for this chain", ErrorCodes.VALIDATION_ERROR, 400);
      case ServiceErrorCodes.INVALID_AMOUNT:
        return sendError(res, "Invalid amount", ErrorCodes.VALIDATION_ERROR, 400);
      case ServiceErrorCodes.MEMO_TOO_LONG:
        return sendError(res, "Memo too long", ErrorCodes.VALIDATION_ERROR, 400);
    }
  }

  return sendError(res, fallbackMsg, ErrorCodes.DATABASE_ERROR, 500);
}
