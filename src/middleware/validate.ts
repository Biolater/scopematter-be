import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { sendError } from "../utils/response";
import { ErrorCodes } from "../utils/error-codes";
import { formatZodError } from "../utils/zod-error";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return sendError({ res, message: "Validation failed", code: ErrorCodes.VALIDATION_ERROR, status: 400, details: formatZodError(result.error) });
    }
    req.body = result.data;
    next();
  };
}
