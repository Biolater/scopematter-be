import { Response } from "express";
import { ServiceError } from "./service-error";
import { sendError } from "./response";
import { ErrorCodes } from "./error-codes";
import { ServiceErrorCodes } from "./service-error-codes";

export function handleServiceError({ res, e, fallbackMsg }: { res: Response, e: unknown, fallbackMsg: string }) {
  if (e instanceof ServiceError) {
    switch (e.code) {
      // Wallet
      case ServiceErrorCodes.WALLET_EXISTS:
        return sendError({ res, message: "Wallet already exists", code: ErrorCodes.VALIDATION_ERROR, status: 400 });
      case ServiceErrorCodes.WALLET_NOT_FOUND:
        return sendError({ res, message: "Wallet not found", code: ErrorCodes.NOT_FOUND, status: 404 });
      case ServiceErrorCodes.ALREADY_PRIMARY:
        return sendError({ res, message: "Wallet is already primary", code: ErrorCodes.VALIDATION_ERROR, status: 400 });
      case ServiceErrorCodes.CANNOT_DELETE_PRIMARY:
        return sendError({ res, message: "Cannot delete primary wallet", code: ErrorCodes.VALIDATION_ERROR, status: 400 });

      // PaymentLink
      case ServiceErrorCodes.PAYMENTLINK_NOT_FOUND:
        return sendError({ res, message: "Payment link not found", code: ErrorCodes.NOT_FOUND, status: 404 });
      case ServiceErrorCodes.CHAIN_MISMATCH:
        return sendError({ res, message: "Wallet chain does not match link chain", code: ErrorCodes.VALIDATION_ERROR, status: 400 });
      case ServiceErrorCodes.UNSUPPORTED_ASSET:
        return sendError({ res, message: "Unsupported asset for this chain", code: ErrorCodes.VALIDATION_ERROR, status: 400 });
      case ServiceErrorCodes.INVALID_AMOUNT:
        return sendError({ res, message: "Invalid amount", code: ErrorCodes.VALIDATION_ERROR, status: 400 });
      case ServiceErrorCodes.MEMO_TOO_LONG:
        return sendError({ res, message: "Memo too long", code: ErrorCodes.VALIDATION_ERROR, status: 400 });
      case ServiceErrorCodes.PAYMENTLINK_ALREADY_IN_THIS_STATUS:
        return sendError({ res, message: "Payment link is already in this status", code: ErrorCodes.VALIDATION_ERROR, status: 400 });
      case ServiceErrorCodes.PAYMENTLINK_HAS_TRANSACTIONS:
        return sendError({ res, message: "Payment link has transactions", code: ErrorCodes.VALIDATION_ERROR, status: 400 });
      default:
        return sendError({ res, message: "Unknown error", code: ErrorCodes.DATABASE_ERROR, status: 500 });
    }
  }

  return sendError({ res, message: fallbackMsg, code: ErrorCodes.DATABASE_ERROR, status: 500 });
}
