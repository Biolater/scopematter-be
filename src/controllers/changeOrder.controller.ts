import { Request, Response } from "express";
import { sendSuccess } from "../utils/response";
import { handleServiceError } from "../utils/error-mapper";
import { CreateChangeOrderSchema, UpdateChangeOrderSchema } from "../validation/changeOrder.schema";
import { createChangeOrder, getChangeOrders, getChangeOrder, updateChangeOrder, deleteChangeOrder, exportChangeOrder } from "../services/changeOrder.service";
import PDFDocument from "pdfkit";

export const createChangeOrderController = async (req: Request<{ projectId: string }, {}, CreateChangeOrderSchema>, res: Response) => {
    try {
        const { projectId } = req.params;
        const { requestId, priceUsd, extraDays } = req.body;
        const changeOrder = await createChangeOrder({ projectId, requestId, priceUsd, extraDays, userId: req.user.id });
        return sendSuccess({ res, data: changeOrder, status: 201 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to create change order" });
    }
}

export const getChangeOrdersController = async (req: Request<{ projectId: string }>, res: Response) => {
    try {
        const { projectId } = req.params;
        const changeOrders = await getChangeOrders({ projectId, userId: req.user.id });
        return sendSuccess({ res, data: changeOrders, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to get change orders" });
    }
}

export const getChangeOrderController = async (req: Request<{ projectId: string, id: string }>, res: Response) => {
    try {
        const { projectId, id } = req.params;
        const changeOrder = await getChangeOrder({ projectId, id, userId: req.user.id });
        return sendSuccess({ res, data: changeOrder, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to get change order" });
    }
}

export const updateChangeOrderController = async (req: Request<{ projectId: string, id: string }, {}, UpdateChangeOrderSchema>, res: Response) => {
    try {
        const { projectId, id } = req.params;
        const { priceUsd, extraDays, status } = req.body;
        const changeOrder = await updateChangeOrder({ projectId, id, priceUsd, extraDays, status, userId: req.user.id });
        return sendSuccess({ res, data: changeOrder, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to update change order" });
    }
}

export const deleteChangeOrderController = async (req: Request<{ projectId: string, id: string }>, res: Response) => {
    try {
        const { projectId, id } = req.params;
        const changeOrder = await deleteChangeOrder({ projectId, id, userId: req.user.id });
        return sendSuccess({ res, data: changeOrder, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to delete change order" });
    }
}

export const exportChangeOrderController = async (req: Request<{ projectId: string, id: string }>, res: Response) => {
    try {
        const { projectId, id } = req.params;
        const { changeOrder, project } = await exportChangeOrder({ projectId, id, userId: req.user.id });
        const doc = new PDFDocument();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=change-order-${id}.pdf`
        );
        doc.pipe(res);

        doc.fontSize(18).text("Change Order", { align: "center" }).moveDown();
        doc.fontSize(12).text(`Project: ${project.name}`);
        doc.text(`Client: ${project.client.name}`);
        if (project.client.company) doc.text(`Company: ${project.client.company}`);
        if (project.client.email) doc.text(`Email: ${project.client.email}`);
        doc.moveDown();

        doc.text(`Request: ${changeOrder.request?.description ?? "N/A"}`);
        doc.text(`Price: $${changeOrder.priceUsd}`);
        if (changeOrder.extraDays) doc.text(`Extra Days: ${changeOrder.extraDays}`);
        doc.text(`Status: ${changeOrder.status}`);
        doc.text(`Created: ${changeOrder.createdAt.toDateString()}`);

        doc.end();

    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to export change order" });
    }
}