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

export function sendSuccess<T>(
    res: Response,
    data: T,
    status: number = 200,
    meta: Record<string, unknown> = {}
): Response<SuccessResponse<T>> {
    return res.status(status).json({
        success: true,
        data,
        error: null,
        meta,
    });
}

export function sendError(
    res: Response,
    message: string,
    code: ErrorCode = ErrorCodes.INTERNAL_SERVER_ERROR,
    status: number = 500,
    details: ErrorDetail[] = [],
    meta: Record<string, unknown> = {}
): Response<ErrorResponse> {
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