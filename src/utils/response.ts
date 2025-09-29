import { Response } from "express";
import { ErrorCode, ErrorCodes } from "./error-codes";

export interface ErrorDetail {
    field?: string;   // optional: which field failed validation
    message: string;
}

export interface SuccessResponse<T> {
    success: true;
    data: T;
    error: null;
    meta: Record<string, unknown>;
}

export interface ErrorResponse {
    success: false;
    data: null;
    error: {
        message: string;
        code: ErrorCode;
        details?: ErrorDetail[];
    };
    meta: Record<string, unknown>;
}

interface SendSuccessParams<T> {
    res: Response;
    data: T;
    status?: number;
    meta?: Record<string, unknown>;
}

interface SendErrorParams {
    res: Response;
    message: string;
    code?: ErrorCode;
    status?: number;
    details?: ErrorDetail[];
    meta?: Record<string, unknown>;
}

export function sendSuccess<T>({
    res,
    data,
    status = 200,
    meta = {},
}: SendSuccessParams<T>): Response<SuccessResponse<T>> {
    return res.status(status).json({
        success: true,
        data,
        error: null,
        meta,
    });
}

export function sendError({
    res,
    message,
    code = ErrorCodes.INTERNAL_SERVER_ERROR,
    status = 500,
    details = [],
    meta = {},
}: SendErrorParams): Response<ErrorResponse> {
    return res.status(status).json({
        success: false,
        data: null,
        error: {
            message,
            code,
            details: details.length > 0 ? details : undefined,
        },
        meta,
    });
}
