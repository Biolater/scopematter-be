import { createRequest, getRequests, updateRequest, deleteRequest } from "../request.service";
import { mockPrisma } from "../../__tests__/setup";
import { ServiceError } from "../../utils/service-error";
import { ServiceErrorCodes } from "../../utils/service-error-codes";
import { RequestStatus, ProjectStatus } from "@prisma/client";

describe("request.service", () => {
    const projectId = "proj_123";
    const userId = "user_456";
    const requestId = "req_789";
    const now = new Date();

    const mockProject = { 
        id: projectId, 
        userId, 
        name: 'Test Project',
        description: 'Test Description',
        status: ProjectStatus.PENDING,
        clientId: 'client123',
        createdAt: now,
        updatedAt: now
    };

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

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
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

        it("creates request with minimal description", async () => {
            const created = {
                id: requestId,
                projectId,
                description: "A",
                status: RequestStatus.PENDING,
                createdAt: now,
                updatedAt: now,
            };

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.request.create.mockResolvedValue(created);

            const result = await createRequest({
                projectId,
                description: "A",
                userId,
            });

            expect(mockPrisma.request.create).toHaveBeenCalledWith({
                data: { projectId, description: "A", status: "PENDING" },
            });
            expect(result).toEqual(created);
        });

        it("creates request with long description", async () => {
            const longDescription = "A".repeat(2000);
            const created = {
                id: requestId,
                projectId,
                description: longDescription,
                status: RequestStatus.PENDING,
                createdAt: now,
                updatedAt: now,
            };

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.request.create.mockResolvedValue(created);

            const result = await createRequest({
                projectId,
                description: longDescription,
                userId,
            });

            expect(mockPrisma.request.create).toHaveBeenCalledWith({
                data: { projectId, description: longDescription, status: "PENDING" },
            });
            expect(result).toEqual(created);
        });

        it("always creates request with PENDING status", async () => {
            const created = {
                id: requestId,
                projectId,
                description: "Test request",
                status: RequestStatus.PENDING,
                createdAt: now,
                updatedAt: now,
            };

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.request.create.mockResolvedValue(created);

            const result = await createRequest({
                projectId,
                description: "Test request",
                userId,
            });

            expect(mockPrisma.request.create).toHaveBeenCalledWith({
                data: { projectId, description: "Test request", status: "PENDING" },
            });
            expect(result.status).toBe(RequestStatus.PENDING);
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

        it("throws PROJECT_NOT_FOUND when project belongs to different user", async () => {
            mockPrisma.project.findFirst.mockResolvedValue(null);

            await expect(
                createRequest({ projectId, description: "New req", userId: "different-user" }),
            ).rejects.toThrow(ServiceError);

            await expect(
                createRequest({ projectId, description: "New req", userId: "different-user" }),
            ).rejects.toHaveProperty("code", ServiceErrorCodes.PROJECT_NOT_FOUND);

            expect(mockPrisma.request.create).not.toHaveBeenCalled();
        });

        it("handles database errors during project lookup", async () => {
            mockPrisma.project.findFirst.mockRejectedValue(new Error("Database connection failed"));

            await expect(
                createRequest({ projectId, description: "New req", userId }),
            ).rejects.toThrow("Database connection failed");

            expect(mockPrisma.request.create).not.toHaveBeenCalled();
        });

        it("handles database errors during request creation", async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.request.create.mockRejectedValue(new Error("Creation failed"));

            await expect(
                createRequest({ projectId, description: "New req", userId }),
            ).rejects.toThrow("Creation failed");
        });

        it("handles transaction rollback on any error", async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.request.create.mockRejectedValue(new Error("Transaction error"));

            await expect(
                createRequest({ projectId, description: "New req", userId }),
            ).rejects.toThrow("Transaction error");
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

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
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

        it("returns requests ordered by creation date (newest first)", async () => {
            const requests = [
                {
                    id: "r3",
                    projectId,
                    description: "Newest",
                    status: RequestStatus.PENDING,
                    createdAt: new Date("2023-01-03"),
                    updatedAt: now,
                },
                {
                    id: "r2",
                    projectId,
                    description: "Middle",
                    status: RequestStatus.IN_SCOPE,
                    createdAt: new Date("2023-01-02"),
                    updatedAt: now,
                },
                {
                    id: "r1",
                    projectId,
                    description: "Oldest",
                    status: RequestStatus.OUT_OF_SCOPE,
                    createdAt: new Date("2023-01-01"),
                    updatedAt: now,
                },
            ];

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.request.findMany.mockResolvedValue(requests);

            const result = await getRequests({ projectId, userId });

            expect(result[0].description).toBe("Newest");
            expect(result[1].description).toBe("Middle");
            expect(result[2].description).toBe("Oldest");
        });

        it("returns requests with all possible statuses", async () => {
            const requests = [
                {
                    id: "r1",
                    projectId,
                    description: "Pending request",
                    status: RequestStatus.PENDING,
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    id: "r2",
                    projectId,
                    description: "In scope request",
                    status: RequestStatus.IN_SCOPE,
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    id: "r3",
                    projectId,
                    description: "Out of scope request",
                    status: RequestStatus.OUT_OF_SCOPE,
                    createdAt: now,
                    updatedAt: now,
                },
            ];

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.request.findMany.mockResolvedValue(requests);

            const result = await getRequests({ projectId, userId });

            expect(result).toHaveLength(3);
            expect(result.map(r => r.status)).toContain(RequestStatus.PENDING);
            expect(result.map(r => r.status)).toContain(RequestStatus.IN_SCOPE);
            expect(result.map(r => r.status)).toContain(RequestStatus.OUT_OF_SCOPE);
        });

        it("returns empty array when no requests exist", async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.request.findMany.mockResolvedValue([]);

            const result = await getRequests({ projectId, userId });

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });

        it("returns large number of requests correctly", async () => {
            const requests = Array.from({ length: 100 }, (_, i) => ({
                id: `req_${i}`,
                projectId,
                description: `Request ${i}`,
                status: RequestStatus.PENDING,
                createdAt: now,
                updatedAt: now,
            }));

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.request.findMany.mockResolvedValue(requests);

            const result = await getRequests({ projectId, userId });

            expect(result).toEqual(requests);
            expect(result).toHaveLength(100);
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

        it("throws PROJECT_NOT_FOUND if project belongs to different user", async () => {
            mockPrisma.project.findFirst.mockResolvedValue(null);

            await expect(getRequests({ projectId, userId: "different-user" })).rejects.toThrow(
                ServiceError,
            );
            await expect(getRequests({ projectId, userId: "different-user" })).rejects.toHaveProperty(
                "code",
                ServiceErrorCodes.PROJECT_NOT_FOUND,
            );

            expect(mockPrisma.request.findMany).not.toHaveBeenCalled();
        });

        it("handles database errors during project lookup", async () => {
            mockPrisma.project.findFirst.mockRejectedValue(new Error("Database error"));

            await expect(getRequests({ projectId, userId })).rejects.toThrow("Database error");
            expect(mockPrisma.request.findMany).not.toHaveBeenCalled();
        });

        it("handles database errors during requests fetch", async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.request.findMany.mockRejectedValue(new Error("Fetch failed"));

            await expect(getRequests({ projectId, userId })).rejects.toThrow("Fetch failed");
        });

        it("handles transaction rollback on any error", async () => {
            mockPrisma.project.findFirst.mockRejectedValue(new Error("Transaction error"));

            await expect(getRequests({ projectId, userId })).rejects.toThrow("Transaction error");
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

        it("updates request status to IN_SCOPE", async () => {
            const updated = { ...existingRequest, status: RequestStatus.IN_SCOPE };

            mockPrisma.request.findFirst.mockResolvedValue(existingRequest);
            mockPrisma.request.update.mockResolvedValue(updated);

            const result = await updateRequest({
                id: requestId,
                userId,
                data: { status: RequestStatus.IN_SCOPE },
            });

            expect(mockPrisma.request.update).toHaveBeenCalledWith({
                where: { id: requestId },
                data: { status: RequestStatus.IN_SCOPE },
            });
            expect(result.status).toBe(RequestStatus.IN_SCOPE);
        });

        it("updates request status to OUT_OF_SCOPE", async () => {
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

        it("updates both description and status simultaneously", async () => {
            const updated = { 
                ...existingRequest, 
                description: "Updated description",
                status: RequestStatus.IN_SCOPE 
            };

            mockPrisma.request.findFirst.mockResolvedValue(existingRequest);
            mockPrisma.request.update.mockResolvedValue(updated);

            const result = await updateRequest({
                id: requestId,
                userId,
                data: { 
                    description: "Updated description",
                    status: RequestStatus.IN_SCOPE 
                },
            });

            expect(mockPrisma.request.update).toHaveBeenCalledWith({
                where: { id: requestId },
                data: { 
                    description: "Updated description",
                    status: RequestStatus.IN_SCOPE 
                },
            });
            expect(result.description).toBe("Updated description");
            expect(result.status).toBe(RequestStatus.IN_SCOPE);
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

        it("handles update with minimal description", async () => {
            const updated = { ...existingRequest, description: "A" };

            mockPrisma.request.findFirst.mockResolvedValue(existingRequest);
            mockPrisma.request.update.mockResolvedValue(updated);

            const result = await updateRequest({
                id: requestId,
                userId,
                data: { description: "A" },
            });

            expect(result.description).toBe("A");
        });

        it("handles update with long description", async () => {
            const longDescription = "A".repeat(2000);
            const updated = { ...existingRequest, description: longDescription };

            mockPrisma.request.findFirst.mockResolvedValue(existingRequest);
            mockPrisma.request.update.mockResolvedValue(updated);

            const result = await updateRequest({
                id: requestId,
                userId,
                data: { description: longDescription },
            });

            expect(result.description).toBe(longDescription);
        });

        it("handles update with same values (no-op)", async () => {
            const updated = { ...existingRequest };

            mockPrisma.request.findFirst.mockResolvedValue(existingRequest);
            mockPrisma.request.update.mockResolvedValue(updated);

            const result = await updateRequest({
                id: requestId,
                userId,
                data: { 
                    description: existingRequest.description,
                    status: RequestStatus.IN_SCOPE 
                },
            });

            expect(result).toEqual(updated);
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

        it("throws REQUEST_NOT_FOUND when request belongs to different user", async () => {
            mockPrisma.request.findFirst.mockResolvedValue(null);

            await expect(
                updateRequest({ id: requestId, userId: "different-user", data: { description: "X" } }),
            ).rejects.toThrow(ServiceError);

            await expect(
                updateRequest({ id: requestId, userId: "different-user", data: { description: "X" } }),
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

        it("handles empty data object", async () => {
            const updated = { ...existingRequest };

            mockPrisma.request.findFirst.mockResolvedValue(existingRequest);
            mockPrisma.request.update.mockResolvedValue(updated);

            const result = await updateRequest({
                id: requestId,
                userId,
                data: {},
            });

            expect(mockPrisma.request.update).toHaveBeenCalledWith({
                where: { id: requestId },
                data: {},
            });
            expect(result).toEqual(updated);
        });

        it("handles data with all undefined values", async () => {
            const updated = { ...existingRequest };

            mockPrisma.request.findFirst.mockResolvedValue(existingRequest);
            mockPrisma.request.update.mockResolvedValue(updated);

            const result = await updateRequest({
                id: requestId,
                userId,
                data: { 
                    description: undefined as any,
                    status: undefined as any 
                },
            });

            expect(mockPrisma.request.update).toHaveBeenCalledWith({
                where: { id: requestId },
                data: {},
            });
            expect(result).toEqual(updated);
        });

        it("handles database errors during request lookup", async () => {
            mockPrisma.request.findFirst.mockRejectedValue(new Error("Database error"));

            await expect(
                updateRequest({ id: requestId, userId, data: { description: "Update" } }),
            ).rejects.toThrow("Database error");

            expect(mockPrisma.request.update).not.toHaveBeenCalled();
        });

        it("handles database errors during update", async () => {
            mockPrisma.request.findFirst.mockResolvedValue(existingRequest);
            mockPrisma.request.update.mockRejectedValue(new Error("Update failed"));

            await expect(
                updateRequest({ id: requestId, userId, data: { description: "Update" } }),
            ).rejects.toThrow("Update failed");
        });

        it("handles transaction rollback on any error", async () => {
            mockPrisma.request.findFirst.mockRejectedValue(new Error("Transaction error"));

            await expect(
                updateRequest({ id: requestId, userId, data: { description: "Update" } }),
            ).rejects.toThrow("Transaction error");
        });

        it("handles different request IDs correctly", async () => {
            const differentRequestId = "req_999";
            const differentRequest = { ...existingRequest, id: differentRequestId };
            const updated = { ...differentRequest, description: "Updated" };

            mockPrisma.request.findFirst.mockResolvedValue(differentRequest);
            mockPrisma.request.update.mockResolvedValue(updated);

            const result = await updateRequest({
                id: differentRequestId,
                userId,
                data: { description: "Updated" },
            });

            expect(mockPrisma.request.findFirst).toHaveBeenCalledWith({
                where: { id: differentRequestId, project: { userId } },
            });
            expect(mockPrisma.request.update).toHaveBeenCalledWith({
                where: { id: differentRequestId },
                data: { description: "Updated" },
            });
            expect(result).toEqual(updated);
        });
    });

    // ---------------------------
    // deleteRequest
    // ---------------------------
    describe("deleteRequest", () => {
        const existingRequest = {
            id: requestId,
            projectId,
            description: "Request to delete",
            status: RequestStatus.PENDING,
            createdAt: now,
            updatedAt: now,
        };

        it("deletes request when owned by user", async () => {
            mockPrisma.request.findFirst.mockResolvedValue(existingRequest);
            mockPrisma.request.delete.mockResolvedValue(existingRequest);

            const result = await deleteRequest({ id: requestId, userId });

            expect(mockPrisma.request.findFirst).toHaveBeenCalledWith({
                where: { id: requestId, project: { userId } },
            });
            expect(mockPrisma.request.delete).toHaveBeenCalledWith({
                where: { id: requestId },
            });
            expect(result).toEqual(existingRequest);
        });

        it("deletes request with different statuses", async () => {
            const inScopeRequest = { ...existingRequest, status: RequestStatus.IN_SCOPE };
            mockPrisma.request.findFirst.mockResolvedValue(inScopeRequest);
            mockPrisma.request.delete.mockResolvedValue(inScopeRequest);

            const result = await deleteRequest({ id: requestId, userId });

            expect(result.status).toBe(RequestStatus.IN_SCOPE);
        });

        it("deletes request with OUT_OF_SCOPE status", async () => {
            const outOfScopeRequest = { ...existingRequest, status: RequestStatus.OUT_OF_SCOPE };
            mockPrisma.request.findFirst.mockResolvedValue(outOfScopeRequest);
            mockPrisma.request.delete.mockResolvedValue(outOfScopeRequest);

            const result = await deleteRequest({ id: requestId, userId });

            expect(result.status).toBe(RequestStatus.OUT_OF_SCOPE);
        });

        it("deletes request with long description", async () => {
            const longDescRequest = { 
                ...existingRequest, 
                description: "A".repeat(2000) 
            };
            mockPrisma.request.findFirst.mockResolvedValue(longDescRequest);
            mockPrisma.request.delete.mockResolvedValue(longDescRequest);

            const result = await deleteRequest({ id: requestId, userId });

            expect(result.description).toBe("A".repeat(2000));
        });

        it("deletes request with minimal description", async () => {
            const minimalRequest = { ...existingRequest, description: "A" };
            mockPrisma.request.findFirst.mockResolvedValue(minimalRequest);
            mockPrisma.request.delete.mockResolvedValue(minimalRequest);

            const result = await deleteRequest({ id: requestId, userId });

            expect(result.description).toBe("A");
        });

        it("throws REQUEST_NOT_FOUND when request does not exist", async () => {
            mockPrisma.request.findFirst.mockResolvedValue(null);

            await expect(deleteRequest({ id: requestId, userId })).rejects.toThrow(ServiceError);
            await expect(deleteRequest({ id: requestId, userId })).rejects.toHaveProperty(
                "code",
                ServiceErrorCodes.REQUEST_NOT_FOUND,
            );

            expect(mockPrisma.request.delete).not.toHaveBeenCalled();
        });

        it("throws REQUEST_NOT_FOUND when request belongs to different user", async () => {
            mockPrisma.request.findFirst.mockResolvedValue(null);

            await expect(deleteRequest({ id: requestId, userId: "different-user" })).rejects.toThrow(ServiceError);
            await expect(deleteRequest({ id: requestId, userId: "different-user" })).rejects.toHaveProperty(
                "code",
                ServiceErrorCodes.REQUEST_NOT_FOUND,
            );

            expect(mockPrisma.request.delete).not.toHaveBeenCalled();
        });

        it("handles database errors during request lookup", async () => {
            mockPrisma.request.findFirst.mockRejectedValue(new Error("Database error"));

            await expect(deleteRequest({ id: requestId, userId })).rejects.toThrow("Database error");
            expect(mockPrisma.request.delete).not.toHaveBeenCalled();
        });

        it("handles database errors during deletion", async () => {
            mockPrisma.request.findFirst.mockResolvedValue(existingRequest);
            mockPrisma.request.delete.mockRejectedValue(new Error("Delete failed"));

            await expect(deleteRequest({ id: requestId, userId })).rejects.toThrow("Delete failed");
        });

        it("handles transaction rollback on any error", async () => {
            mockPrisma.request.findFirst.mockRejectedValue(new Error("Transaction error"));

            await expect(deleteRequest({ id: requestId, userId })).rejects.toThrow("Transaction error");
        });

        it("handles different request IDs correctly", async () => {
            const differentRequestId = "req_999";
            const differentRequest = { ...existingRequest, id: differentRequestId };

            mockPrisma.request.findFirst.mockResolvedValue(differentRequest);
            mockPrisma.request.delete.mockResolvedValue(differentRequest);

            const result = await deleteRequest({ id: differentRequestId, userId });

            expect(mockPrisma.request.findFirst).toHaveBeenCalledWith({
                where: { id: differentRequestId, project: { userId } },
            });
            expect(mockPrisma.request.delete).toHaveBeenCalledWith({
                where: { id: differentRequestId },
            });
            expect(result).toEqual(differentRequest);
        });

        it("verifies proper where clause for ownership check", async () => {
            mockPrisma.request.findFirst.mockResolvedValue(existingRequest);
            mockPrisma.request.delete.mockResolvedValue(existingRequest);

            await deleteRequest({ id: requestId, userId });

            expect(mockPrisma.request.findFirst).toHaveBeenCalledWith({
                where: { 
                    id: requestId, 
                    project: { userId } 
                },
            });
        });

        it("verifies delete is called with correct ID", async () => {
            mockPrisma.request.findFirst.mockResolvedValue(existingRequest);
            mockPrisma.request.delete.mockResolvedValue(existingRequest);

            await deleteRequest({ id: requestId, userId });

            expect(mockPrisma.request.delete).toHaveBeenCalledWith({
                where: { id: requestId },
            });
        });
    });
});
