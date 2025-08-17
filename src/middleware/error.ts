import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response";
import { ErrorCodes } from "../utils/error-codes";

export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
) {
    console.error("Unhandled error:", err);

    // For unexpected errors, you don’t want to expose internals
    return sendError(
        res,
        "Something went wrong",
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500
    );
}