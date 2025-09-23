import { CreateProjectInput, DeleteProjectInput, GetProjectInput, GetProjectsInput, UpdateProjectInput, ProjectUpdateData, ClientUpdateData } from "../lib/types/project";
import prisma from "../lib/prisma";
import { ServiceError } from "../utils/service-error";
import { ServiceErrorCodes } from "../utils/service-error-codes";

export const createProject = async (data: CreateProjectInput) => {
    return prisma.$transaction(async (tx) => {
        const client = await tx.client.create({
            data: {
                name: data.client.name,
                email: data.client.email,
                company: data.client.company,
            },
        });

        return await tx.project.create({
            data: {
                name: data.name,
                description: data.description,
                userId: data.userId,
                clientId: client.id,
            },
        });
    });
};

export const getProjects = async ({ userId }: GetProjectsInput) => {
    return  prisma.project.findMany({
        where: { userId },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            _count: {
                select: {
                    scopeItems: true,
                    requests: true,
                    changeOrders: true,
                },
            }
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
};

export const getProject = async ({ id, userId }: GetProjectInput) => {
    const project = await prisma.project.findFirst({
        where: { id, userId },
        include: {
            client: {
                select: { id: true, name: true, email: true, company: true }
            },
            scopeItems: {
                select: { id: true, description: true, createdAt: true }
            },
            requests: {
                select: {
                    id: true,
                    description: true,
                    status: true,
                    createdAt: true,
                    changeOrder: {
                        select: { id: true, priceUsd: true, extraDays: true, status: true }
                    }
                }
            },
            changeOrders: {
                select: {
                    id: true,
                    priceUsd: true,
                    extraDays: true,
                    status: true,
                    createdAt: true
                }
            }
        },
    });

    if (!project) {
        throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND);
    }

    return project;
};

export const deleteProject = async ({ id, userId }: DeleteProjectInput) => {
    const project = await prisma.project.findFirst({
        where: { id, userId },
    });
    if (!project) {
        throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND);
    }
    return await prisma.project.delete({
        where: { id },
    });
};

export const updateProject = async ({ id, userId, data }: UpdateProjectInput) => {
    return await prisma.$transaction(async (tx) => {
        // Check project exists and belongs to user
        const project = await tx.project.findFirst({
            where: { id, userId },
            include: { client: true },
        });
        
        if (!project) {
            throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND);
        }

        // Prepare update data - only include defined fields
        const projectUpdateData: ProjectUpdateData = {};
        if (data.name !== undefined) {
            projectUpdateData.name = data.name || undefined;
        }
        if (data.description !== undefined) {
            projectUpdateData.description = data.description || undefined;
        }

        // Update project
        const updatedProject = await tx.project.update({
            where: { id },
            data: projectUpdateData,
        });

        // Update client if client data provided
        if (data.client) {
            const clientUpdateData: ClientUpdateData = {};
            if (data.client.name !== undefined) {
                clientUpdateData.name = data.client.name || undefined;
            }
            if (data.client.email !== undefined) {
                clientUpdateData.email = data.client.email || undefined;
            }
            if (data.client.company !== undefined) {
                clientUpdateData.company = data.client.company || undefined;
            }

            if (Object.keys(clientUpdateData).length > 0) {
                await tx.client.update({
                    where: { id: project.client.id },
                    data: clientUpdateData,
                });
            }
        }

        return updatedProject;
    });
};