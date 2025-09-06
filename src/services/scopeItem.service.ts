import prisma from "../lib/prisma";
import {
    CreateScopeItemInput,
    GetScopeItemsInput,
    DeleteScopeItemInput,
    UpdateScopeItemInput,
} from "../lib/types/scopeItem";
import { ServiceError } from "../utils/service-error";
import { ServiceErrorCodes } from "../utils/service-error-codes";

export const createScopeItem = async ({ projectId, description, userId }: CreateScopeItemInput) => {
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
    });

    if (!project) {
        throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND, "Project not found or not owned by user");
    }

    return prisma.scopeItem.create({
        data: { description, projectId },
    });
};

export const getScopeItems = async ({ projectId, userId }: GetScopeItemsInput) => {
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
    });

    if (!project) {
        throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND, "Project not found or not owned by user");
    }

    return prisma.scopeItem.findMany({ where: { projectId } });
};

export const deleteScopeItem = async ({ projectId, id, userId }: DeleteScopeItemInput) => {
    // Ensure project belongs to user
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
    });

    if (!project) {
        throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND, "Project not found or not owned by user");
    }

    // Delete scope item only if it belongs to this project
    const deleted = await prisma.scopeItem.deleteMany({
        where: { id, projectId },
    });

    if (deleted.count === 0) {
        throw new ServiceError(ServiceErrorCodes.SCOPE_ITEM_NOT_FOUND, "Scope item not found");
    }

    return { id }; // return minimal response
};

// Update
export const updateScopeItem = async ({ projectId, id, userId, description }: UpdateScopeItemInput) => {
    // Ensure project belongs to user
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
    });

    if (!project) {
        throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND, "Project not found or not owned by user");
    }

    // Update scope item only if it belongs to this project
    const updated = await prisma.scopeItem.updateMany({
        where: { id, projectId },
        data: { description },
    });

    if (updated.count === 0) {
        throw new ServiceError(ServiceErrorCodes.SCOPE_ITEM_NOT_FOUND, "Scope item not found");
    }

    // Fetch the updated item to return it
    return prisma.scopeItem.findUnique({ where: { id } });
};
