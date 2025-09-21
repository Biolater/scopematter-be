import { Request, Response } from "express";
import { sendSuccess } from "../utils/response";
import { handleServiceError } from "../utils/error-mapper";
import { getDashboard } from "../services/dashboard.service";

export const getDashboardController = async (req: Request, res: Response) => {
    try{
        const dashboard = await getDashboard({ userId: req.user.id });
        return sendSuccess({ res, data: dashboard, status: 200 });
    }catch(error){
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to get dashboard" });
    }
}