import { CreateProjectInput, DeleteProjectInput, GetProjectInput, GetProjectsInput, UpdateProjectInput, ProjectUpdateData, ClientUpdateData } from "../lib/types/project";
import prisma from "../lib/prisma";
import { ServiceError } from "../utils/service-error";
import { ServiceErrorCodes } from "../utils/service-error-codes";
import { redis } from "../lib/redis";
import { invalidateDashboardCache } from "../lib/cache";

export const createProject = async (data: CreateProjectInput) => {
    const project = await prisma.$transaction(async (tx) => {
        const client = await tx.client.create({
            data: {
                name: data.client.name,
                email: data.client.email,
                company: data.client.company,
            },
        });

        return tx.project.create({
            data: {
                name: data.name,
                description: data.description,
                userId: data.userId,
                clientId: client.id,
            },
        });
    });

    await Promise.all([
        redis.del(`projects:${data.userId}`),  // project list
        redis.del(`project:${project.id}`),   // single project
        invalidateDashboardCache(data.userId),
    ]);

    return project;
};


export const getProjects = async ({ userId }: GetProjectsInput) => {
    const cacheKey = `projects:${userId}`;
    const cachedProjects = await redis.get(cacheKey);
    if (cachedProjects) {
        return cachedProjects;
    }
    const projects = await prisma.project.findMany({
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
    await redis.set(cacheKey, projects, {
        ex: 60 * 60 * 24, // 24 hours
    });
    return projects;
};

export const getProject = async ({ id, userId }: GetProjectInput) => {
    const cacheKey = `project:${id}`;
    const cachedProject = await redis.get(cacheKey);
    if (cachedProject) {
        return cachedProject;
    }
    const project = await prisma.project.findFirst({
        where: { id, userId },
        include: {
            client: {
                select: { id: true, name: true, email: true, company: true }
            },
            scopeItems: {
                select: { id: true, description: true, createdAt: true, name: true, status: true },
                orderBy: [
                    { createdAt: "desc" },
                    { id: "desc" },
                ],
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
                },
                orderBy: [
                    { createdAt: "desc" },
                    { id: "desc" },
                ],
            },
            changeOrders: {
                select: {
                    id: true,
                    request: {
                        select: {
                            id: true,
                            description: true,
                            status: true,
                            createdAt: true,
                        }
                    },
                    priceUsd: true,
                    extraDays: true,
                    status: true,
                    createdAt: true
                },
                orderBy: [
                    { createdAt: "desc" },
                    { id: "desc" },
                ],
            },
            _count: {
                select: {
                    scopeItems: true,
                    requests: true,
                    changeOrders: true,
                }
            }
        },
    });

    if (!project) {
        throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND);
    }
    await redis.set(cacheKey, project, {
        ex: 60 * 60 * 24, // 24 hours
    });

    return project;
};

export const deleteProject = async ({ id, userId }: DeleteProjectInput) => {
    // 1. Verify project exists
    const project = await prisma.project.findFirst({
        where: { id, userId },
    });
    if (!project) {
        throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND);
    }

    // 2. Delete from DB
    const deletedProject = await prisma.project.delete({
        where: { id },
    });

    // 3. Invalidate caches
    await Promise.all([
        redis.del(`project:${id}`),
        redis.del(`projects:${userId}`),
        redis.del(`share-links:${id}`),
        invalidateDashboardCache(userId),
    ]);

    return deletedProject;
};

export const updateProject = async ({ id, userId, data }: UpdateProjectInput) => {
    const updatedProject = await prisma.$transaction(async (tx) => {
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

        if (data.status !== undefined) {
            projectUpdateData.status = data.status;
        }

        // Update project
        const projectUpdate = await tx.project.update({
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

        return projectUpdate;
    });

    await Promise.all([
        redis.del(`project:${id}`),
        redis.del(`projects:${userId}`),
        invalidateDashboardCache(userId),
    ]);

    return updatedProject;
};