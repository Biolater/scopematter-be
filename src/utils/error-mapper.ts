import { Response } from "express";
import { ServiceError } from "./service-error";
import { sendError } from "./response";
import { ErrorCodes } from "./error-codes";
import { ServiceErrorCodes } from "./service-error-codes";

export function handleServiceError({ res, e, fallbackMsg }: { res: Response, e: unknown, fallbackMsg: string }) {
  if (e instanceof ServiceError) {
    switch (e.code) {

      // Project
      case ServiceErrorCodes.PROJECT_NOT_FOUND:
        return sendError({ res, message: "Project not found", code: ErrorCodes.NOT_FOUND, status: 404 });

      // ScopeItem
      case ServiceErrorCodes.SCOPE_ITEM_NOT_FOUND:
        return sendError({ res, message: "Scope item not found", code: ErrorCodes.NOT_FOUND, status: 404 });

      // Request
      case ServiceErrorCodes.REQUEST_NOT_FOUND:
        return sendError({ res, message: "Request not found", code: ErrorCodes.NOT_FOUND, status: 404 });
      case ServiceErrorCodes.REQUEST_NOT_ELIGIBLE:
        return sendError({ res, message: "Request not eligible for change order", code: ErrorCodes.VALIDATION_ERROR, status: 400 });
      // ChangeOrder
      case ServiceErrorCodes.CHANGE_ORDER_NOT_FOUND:
        return sendError({ res, message: "Change order not found", code: ErrorCodes.NOT_FOUND, status: 404 });
      case ServiceErrorCodes.INVALID_STATUS_UPDATE:
        return sendError({ res, message: "Invalid status update", code: ErrorCodes.VALIDATION_ERROR, status: 400 });

      // ShareLink
      case ServiceErrorCodes.SHARE_LINK_NOT_FOUND:
        return sendError({ res, message: "Share link not found", code: ErrorCodes.NOT_FOUND, status: 404 });
      case ServiceErrorCodes.SHARE_LINK_NOT_ACTIVE:
        return sendError({ res, message: "Share link not active", code: ErrorCodes.NOT_FOUND, status: 404 });
      case ServiceErrorCodes.SHARE_LINK_EXPIRED:
        return sendError({ res, message: "Share link expired", code: ErrorCodes.NOT_FOUND, status: 404 });
      default:
        return sendError({ res, message: "Unknown error", code: ErrorCodes.DATABASE_ERROR, status: 500 });
    }
  }

  return sendError({ res, message: fallbackMsg, code: ErrorCodes.DATABASE_ERROR, status: 500 });
}
