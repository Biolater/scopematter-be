import prisma from "../lib/prisma";
import { ServiceError } from "../utils/service-error";
import { ServiceErrorCodes } from "../utils/service-error-codes";
import { CreateChangeOrderInput, GetChangeOrdersInput, GetChangeOrderInput, UpdateChangeOrderInput, DeleteChangeOrderInput, ExportChangeOrderInput } from "../lib/types/changeOrder";
import { ChangeOrderStatus, RequestStatus } from "@prisma/client";
import { invalidateDashboardCache } from "../lib/cache";
import { redis } from "../lib/redis";

export const createChangeOrder = async ({ projectId, requestId, priceUsd, extraDays, userId }: CreateChangeOrderInput) => {
    const changeOrder = await prisma.$transaction(async (tx) => {
        // Ensure request belongs to project and is OUT_OF_SCOPE
        const request = await tx.request.findFirst({
            where: {
                id: requestId,
                status: RequestStatus.OUT_OF_SCOPE,
                changeOrder: null,
                project: { id: projectId, userId },
            },
        });


        if (!request) {
            throw new ServiceError(ServiceErrorCodes.REQUEST_NOT_ELIGIBLE);
        }

        return tx.changeOrder.create({
            data: {
                requestId,
                projectId,
                userId,
                priceUsd,
                extraDays,
                status: ChangeOrderStatus.PENDING,
            }
        });
    });

    await Promise.all([
        redis.del(`project:${projectId}`),
        invalidateDashboardCache(userId),
    ]);

    return changeOrder;
};

export const getChangeOrders = async ({ projectId, userId }: GetChangeOrdersInput) => {
    return prisma.$transaction(async (tx) => {
        // Ensure project belongs to user
        const project = await tx.project.findFirst({
            where: {
                id: projectId,
                userId,
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        company: true,
                    },
                }
            }
        })
        if (!project) {
            throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND);
        }

        // Get change orders for project
        return tx.changeOrder.findMany({
            where: {
                projectId,
                userId,
            },
            include: {
                request: {
                    select: {
                        id: true,
                        description: true,
                        status: true,
                    },
                },

            },
            orderBy: {
                createdAt: "desc"
            }
        })
    })

}

export const getChangeOrder = async ({ projectId, id, userId }: GetChangeOrderInput) => {
    return prisma.$transaction(async (tx) => {
        // Ensure project belongs to user
        const project = await tx.project.findFirst({
            where: { id: projectId, userId },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        company: true,
                    },
                },
            },
        });

        if (!project) {
            throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND);
        }

        // Get change order for project
        const changeOrder = await tx.changeOrder.findFirst({
            where: { id, projectId, userId },
            include: {
                request: {
                    select: {
                        id: true,
                        description: true,
                        status: true,
                    },
                },
            },
        });

        if (!changeOrder) {
            throw new ServiceError(ServiceErrorCodes.CHANGE_ORDER_NOT_FOUND);
        }

        return changeOrder;
    });
};

export const updateChangeOrder = async ({
    projectId,
    id,
    priceUsd,
    extraDays,
    status,
    userId,
}: UpdateChangeOrderInput) => {
    const changeOrder = await prisma.$transaction(async (tx) => {
        // Ensure project belongs to user
        const project = await tx.project.findFirst({
            where: { id: projectId, userId },
        });
        if (!project) {
            throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND);
        }

        // Ensure change order belongs to project and user
        const changeOrder = await tx.changeOrder.findFirst({
            where: { id, projectId, userId },
        });
        if (!changeOrder) {
            throw new ServiceError(ServiceErrorCodes.CHANGE_ORDER_NOT_FOUND);
        }

        // Ensure change order is pending before editing
        if (changeOrder.status !== ChangeOrderStatus.PENDING) {
            throw new ServiceError(ServiceErrorCodes.INVALID_STATUS_UPDATE);
        }

        // Validate status transition if status is being updated
        if (status) {
            const validTransitions: Record<ChangeOrderStatus, ChangeOrderStatus[]> = {
                PENDING: [ChangeOrderStatus.PENDING, ChangeOrderStatus.APPROVED, ChangeOrderStatus.REJECTED],
                APPROVED: [],
                REJECTED: [],
            };

            if (!validTransitions[changeOrder.status].includes(status)) {
                throw new ServiceError(ServiceErrorCodes.INVALID_STATUS_UPDATE);
            }
        }

        // Filter out undefined fields
        const cleanData = Object.fromEntries(
            Object.entries({ priceUsd, extraDays, status }).filter(([_, v]) => v !== undefined)
        );

        // Update change order
        return tx.changeOrder.update({
            where: { id, projectId },
            data: { ...cleanData },
            include: {
                request: {
                    select: {
                        id: true,
                        description: true,
                        status: true,
                    },
                },
            },
        });
    });

    await Promise.all([
        redis.del(`project:${projectId}`),
        invalidateDashboardCache(userId),
    ]);

    return changeOrder;
};

export const deleteChangeOrder = async ({ projectId, id, userId }: DeleteChangeOrderInput) => {
    const changeOrder = await prisma.$transaction(async (tx) => {
        // Ensure project belongs to user
        const project = await tx.project.findFirst({
            where: { id: projectId, userId },
        });
        if (!project) {
            throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND);
        }
        const changeOrder = await tx.changeOrder.findFirst({
            where: { id, projectId, userId },
        });
        if (!changeOrder) {
            throw new ServiceError(ServiceErrorCodes.CHANGE_ORDER_NOT_FOUND);
        }
        if (changeOrder.status !== ChangeOrderStatus.PENDING) {
            throw new ServiceError(ServiceErrorCodes.INVALID_STATUS_UPDATE);
        }
        return tx.changeOrder.delete({
            where: { id },
        });
    });

    await Promise.all([
        redis.del(`project:${projectId}`),
        invalidateDashboardCache(userId),
    ]);

    return changeOrder;
};

export const exportChangeOrder = async ({ projectId, id, userId }: ExportChangeOrderInput) => {
    return prisma.$transaction(async (tx) => {
        // Ensure project belongs to user and include client + the specific change order
        const project = await tx.project.findFirst({
            where: { id: projectId, userId },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        company: true,
                        email: true,
                    },
                },
                changeOrders: {
                    where: { id },
                    include: {
                        request: {
                            select: {
                                id: true,
                                description: true,
                            },
                        },
                    },
                },
            },
        });

        if (!project) {
            throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND);
        }

        const changeOrder = project.changeOrders[0];
        if (!changeOrder) {
            throw new ServiceError(ServiceErrorCodes.CHANGE_ORDER_NOT_FOUND);
        }

        return { project, changeOrder };
    });
};
