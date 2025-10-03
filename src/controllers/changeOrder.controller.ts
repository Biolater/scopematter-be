import { Request, Response } from "express";
import { sendSuccess } from "../utils/response";
import { handleServiceError } from "../utils/error-mapper";
import { CreateChangeOrderSchema, UpdateChangeOrderSchema } from "../validation/changeOrder.schema";
import { createChangeOrder, getChangeOrders, getChangeOrder, updateChangeOrder, deleteChangeOrder, exportChangeOrder } from "../services/changeOrder.service";
import PDFDocument from "pdfkit";
import path from "path";

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

export const exportChangeOrderController = async (
    req: Request<{ projectId: string; id: string }>,
    res: Response
) => {
    try {
        const { projectId, id } = req.params;
        const { changeOrder, project } = await exportChangeOrder({
            projectId,
            id,
            userId: req.user.id,
        });

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=change-order-${id}.pdf`
        );
        doc.pipe(res);

        // Watermark (brand logo) - drawn first so content sits on top
        const logoPath = path.join(process.cwd(), "public", "scopematter-brand.png");
        try {
            doc.save();
            doc.opacity(0.12);
            const pageWidth = doc.page.width;
            const pageHeight = doc.page.height;
            const watermarkSize = Math.min(pageWidth, pageHeight) * 0.6;
            const watermarkX = (pageWidth - watermarkSize) / 2;
            const watermarkY = (pageHeight - watermarkSize) / 2;
            doc.image(logoPath, watermarkX, watermarkY, { width: watermarkSize });
            doc.restore();
        } catch (_) {
            // Ignore missing logo errors; continue generating the PDF
        }

        // Title
        doc
            .fontSize(20)
            .font("Helvetica-Bold")
            .text("Change Order", { align: "center" })
            .moveDown(0.75);

        // Separator under title
        doc
            .strokeColor("#E5E7EB")
            .lineWidth(1)
            .moveTo(doc.page.margins.left, doc.y)
            .lineTo(doc.page.width - doc.page.margins.right, doc.y)
            .stroke();
        doc.moveDown(1);

        // Project / Client Info
        doc.fontSize(14).font("Helvetica-Bold").text("Project Details");
        doc.moveDown(0.5);

        doc.font("Helvetica-Bold").text("Project: ", { continued: true });
        doc.font("Helvetica").text(project.name);

        doc.font("Helvetica-Bold").text("Client: ", { continued: true });
        doc.font("Helvetica").text(project.client.name);

        if (project.client.company) {
            doc.font("Helvetica-Bold").text("Company: ", { continued: true });
            doc.font("Helvetica").text(project.client.company);
        }

        if (project.client.email) {
            doc.font("Helvetica-Bold").text("Email: ", { continued: true });
            doc.font("Helvetica").text(project.client.email);
        }

        doc.moveDown(1.5);

        // Change Order Info
        doc.fontSize(14).font("Helvetica-Bold").text("Change Order Details");
        doc.moveDown(0.5);

        doc.font("Helvetica-Bold").text("Request: ", { continued: true });
        doc
            .font("Helvetica")
            .text(changeOrder.request?.description ?? "N/A");

        doc.font("Helvetica-Bold").text("Price: ", { continued: true });
        doc
            .font("Helvetica")
            .text(`$${changeOrder.priceUsd.toString()}`);

        if (changeOrder.extraDays) {
            doc.font("Helvetica-Bold").text("Extra Days: ", { continued: true });
            doc.font("Helvetica").text(`${changeOrder.extraDays}`);
        }

        doc.font("Helvetica-Bold").text("Status: ", { continued: true });
        doc.font("Helvetica").text(changeOrder.status);

        doc.font("Helvetica-Bold").text("Created: ", { continued: true });
        doc
            .font("Helvetica")
            .text(changeOrder.createdAt.toDateString());

        // Footer / Branding
        doc.moveDown(3);
        doc
            .fontSize(10)
            .fillColor("gray")
            .text(
                "Generated by ScopeMatter • Protect your time, get paid for your work",
                { align: "center" }
            );

        doc.end();
    } catch (error) {
        return handleServiceError({
            res,
            e: error,
            fallbackMsg: "Failed to export change order",
        });
    }
};