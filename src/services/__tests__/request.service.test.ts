import { createRequest, getRequests, updateRequest } from "../request.service";
import { mockPrisma } from "../../__tests__/setup";
import { ServiceError } from "../../utils/service-error";
import { ServiceErrorCodes } from "../../utils/service-error-codes";
import { RequestStatus } from "@prisma/client";

describe("request.service", () => {
    const projectId = "proj_123";
    const userId = "user_456";
    const requestId = "req_789";
    const now = new Date();

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
    });

    // ---------------------------
    // createRequest
    // ---------------------------
    describe("createRequest", () => {
        it("creates a request when project belongs to user", async () => {
            const created = {
                id: requestId,
                projectId,
                description: "Add newsletter popup",
                status: RequestStatus.PENDING,
                createdAt: now,
                updatedAt: now,
            };

            mockPrisma.project.findFirst.mockResolvedValue({ 
                id: projectId, 
                userId, 
                name: 'Test Project',
                description: 'Test Description',
                clientId: 'client123',
                createdAt: now,
                updatedAt: now
            });
            mockPrisma.request.create.mockResolvedValue(created);

            const result = await createRequest({
                projectId,
                description: created.description,
                userId,
            });

            expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
                where: { id: projectId, userId },
            });
            expect(mockPrisma.request.create).toHaveBeenCalledWith({
                data: { projectId, description: created.description, status: "PENDING" },
            });
            expect(result).toEqual(created);
        });

        it("throws PROJECT_NOT_FOUND when project missing or not owned", async () => {
            mockPrisma.project.findFirst.mockResolvedValue(null);

            await expect(
                createRequest({ projectId, description: "New req", userId }),
            ).rejects.toThrow(ServiceError);

            await expect(
                createRequest({ projectId, description: "New req", userId }),
            ).rejects.toHaveProperty("code", ServiceErrorCodes.PROJECT_NOT_FOUND);

            expect(mockPrisma.request.create).not.toHaveBeenCalled();
        });
    });

    // ---------------------------
    // getRequests
    // ---------------------------
    describe("getRequests", () => {
        it("returns requests for owned project", async () => {
            const requests = [
                {
                    id: "r1",
                    projectId,
                    description: "Do A",
                    status: RequestStatus.IN_SCOPE,
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    id: "r2",
                    projectId,
                    description: "Do B",
                    status: RequestStatus.OUT_OF_SCOPE,
                    createdAt: now,
                    updatedAt: now,
                },
            ];

            mockPrisma.project.findFirst.mockResolvedValue({ 
                id: projectId, 
                userId, 
                name: 'Test Project',
                description: 'Test Description',
                clientId: 'client123',
                createdAt: now,
                updatedAt: now
            });
            mockPrisma.request.findMany.mockResolvedValue(requests);

            const result = await getRequests({ projectId, userId });

            expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
                where: { id: projectId, userId },
            });
            expect(mockPrisma.request.findMany).toHaveBeenCalledWith({
                where: { projectId },
                orderBy: { createdAt: "desc" },
            });
            expect(result).toEqual(requests);
        });

        it("returns empty array when no requests exist", async () => {
            mockPrisma.project.findFirst.mockResolvedValue({ 
                id: projectId, 
                userId, 
                name: 'Test Project',
                description: 'Test Description',
                clientId: 'client123',
                createdAt: now,
                updatedAt: now
            });
            mockPrisma.request.findMany.mockResolvedValue([]);

            const result = await getRequests({ projectId, userId });

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });

        it("throws PROJECT_NOT_FOUND if project is not owned", async () => {
            mockPrisma.project.findFirst.mockResolvedValue(null);

            await expect(getRequests({ projectId, userId })).rejects.toThrow(
                ServiceError,
            );
            await expect(getRequests({ projectId, userId })).rejects.toHaveProperty(
                "code",
                ServiceErrorCodes.PROJECT_NOT_FOUND,
            );

            expect(mockPrisma.request.findMany).not.toHaveBeenCalled();
        });
    });

    // ---------------------------
    // updateRequest
    // ---------------------------
    describe("updateRequest", () => {
        const existingRequest = {
            id: requestId,
            projectId,
            description: "Old description",
            status: RequestStatus.PENDING,
            createdAt: now,
            updatedAt: now,
        };

        it("updates request description", async () => {
            const updated = { ...existingRequest, description: "New description" };

            mockPrisma.request.findFirst.mockResolvedValue(existingRequest);
            mockPrisma.request.update.mockResolvedValue(updated);

            const result = await updateRequest({
                id: requestId,
                userId,
                data: { description: "New description" },
            });

            expect(mockPrisma.request.findFirst).toHaveBeenCalledWith({
                where: { id: requestId, project: { userId } },
            });
            expect(mockPrisma.request.update).toHaveBeenCalledWith({
                where: { id: requestId },
                data: { description: "New description" },
            });
            expect(result.description).toBe("New description");
        });

        it("updates request status", async () => {
            const updated = { ...existingRequest, status: RequestStatus.OUT_OF_SCOPE };

            mockPrisma.request.findFirst.mockResolvedValue(existingRequest);
            mockPrisma.request.update.mockResolvedValue(updated);

            const result = await updateRequest({
                id: requestId,
                userId,
                data: { status: RequestStatus.OUT_OF_SCOPE },
            });

            expect(mockPrisma.request.update).toHaveBeenCalledWith({
                where: { id: requestId },
                data: { status: RequestStatus.OUT_OF_SCOPE },
            });
            expect(result.status).toBe(RequestStatus.OUT_OF_SCOPE);
        });

        it("handles partial updates (only one field)", async () => {
            const updated = {
                ...existingRequest,
                description: "Changed",
                status: RequestStatus.PENDING,
            };

            mockPrisma.request.findFirst.mockResolvedValue(existingRequest);
            mockPrisma.request.update.mockResolvedValue(updated);

            const result = await updateRequest({
                id: requestId,
                userId,
                data: { description: "Changed" },
            });

            expect(result.description).toBe("Changed");
            expect(result.status).toBe(RequestStatus.PENDING); // unchanged
        });

        it("throws REQUEST_NOT_FOUND when not owned or missing", async () => {
            mockPrisma.request.findFirst.mockResolvedValue(null);

            await expect(
                updateRequest({ id: requestId, userId, data: { description: "X" } }),
            ).rejects.toThrow(ServiceError);

            await expect(
                updateRequest({ id: requestId, userId, data: { description: "X" } }),
            ).rejects.toHaveProperty("code", ServiceErrorCodes.REQUEST_NOT_FOUND);

            expect(mockPrisma.request.update).not.toHaveBeenCalled();
        });

        it("filters out undefined fields from update", async () => {
            const updated = { ...existingRequest, description: "Cleaned" };
          
            mockPrisma.request.findFirst.mockResolvedValue(existingRequest);
            mockPrisma.request.update.mockResolvedValue(updated);
          
            const result = await updateRequest({
              id: requestId,
              userId,
              data: { description: "Cleaned", status: undefined as any },
            });
          
            // Inspect the actual call
            const call = mockPrisma.request.update.mock.calls[0][0] as any;
          
            expect(call.data).toEqual({ description: "Cleaned" }); // strict equality
            expect(call.data).not.toHaveProperty("status"); // must not exist
          
            expect(result.description).toBe("Cleaned");
          });
          
    });
});
