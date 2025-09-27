import prisma from "../lib/prisma";
import {
    CreateScopeItemInput,
    GetScopeItemsInput,
    DeleteScopeItemInput,
    UpdateScopeItemInput,
} from "../lib/types/scopeItem";
import { ServiceError } from "../utils/service-error";
import { ServiceErrorCodes } from "../utils/service-error-codes";

export const createScopeItem = async ({ projectId, description, userId, name }: CreateScopeItemInput) => {
    return prisma.$transaction(async (tx) => {
        const project = await tx.project.findFirst({
            where: { id: projectId, userId },
        });

        if (!project) {
            throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND, "Project not found or not owned by user");
        }

        return tx.scopeItem.create({
            data: { description, projectId, name },
        });
    });
};

export const getScopeItems = async ({ projectId, userId }: GetScopeItemsInput) => {
    return prisma.$transaction(async (tx) => {
        const project = await tx.project.findFirst({
            where: { id: projectId, userId },
        });

        if (!project) {
            throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND, "Project not found or not owned by user");
        }

        return tx.scopeItem.findMany({ where: { projectId } });
    });
};

export const deleteScopeItem = async ({ projectId, id, userId }: DeleteScopeItemInput) => {
    return prisma.$transaction(async (tx) => {
        // Ensure project belongs to user
        const project = await tx.project.findFirst({
            where: { id: projectId, userId },
        });

        if (!project) {
            throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND, "Project not found or not owned by user");
        }

        // Delete scope item only if it belongs to this project
        const deleted = await tx.scopeItem.deleteMany({
            where: { id, projectId },
        });

        if (deleted.count === 0) {
            throw new ServiceError(ServiceErrorCodes.SCOPE_ITEM_NOT_FOUND, "Scope item not found");
        }

        return { id }; // return minimal response
    });
};

// Update
export const updateScopeItem = async ({ projectId, id, userId, description, name, status }: UpdateScopeItemInput) => {
    return prisma.$transaction(async (tx) => {
        // Ensure project belongs to user
        const project = await tx.project.findFirst({
            where: { id: projectId, userId },
        });

        if (!project) {
            throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND, "Project not found or not owned by user");
        }

        // Update scope item only if it belongs to this project
        const updated = await tx.scopeItem.updateMany({
            where: { id, projectId },
            data: { description, name, status },
        });

        if (updated.count === 0) {
            throw new ServiceError(ServiceErrorCodes.SCOPE_ITEM_NOT_FOUND, "Scope item not found");
        }

        // Fetch the updated item to return it
        return tx.scopeItem.findUnique({ where: { id } });
    });
};
