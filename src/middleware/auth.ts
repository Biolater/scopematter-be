import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import prisma from "../lib/prisma";
import { sendError } from "../utils/response";
import { ErrorCodes } from "../utils/error-codes";

export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return sendError(res, "Unauthorized", ErrorCodes.UNAUTHORIZED, 401);
        }

        let appUser = await prisma.appUser.findUnique({
            where: { clerkId: userId },
        });

        if (!appUser) {
            return sendError(res, "User not found", ErrorCodes.NOT_FOUND, 404);
        }

        req.user = appUser;

        next();
    } catch (err) {
        console.error("Auth middleware error:", err);
        return sendError(res, "Auth failed", ErrorCodes.INTERNAL_SERVER_ERROR, 500);
    }
}
