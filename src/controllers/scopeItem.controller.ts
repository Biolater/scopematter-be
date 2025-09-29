import { Request, Response } from "express";
import { sendSuccess } from "../utils/response";
import { handleServiceError } from "../utils/error-mapper";
import { createScopeItem, deleteScopeItem, exportScopeItems, getScopeItems, updateScopeItem } from "../services/scopeItem.service";
import { CreateScopeItemSchema, DeleteScopeItemSchema, UpdateScopeItemSchema } from "../validation/scopeItem.schema";
import PDFDocument  from "pdfkit";

export const createScopeItemController = async (req: Request<{ projectId: string }, {}, CreateScopeItemSchema>, res: Response) => {
    try {
        const { description, name } = req.body;
        const { projectId } = req.params;
        const scopeItem = await createScopeItem({
            projectId,
            description,
            userId: req.user.id,
            name: req.body.name,
        });
        return sendSuccess({ res, data: scopeItem, status: 201 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to create scope item" });
    }
}

export const getScopeItemsController = async (req: Request<{ projectId: string }>, res: Response) => {
    try {
        const { projectId } = req.params;
        const scopeItems = await getScopeItems({ projectId, userId: req.user.id });
        return sendSuccess({ res, data: scopeItems, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to get scope items" });
    }
}

export const deleteScopeItemController = async (req: Request<{ projectId: string, id: string }, {}, DeleteScopeItemSchema>, res: Response) => {
    try {
        const { projectId, id } = req.params;
        const scopeItem = await deleteScopeItem({ projectId, id, userId: req.user.id });
        return sendSuccess({ res, data: scopeItem, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to delete scope item" });
    }
}

export const updateScopeItemController = async (req: Request<{ projectId: string, id: string }, {}, UpdateScopeItemSchema>, res: Response) => {
    try {
        const { projectId, id } = req.params;
        const { description, name, status } = req.body;
        const scopeItem = await updateScopeItem({ projectId, id, userId: req.user.id, description, name, status });
        return sendSuccess({ res, data: scopeItem, status: 200 });
    } catch (error) {
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to update scope item" });
    }
}


export const exportScopeItemsController = async (req: Request<{ projectId: string }>, res: Response) => {
    try {
        const { projectId } = req.params;
        const project = await exportScopeItems({
            projectId,
            userId: req.user.id,
        });

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=project-${projectId}-scope.pdf`
        );

        doc.pipe(res);

        // Title
        doc
            .fontSize(20)
            .font("Helvetica-Bold")
            .text("Project Scope Agreement", {
                align: "center",
                underline: true,
            })
            .moveDown(2);

        // Project + Client Info
        doc.fontSize(14).font("Helvetica-Bold").text("Project Details", {
            underline: true,
        });
        doc.moveDown(0.5);

        doc.font("Helvetica-Bold").text("Project: ", { continued: true });
        doc.font("Helvetica").text(project.name);

        if (project.description) {
            doc.font("Helvetica-Bold").text("Description: ", { continued: true });
            doc.font("Helvetica").text(project.description);
        }

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

        // Scope Items
        doc.fontSize(14).font("Helvetica-Bold").text("Scope Items", {
            underline: true,
        });
        doc.moveDown(0.5);

        if (project.scopeItems.length === 0) {
            doc.font("Helvetica").text("No scope items defined.", { indent: 20 });
        } else {
            project.scopeItems.forEach((item, idx) => {
                doc
                    .font("Helvetica-Bold")
                    .text(`${idx + 1}. ${item.name}`, { indent: 20 });
                doc
                    .font("Helvetica")
                    .text(item.description, { indent: 40 })
                    .moveDown(0.5);
            });
        }

        // Footer
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
        return handleServiceError({ res, e: error, fallbackMsg: "Failed to export scope items" });
    }
}