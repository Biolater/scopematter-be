import {
    createChangeOrder,
    getChangeOrders,
    getChangeOrder,
    updateChangeOrder,
} from '../changeOrder.service';
import { mockPrisma } from '../../__tests__/setup';
import { ServiceError } from '../../utils/service-error';
import { ServiceErrorCodes } from '../../utils/service-error-codes';
import { ChangeOrderStatus, RequestStatus, Project, Client, ChangeOrder, Request } from '@prisma/client';

// Test data interfaces
interface MockProject extends Omit<Project, 'client'> {
    client: Pick<Client, 'id' | 'name' | 'company'>;
}

interface MockRequest extends Omit<Request, 'changeOrder'> {
    changeOrder: { id: string } | null;
}

interface MockChangeOrder extends Omit<ChangeOrder, 'request'> {
    request: Pick<Request, 'id' | 'description' | 'status'>;
}

describe('changeOrder.service', () => {
    const projectId = 'proj_123';
    const userId = 'user_456';
    const requestId = 'req_789';
    const changeOrderId = 'co_101';
    const now = new Date();

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
    });

    // ---------------------------
    // createChangeOrder
    // ---------------------------
    describe('createChangeOrder', () => {
        const mockProject = {
            id: projectId,
            userId,
            name: 'Test Project',
            description: 'Test Description',
            clientId: 'client123',
            createdAt: now,
            updatedAt: now,
        };

        const mockEligibleRequest = {
            id: requestId,
            projectId,
            description: 'Out of scope request',
            status: RequestStatus.OUT_OF_SCOPE,
            changeOrder: null,
            createdAt: now,
            updatedAt: now,
        };

        const mockCreatedChangeOrder: ChangeOrder = {
            id: changeOrderId,
            requestId,
            projectId,
            userId,
            priceUsd: 500.00 as any, // Prisma Decimal type
            extraDays: 5,
            status: ChangeOrderStatus.PENDING,
            createdAt: now,
            updatedAt: now,
        };

        it('creates a change order when request is eligible', async () => {
            mockPrisma.request.findFirst.mockResolvedValue(mockEligibleRequest);
            mockPrisma.changeOrder.create.mockResolvedValue(mockCreatedChangeOrder);

            const result = await createChangeOrder({
                projectId,
                requestId,
                priceUsd: 500.00,
                extraDays: 5,
                userId,
            });

            expect(mockPrisma.request.findFirst).toHaveBeenCalledWith({
                where: {
                    id: requestId,
                    status: RequestStatus.OUT_OF_SCOPE,
                    changeOrder: null,
                    project: { id: projectId, userId },
                },
            });
            expect(mockPrisma.changeOrder.create).toHaveBeenCalledWith({
                data: {
                    requestId,
                    projectId,
                    userId,
                    priceUsd: 500.00,
                    extraDays: 5,
                    status: ChangeOrderStatus.PENDING,
                },
            });
            expect(result).toEqual(mockCreatedChangeOrder);
        });

        it('creates a change order without extraDays when not provided', async () => {
            const changeOrderWithoutExtraDays: ChangeOrder = {
                ...mockCreatedChangeOrder,
                extraDays: null,
            };

            mockPrisma.request.findFirst.mockResolvedValue(mockEligibleRequest);
            mockPrisma.changeOrder.create.mockResolvedValue(changeOrderWithoutExtraDays);

            const result = await createChangeOrder({
                projectId,
                requestId,
                priceUsd: 500.00,
                userId,
            });

            expect(mockPrisma.changeOrder.create).toHaveBeenCalledWith({
                data: {
                    requestId,
                    projectId,
                    userId,
                    priceUsd: 500.00,
                    extraDays: undefined,
                    status: ChangeOrderStatus.PENDING,
                },
            });
            expect(result).toEqual(changeOrderWithoutExtraDays);
        });

        it('throws REQUEST_NOT_ELIGIBLE when request is not found', async () => {
            mockPrisma.request.findFirst.mockResolvedValue(null);

            await expect(
                createChangeOrder({
                    projectId,
                    requestId,
                    priceUsd: 500.00,
                    extraDays: 5,
                    userId,
                }),
            ).rejects.toThrow(ServiceError);

            await expect(
                createChangeOrder({
                    projectId,
                    requestId,
                    priceUsd: 500.00,
                    extraDays: 5,
                    userId,
                }),
            ).rejects.toHaveProperty('code', ServiceErrorCodes.REQUEST_NOT_ELIGIBLE);

            expect(mockPrisma.changeOrder.create).not.toHaveBeenCalled();
        });

        it('throws REQUEST_NOT_ELIGIBLE when request is not OUT_OF_SCOPE', async () => {
            const inScopeRequest = {
                ...mockEligibleRequest,
                status: RequestStatus.IN_SCOPE,
            };

            mockPrisma.request.findFirst.mockResolvedValue(null);

            await expect(
                createChangeOrder({
                    projectId,
                    requestId,
                    priceUsd: 500.00,
                    extraDays: 5,
                    userId,
                }),
            ).rejects.toThrow(ServiceError);

            await expect(
                createChangeOrder({
                    projectId,
                    requestId,
                    priceUsd: 500.00,
                    extraDays: 5,
                    userId,
                }),
            ).rejects.toHaveProperty('code', ServiceErrorCodes.REQUEST_NOT_ELIGIBLE);
        });

        it('throws REQUEST_NOT_ELIGIBLE when request already has a change order', async () => {
            const requestWithChangeOrder = {
                ...mockEligibleRequest,
                changeOrder: { id: 'existing_co' },
            };

            mockPrisma.request.findFirst.mockResolvedValue(null);

            await expect(
                createChangeOrder({
                    projectId,
                    requestId,
                    priceUsd: 500.00,
                    extraDays: 5,
                    userId,
                }),
            ).rejects.toThrow(ServiceError);

            await expect(
                createChangeOrder({
                    projectId,
                    requestId,
                    priceUsd: 500.00,
                    extraDays: 5,
                    userId,
                }),
            ).rejects.toHaveProperty('code', ServiceErrorCodes.REQUEST_NOT_ELIGIBLE);
        });

        it('throws REQUEST_NOT_ELIGIBLE when request does not belong to project', async () => {
            mockPrisma.request.findFirst.mockResolvedValue(null);

            await expect(
                createChangeOrder({
                    projectId,
                    requestId,
                    priceUsd: 500.00,
                    extraDays: 5,
                    userId,
                }),
            ).rejects.toThrow(ServiceError);

            await expect(
                createChangeOrder({
                    projectId,
                    requestId,
                    priceUsd: 500.00,
                    extraDays: 5,
                    userId,
                }),
            ).rejects.toHaveProperty('code', ServiceErrorCodes.REQUEST_NOT_ELIGIBLE);
        });
    });

    // ---------------------------
    // getChangeOrders
    // ---------------------------
    describe('getChangeOrders', () => {
        const mockProject = {
            id: projectId,
            userId,
            name: 'Test Project',
            description: 'Test Description',
            clientId: 'client123',
            createdAt: now,
            updatedAt: now,
            client: {
                id: 'client123',
                name: 'Test Client',
                company: 'Test Company',
            },
        };

        const mockChangeOrders: MockChangeOrder[] = [
            {
                id: 'co_1',
                projectId,
                userId,
                requestId: 'req_1',
                priceUsd: 500.00 as any, // Prisma Decimal type
                extraDays: 5,
                status: ChangeOrderStatus.PENDING,
                createdAt: now,
                updatedAt: now,
                request: {
                    id: 'req_1',
                    description: 'Request 1',
                    status: RequestStatus.OUT_OF_SCOPE,
                },
            },
            {
                id: 'co_2',
                projectId,
                userId,
                requestId: 'req_2',
                priceUsd: 750.00 as any, // Prisma Decimal type
                extraDays: null,
                status: ChangeOrderStatus.APPROVED,
                createdAt: now,
                updatedAt: now,
                request: {
                    id: 'req_2',
                    description: 'Request 2',
                    status: RequestStatus.OUT_OF_SCOPE,
                },
            },
        ];

        it('returns change orders for owned project', async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.changeOrder.findMany.mockResolvedValue(mockChangeOrders);

            const result = await getChangeOrders({ projectId, userId });

            expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
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
            expect(mockPrisma.changeOrder.findMany).toHaveBeenCalledWith({
                where: { projectId, userId },
                include: {
                    request: {
                        select: {
                            id: true,
                            description: true,
                            status: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            expect(result).toEqual(mockChangeOrders);
        });

        it('returns empty array when no change orders exist', async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.changeOrder.findMany.mockResolvedValue([]);

            const result = await getChangeOrders({ projectId, userId });

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });

        it('throws PROJECT_NOT_FOUND when project is not owned', async () => {
            mockPrisma.project.findFirst.mockResolvedValue(null);

            await expect(getChangeOrders({ projectId, userId })).rejects.toThrow(
                ServiceError,
            );
            await expect(getChangeOrders({ projectId, userId })).rejects.toHaveProperty(
                'code',
                ServiceErrorCodes.PROJECT_NOT_FOUND,
            );

            expect(mockPrisma.changeOrder.findMany).not.toHaveBeenCalled();
        });
    });

    // ---------------------------
    // getChangeOrder
    // ---------------------------
    describe('getChangeOrder', () => {
        const mockProject = {
            id: projectId,
            userId,
            name: 'Test Project',
            description: 'Test Description',
            clientId: 'client123',
            createdAt: now,
            updatedAt: now,
            client: {
                id: 'client123',
                name: 'Test Client',
                company: 'Test Company',
            },
        };

        const mockChangeOrder: MockChangeOrder = {
            id: changeOrderId,
            projectId,
            userId,
            requestId,
            priceUsd: 500.00 as any, // Prisma Decimal type
            extraDays: 5,
            status: ChangeOrderStatus.PENDING,
            createdAt: now,
            updatedAt: now,
            request: {
                id: requestId,
                description: 'Test Request',
                status: RequestStatus.OUT_OF_SCOPE,
            },
        };

        it('returns change order when it belongs to owned project', async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.changeOrder.findFirst.mockResolvedValue(mockChangeOrder);

            const result = await getChangeOrder({ projectId, id: changeOrderId, userId });

            expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
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
            expect(mockPrisma.changeOrder.findFirst).toHaveBeenCalledWith({
                where: { id: changeOrderId, projectId, userId },
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
            expect(result).toEqual(mockChangeOrder);
        });

        it('throws PROJECT_NOT_FOUND when project is not owned', async () => {
            mockPrisma.project.findFirst.mockResolvedValue(null);

            await expect(
                getChangeOrder({ projectId, id: changeOrderId, userId }),
            ).rejects.toThrow(ServiceError);

            await expect(
                getChangeOrder({ projectId, id: changeOrderId, userId }),
            ).rejects.toHaveProperty('code', ServiceErrorCodes.PROJECT_NOT_FOUND);

            expect(mockPrisma.changeOrder.findFirst).not.toHaveBeenCalled();
        });

        it('throws CHANGE_ORDER_NOT_FOUND when change order does not exist', async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.changeOrder.findFirst.mockResolvedValue(null);

            await expect(
                getChangeOrder({ projectId, id: changeOrderId, userId }),
            ).rejects.toThrow(ServiceError);

            await expect(
                getChangeOrder({ projectId, id: changeOrderId, userId }),
            ).rejects.toHaveProperty('code', ServiceErrorCodes.CHANGE_ORDER_NOT_FOUND);
        });
    });

    // ---------------------------
    // updateChangeOrder
    // ---------------------------
    describe('updateChangeOrder', () => {
        const mockProject = {
            id: projectId,
            userId,
            name: 'Test Project',
            description: 'Test Description',
            clientId: 'client123',
            createdAt: now,
            updatedAt: now,
        };

        const mockPendingChangeOrder: ChangeOrder = {
            id: changeOrderId,
            projectId,
            userId,
            requestId,
            priceUsd: 500.00 as any, // Prisma Decimal type
            extraDays: 5,
            status: ChangeOrderStatus.PENDING,
            createdAt: now,
            updatedAt: now,
        };

        const mockUpdatedChangeOrder: ChangeOrder = {
            ...mockPendingChangeOrder,
            priceUsd: 750.00 as any, // Prisma Decimal type
            extraDays: 10,
            status: ChangeOrderStatus.APPROVED,
        };

        it('updates change order when it is pending', async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.changeOrder.findFirst.mockResolvedValue(mockPendingChangeOrder);
            mockPrisma.changeOrder.update.mockResolvedValue(mockUpdatedChangeOrder);

            const result = await updateChangeOrder({
                projectId,
                id: changeOrderId,
                priceUsd: 750.00,
                extraDays: 10,
                status: ChangeOrderStatus.APPROVED,
                userId,
            });

            expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
                where: { id: projectId, userId },
            });
            expect(mockPrisma.changeOrder.findFirst).toHaveBeenCalledWith({
                where: { id: changeOrderId, projectId, userId },
            });
            expect(mockPrisma.changeOrder.update).toHaveBeenCalledWith({
                where: { id: changeOrderId, projectId },
                data: {
                    priceUsd: 750.00,
                    extraDays: 10,
                    status: ChangeOrderStatus.APPROVED,
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
            });
            expect(result).toEqual(mockUpdatedChangeOrder);
        });

        it('handles partial updates (only priceUsd)', async () => {
            const partiallyUpdated: ChangeOrder = {
                ...mockPendingChangeOrder,
                priceUsd: 600.00 as any, // Prisma Decimal type
            };

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.changeOrder.findFirst.mockResolvedValue(mockPendingChangeOrder);
            mockPrisma.changeOrder.update.mockResolvedValue(partiallyUpdated);

            const result = await updateChangeOrder({
                projectId,
                id: changeOrderId,
                priceUsd: 600.00,
                extraDays: undefined,
                status: undefined,
                userId,
            });

            expect(mockPrisma.changeOrder.update).toHaveBeenCalledWith({
                where: { id: changeOrderId, projectId },
                data: { priceUsd: 600.00 },
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
            expect(result.priceUsd).toBe(600.00);
        });

        it('handles partial updates (only status)', async () => {
            const statusUpdated: ChangeOrder = {
                ...mockPendingChangeOrder,
                status: ChangeOrderStatus.REJECTED,
            };

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.changeOrder.findFirst.mockResolvedValue(mockPendingChangeOrder);
            mockPrisma.changeOrder.update.mockResolvedValue(statusUpdated);

            const result = await updateChangeOrder({
                projectId,
                id: changeOrderId,
                priceUsd: undefined,
                extraDays: undefined,
                status: ChangeOrderStatus.REJECTED,
                userId,
            });

            expect(mockPrisma.changeOrder.update).toHaveBeenCalledWith({
                where: { id: changeOrderId, projectId },
                data: { status: ChangeOrderStatus.REJECTED },
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
            expect(result.status).toBe(ChangeOrderStatus.REJECTED);
        });

        it('filters out undefined fields from update', async () => {
            const cleanedUpdate: ChangeOrder = {
                ...mockPendingChangeOrder,
                priceUsd: 800.00 as any, // Prisma Decimal type
            };

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.changeOrder.findFirst.mockResolvedValue(mockPendingChangeOrder);
            mockPrisma.changeOrder.update.mockResolvedValue(cleanedUpdate);

            const result = await updateChangeOrder({
                projectId,
                id: changeOrderId,
                priceUsd: 800.00,
                extraDays: undefined,
                status: undefined,
                userId,
            });

            // Inspect the actual call
            const call = mockPrisma.changeOrder.update.mock.calls[0][0] as any;

            expect(call.data).toEqual({ priceUsd: 800.00 });
            expect(call.data).not.toHaveProperty('extraDays');
            expect(call.data).not.toHaveProperty('status');

            expect(result.priceUsd).toBe(800.00);
        });

        it('throws PROJECT_NOT_FOUND when project is not owned', async () => {
            mockPrisma.project.findFirst.mockResolvedValue(null);

            await expect(
                updateChangeOrder({
                    projectId,
                    id: changeOrderId,
                    priceUsd: 600.00,
                    extraDays: 5,
                    status: ChangeOrderStatus.APPROVED,
                    userId,
                }),
            ).rejects.toThrow(ServiceError);

            await expect(
                updateChangeOrder({
                    projectId,
                    id: changeOrderId,
                    priceUsd: 600.00,
                    extraDays: 5,
                    status: ChangeOrderStatus.APPROVED,
                    userId,
                }),
            ).rejects.toHaveProperty('code', ServiceErrorCodes.PROJECT_NOT_FOUND);

            expect(mockPrisma.changeOrder.findFirst).not.toHaveBeenCalled();
            expect(mockPrisma.changeOrder.update).not.toHaveBeenCalled();
        });

        it('throws CHANGE_ORDER_NOT_FOUND when change order does not exist', async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.changeOrder.findFirst.mockResolvedValue(null);

            await expect(
                updateChangeOrder({
                    projectId,
                    id: changeOrderId,
                    priceUsd: 600.00,
                    extraDays: 5,
                    status: ChangeOrderStatus.APPROVED,
                    userId,
                }),
            ).rejects.toThrow(ServiceError);

            await expect(
                updateChangeOrder({
                    projectId,
                    id: changeOrderId,
                    priceUsd: 600.00,
                    extraDays: 5,
                    status: ChangeOrderStatus.APPROVED,
                    userId,
                }),
            ).rejects.toHaveProperty('code', ServiceErrorCodes.CHANGE_ORDER_NOT_FOUND);

            expect(mockPrisma.changeOrder.update).not.toHaveBeenCalled();
        });

        it('throws INVALID_STATUS_UPDATE when change order is not pending', async () => {
            const approvedChangeOrder: ChangeOrder = {
                ...mockPendingChangeOrder,
                status: ChangeOrderStatus.APPROVED,
            };

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.changeOrder.findFirst.mockResolvedValue(approvedChangeOrder);

            await expect(
                updateChangeOrder({
                    projectId,
                    id: changeOrderId,
                    priceUsd: 600.00,
                    extraDays: 5,
                    status: ChangeOrderStatus.APPROVED,
                    userId,
                }),
            ).rejects.toThrow(ServiceError);

            await expect(
                updateChangeOrder({
                    projectId,
                    id: changeOrderId,
                    priceUsd: 600.00,
                    extraDays: 5,
                    status: ChangeOrderStatus.APPROVED,
                    userId,
                }),
            ).rejects.toHaveProperty('code', ServiceErrorCodes.INVALID_STATUS_UPDATE);

            expect(mockPrisma.changeOrder.update).not.toHaveBeenCalled();
        });

        it('throws INVALID_STATUS_UPDATE when status transition is invalid', async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.changeOrder.findFirst.mockResolvedValue(mockPendingChangeOrder);

            // Try to transition from PENDING to PENDING (should be valid)
            const pendingResult: ChangeOrder = {
                ...mockPendingChangeOrder,
                status: ChangeOrderStatus.PENDING,
            };
            mockPrisma.changeOrder.update.mockResolvedValue(pendingResult);

            await updateChangeOrder({
                projectId,
                id: changeOrderId,
                priceUsd: undefined,
                extraDays: undefined,
                status: ChangeOrderStatus.PENDING,
                userId,
            });

            expect(mockPrisma.changeOrder.update).toHaveBeenCalled();

            // Try to transition from APPROVED to anything (should be invalid)
            const approvedChangeOrder: ChangeOrder = {
                ...mockPendingChangeOrder,
                status: ChangeOrderStatus.APPROVED,
            };

            mockPrisma.changeOrder.findFirst.mockResolvedValue(approvedChangeOrder);

            await expect(
                updateChangeOrder({
                    projectId,
                    id: changeOrderId,
                    priceUsd: undefined,
                    extraDays: undefined,
                    status: ChangeOrderStatus.PENDING,
                    userId,
                }),
            ).rejects.toThrow(ServiceError);

            await expect(
                updateChangeOrder({
                    projectId,
                    id: changeOrderId,
                    priceUsd: undefined,
                    extraDays: undefined,
                    status: ChangeOrderStatus.PENDING,
                    userId,
                }),
            ).rejects.toHaveProperty('code', ServiceErrorCodes.INVALID_STATUS_UPDATE);
        });

        it('allows valid status transitions from PENDING', async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.changeOrder.findFirst.mockResolvedValue(mockPendingChangeOrder);

            // Test APPROVED transition
            const approvedResult: ChangeOrder = {
                ...mockPendingChangeOrder,
                status: ChangeOrderStatus.APPROVED,
            };
            mockPrisma.changeOrder.update.mockResolvedValue(approvedResult);

            await updateChangeOrder({
                projectId,
                id: changeOrderId,
                priceUsd: undefined,
                extraDays: undefined,
                status: ChangeOrderStatus.APPROVED,
                userId,
            });

            expect(mockPrisma.changeOrder.update).toHaveBeenCalledWith({
                where: { id: changeOrderId, projectId },
                data: { status: ChangeOrderStatus.APPROVED },
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

            // Test REJECTED transition
            const rejectedResult: ChangeOrder = {
                ...mockPendingChangeOrder,
                status: ChangeOrderStatus.REJECTED,
            };
            mockPrisma.changeOrder.update.mockResolvedValue(rejectedResult);

            await updateChangeOrder({
                projectId,
                id: changeOrderId,
                priceUsd: undefined,
                extraDays: undefined,
                status: ChangeOrderStatus.REJECTED,
                userId,
            });

            expect(mockPrisma.changeOrder.update).toHaveBeenCalledWith({
                where: { id: changeOrderId, projectId },
                data: { status: ChangeOrderStatus.REJECTED },
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
    });
});


