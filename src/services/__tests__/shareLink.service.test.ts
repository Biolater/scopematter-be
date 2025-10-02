import { createShareLink, getShareLink, getShareLinks, revokeShareLink } from "../shareLink.service";
import { mockPrisma, mockRedis } from "../../__tests__/setup";
import { ServiceError } from "../../utils/service-error";
import { ServiceErrorCodes } from "../../utils/service-error-codes";

describe("shareLink.service", () => {
    const projectId = "proj_123";
    const userId = "user_456";
    const shareLinkId = "sl_789";
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now
    const expiredAt = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago

    const mockProject = {
        id: projectId,
        userId,
        name: "Test Project",
        description: "Test Description",
        status: "PENDING" as const,
        clientId: "client123",
        createdAt: now,
        updatedAt: now,
    };

    const mockClient = {
        id: "client123",
        name: "Test Client",
        email: "client@example.com",
        company: "Test Company",
        createdAt: now,
        updatedAt: now,
    };

    const mockShareLink = {
        id: shareLinkId,
        projectId,
        tokenHash: "hashed_token_123",
        expiresAt: null,
        isActive: true,
        showScopeItems: true,
        showRequests: true,
        showChangeOrders: true,
        viewCount: 0,
        lastViewedAt: null,
        revokedAt: null,
        createdAt: now,
        updatedAt: now,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
        // Mock Redis to return null (no cache)
        mockRedis.get.mockResolvedValue(null);
        mockRedis.set.mockResolvedValue('OK');
        mockRedis.del.mockResolvedValue(1);
        // Mock the generateShareToken utility
        jest.doMock("../../utils/share-link", () => ({
            generateShareToken: jest.fn(() => ({
                token: "test_token_123",
                tokenHash: "hashed_token_123",
            })),
        }));
        // Mock ENV
        jest.doMock("../../config/env", () => ({
            ENV: {
                APP_URL: "https://app.example.com",
            },
        }));
    });

    // ---------------------------
    // createShareLink
    // ---------------------------
    describe("createShareLink", () => {
        it("creates share link with all permissions enabled", async () => {
            const created = {
                ...mockShareLink,
                projectId,
                tokenHash: "hashed_token_123",
                showScopeItems: true,
                showRequests: true,
                showChangeOrders: true,
                isActive: true,
            };

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.shareLink.create.mockResolvedValue(created);

            const result = await createShareLink({
                projectId,
                expiresAt: null,
                showScopeItems: true,
                showRequests: true,
                showChangeOrders: true,
                userId,
            });

            expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
                where: { id: projectId, userId },
            });
            expect(mockPrisma.shareLink.create).toHaveBeenCalledWith({
                data: {
                    projectId,
                    tokenHash: expect.any(String),
                    expiresAt: null,
                    showScopeItems: true,
                    showRequests: true,
                    showChangeOrders: true,
                    isActive: true,
                },
            });
            expect(result).toEqual({    
                id: shareLinkId,
                url: expect.stringMatching(/\/share\//),
                expiresAt: null,
                showScopeItems: true,
                showRequests: true,
                showChangeOrders: true,
                createdAt: now,
            });
        });

        it("creates share link with expiration date", async () => {
            const created = {
                ...mockShareLink,
                expiresAt,
            };

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.shareLink.create.mockResolvedValue(created);

            const result = await createShareLink({
                projectId,
                expiresAt,
                showScopeItems: true,
                showRequests: true,
                showChangeOrders: true,
                userId,
            });

            expect(mockPrisma.shareLink.create).toHaveBeenCalledWith({
                data: {
                    projectId,
                    tokenHash: expect.any(String),
                    expiresAt,
                    showScopeItems: true,
                    showRequests: true,
                    showChangeOrders: true,
                    isActive: true,
                },
            });
            expect(result.expiresAt).toEqual(expiresAt);
        });

        it("creates share link with restricted permissions", async () => {
            const created = {
                ...mockShareLink,
                showScopeItems: false,
                showRequests: true,
                showChangeOrders: false,
            };

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.shareLink.create.mockResolvedValue(created);

            const result = await createShareLink({
                projectId,
                expiresAt: null,
                showScopeItems: false,
                showRequests: true,
                showChangeOrders: false,
                userId,
            });

            expect(mockPrisma.shareLink.create).toHaveBeenCalledWith({
                data: {
                    projectId,
                    tokenHash: expect.any(String),
                    expiresAt: null,
                    showScopeItems: false,
                    showRequests: true,
                    showChangeOrders: false,
                    isActive: true,
                },
            });
            expect(result.showScopeItems).toBe(false);
            expect(result.showRequests).toBe(true);
            expect(result.showChangeOrders).toBe(false);
        });

        it("creates share link with only scope items enabled", async () => {
            const created = {
                ...mockShareLink,
                showScopeItems: true,
                showRequests: false,
                showChangeOrders: false,
            };

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.shareLink.create.mockResolvedValue(created);

            const result = await createShareLink({
                projectId,
                expiresAt: null,
                showScopeItems: true,
                showRequests: false,
                showChangeOrders: false,
                userId,
            });

            expect(result.showScopeItems).toBe(true);
            expect(result.showRequests).toBe(false);
            expect(result.showChangeOrders).toBe(false);
        });

        it("throws PROJECT_NOT_FOUND when project does not exist", async () => {
            mockPrisma.project.findFirst.mockResolvedValue(null);

            await expect(
                createShareLink({
                    projectId,
                    expiresAt: null,
                    showScopeItems: true,
                    showRequests: true,
                    showChangeOrders: true,
                    userId,
                }),
            ).rejects.toThrow(ServiceError);

            await expect(
                createShareLink({
                    projectId,
                    expiresAt: null,
                    showScopeItems: true,
                    showRequests: true,
                    showChangeOrders: true,
                    userId,
                }),
            ).rejects.toHaveProperty("code", ServiceErrorCodes.PROJECT_NOT_FOUND);

            expect(mockPrisma.shareLink.create).not.toHaveBeenCalled();
        });

        it("throws PROJECT_NOT_FOUND when project belongs to different user", async () => {
            mockPrisma.project.findFirst.mockResolvedValue(null);

            await expect(
                createShareLink({
                    projectId,
                    expiresAt: null,
                    showScopeItems: true,
                    showRequests: true,
                    showChangeOrders: true,
                    userId: "different-user",
                }),
            ).rejects.toThrow(ServiceError);

            await expect(
                createShareLink({
                    projectId,
                    expiresAt: null,
                    showScopeItems: true,
                    showRequests: true,
                    showChangeOrders: true,
                    userId: "different-user",
                }),
            ).rejects.toHaveProperty("code", ServiceErrorCodes.PROJECT_NOT_FOUND);

            expect(mockPrisma.shareLink.create).not.toHaveBeenCalled();
        });

        it("handles database errors during project lookup", async () => {
            mockPrisma.project.findFirst.mockRejectedValue(new Error("Database connection failed"));

            await expect(
                createShareLink({
                    projectId,
                    expiresAt: null,
                    showScopeItems: true,
                    showRequests: true,
                    showChangeOrders: true,
                    userId,
                }),
            ).rejects.toThrow("Database connection failed");

            expect(mockPrisma.shareLink.create).not.toHaveBeenCalled();
        });

        it("handles database errors during share link creation", async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.shareLink.create.mockRejectedValue(new Error("Creation failed"));

            await expect(
                createShareLink({
                    projectId,
                    expiresAt: null,
                    showScopeItems: true,
                    showRequests: true,
                    showChangeOrders: true,
                    userId,
                }),
            ).rejects.toThrow("Creation failed");
        });

        it("handles transaction rollback on any error", async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.shareLink.create.mockRejectedValue(new Error("Transaction error"));

            await expect(
                createShareLink({
                    projectId,
                    expiresAt: null,
                    showScopeItems: true,
                    showRequests: true,
                    showChangeOrders: true,
                    userId,
                }),
            ).rejects.toThrow("Transaction error");
        });
    });

    // ---------------------------
    // getShareLink
    // ---------------------------
    describe("getShareLink", () => {
        const mockProjectWithData = {
            ...mockProject,
            client: mockClient,
            scopeItems: [
                {
                    id: "item1",
                    name: "Item 1",
                    description: "Description 1",
                    status: "PENDING" as const,
                    createdAt: now,
                },
                {
                    id: "item2",
                    name: "Item 2",
                    description: "Description 2",
                    status: "COMPLETED" as const,
                    createdAt: now,
                },
            ],
            requests: [
                {
                    id: "req1",
                    description: "Request 1",
                    status: "PENDING" as const,
                    createdAt: now,
                },
                {
                    id: "req2",
                    description: "Request 2",
                    status: "OUT_OF_SCOPE" as const,
                    createdAt: now,
                },
            ],
            changeOrders: [
                {
                    id: "co1",
                    priceUsd: 1000,
                    extraDays: 5,
                    status: "PENDING" as const,
                    createdAt: now,
                },
                {
                    id: "co2",
                    priceUsd: 500,
                    extraDays: null,
                    status: "APPROVED" as const,
                    createdAt: now,
                },
            ],
        };

        const mockShareLinkWithProject = {
            ...mockShareLink,
            project: mockProjectWithData,
        };

        it("returns share link data with all permissions enabled", async () => {
            mockPrisma.shareLink.findUnique.mockResolvedValue(mockShareLinkWithProject);
            mockPrisma.shareLink.update.mockResolvedValue({
                ...mockShareLink,
                viewCount: 1,
                lastViewedAt: now,
            });

            const result = await getShareLink({ token: "test_token_123" });

            expect(mockPrisma.shareLink.findUnique).toHaveBeenCalledWith({
                where: { tokenHash: expect.any(String) },
                include: {
                    project: {
                        include: {
                            client: true,
                            scopeItems: true,
                            requests: true,
                            changeOrders: true,
                        },
                    },
                },
            });
            expect(result).toEqual({
                project: {
                    name: "Test Project",
                    description: "Test Description",
                },
                client: {
                    name: "Test Client",
                    company: "Test Company",
                },
                scopeItems: [
                    {
                        id: "item1",
                        name: "Item 1",
                        description: "Description 1",
                        status: "PENDING",
                    },
                    {
                        id: "item2",
                        name: "Item 2",
                        description: "Description 2",
                        status: "COMPLETED",
                    },
                ],
                requests: [
                    {
                        id: "req1",
                        description: "Request 1",
                        status: "PENDING",
                    },
                    {
                        id: "req2",
                        description: "Request 2",
                        status: "OUT_OF_SCOPE",
                    },
                ],
                changeOrders: [
                    {
                        id: "co1",
                        priceUsd: 1000,
                        extraDays: 5,
                        status: "PENDING",
                    },
                    {
                        id: "co2",
                        priceUsd: 500,
                        extraDays: null,
                        status: "APPROVED",
                    },
                ],
                permissions: {
                    showScopeItems: true,
                    showRequests: true,
                    showChangeOrders: true,
                },
            });
        });

        it("returns share link data with restricted permissions", async () => {
            const restrictedShareLink = {
                ...mockShareLinkWithProject,
                showScopeItems: false,
                showRequests: true,
                showChangeOrders: false,
            };

            mockPrisma.shareLink.findUnique.mockResolvedValue(restrictedShareLink);
            mockPrisma.shareLink.update.mockResolvedValue({
                ...restrictedShareLink,
                viewCount: 1,
                lastViewedAt: now,
            });

            const result = await getShareLink({ token: "test_token_123" });

            expect(result.scopeItems).toEqual([]);
            expect(result.requests).toHaveLength(2);
            expect(result.changeOrders).toEqual([]);
            expect(result.permissions).toEqual({
                showScopeItems: false,
                showRequests: true,
                showChangeOrders: false,
            });
        });

        it("increments view count and updates last viewed timestamp", async () => {
            mockPrisma.shareLink.findUnique.mockResolvedValue(mockShareLinkWithProject);
            mockPrisma.shareLink.update.mockResolvedValue({
                ...mockShareLink,
                viewCount: 5,
                lastViewedAt: now,
            });

            await getShareLink({ token: "test_token_123" });

            expect(mockPrisma.shareLink.update).toHaveBeenCalledWith({
                where: { id: shareLinkId },
                data: {
                    lastViewedAt: expect.any(Date),
                    viewCount: { increment: 1 },
                },
            });
        });

        it("handles share link with no expiration date", async () => {
            const shareLinkWithoutExpiry = {
                ...mockShareLinkWithProject,
                expiresAt: null,
            };

            mockPrisma.shareLink.findUnique.mockResolvedValue(shareLinkWithoutExpiry);
            mockPrisma.shareLink.update.mockResolvedValue({
                ...shareLinkWithoutExpiry,
                viewCount: 1,
                lastViewedAt: now,
            });

            const result = await getShareLink({ token: "test_token_123" });

            expect(result).toBeDefined();
            expect(mockPrisma.shareLink.update).toHaveBeenCalled();
        });

        it("throws SHARE_LINK_NOT_FOUND when token is invalid", async () => {
            mockPrisma.shareLink.findUnique.mockResolvedValue(null);

            await expect(getShareLink({ token: "invalid_token" })).rejects.toThrow(ServiceError);
            await expect(getShareLink({ token: "invalid_token" })).rejects.toHaveProperty(
                "code",
                ServiceErrorCodes.SHARE_LINK_NOT_FOUND,
            );

            expect(mockPrisma.shareLink.update).not.toHaveBeenCalled();
        });

        it("throws SHARE_LINK_NOT_ACTIVE when link is inactive", async () => {
            const inactiveShareLink = {
                ...mockShareLinkWithProject,
                isActive: false,
            };

            mockPrisma.shareLink.findUnique.mockResolvedValue(inactiveShareLink);

            await expect(getShareLink({ token: "test_token_123" })).rejects.toThrow(ServiceError);
            await expect(getShareLink({ token: "test_token_123" })).rejects.toHaveProperty(
                "code",
                ServiceErrorCodes.SHARE_LINK_NOT_ACTIVE,
            );

            expect(mockPrisma.shareLink.update).not.toHaveBeenCalled();
        });

        it("throws SHARE_LINK_EXPIRED when link has expired", async () => {
            const expiredShareLink = {
                ...mockShareLinkWithProject,
                expiresAt: expiredAt,
            };

            mockPrisma.shareLink.findUnique.mockResolvedValue(expiredShareLink);

            await expect(getShareLink({ token: "test_token_123" })).rejects.toThrow(ServiceError);
            await expect(getShareLink({ token: "test_token_123" })).rejects.toHaveProperty(
                "code",
                ServiceErrorCodes.SHARE_LINK_EXPIRED,
            );

            expect(mockPrisma.shareLink.update).not.toHaveBeenCalled();
        });

        it("handles database errors during share link lookup", async () => {
            mockPrisma.shareLink.findUnique.mockRejectedValue(new Error("Database error"));

            await expect(getShareLink({ token: "test_token_123" })).rejects.toThrow("Database error");
            expect(mockPrisma.shareLink.update).not.toHaveBeenCalled();
        });

        it("handles database errors during view count update", async () => {
            mockPrisma.shareLink.findUnique.mockResolvedValue(mockShareLinkWithProject);
            mockPrisma.shareLink.update.mockRejectedValue(new Error("Update failed"));

            await expect(getShareLink({ token: "test_token_123" })).rejects.toThrow("Update failed");
        });

        it("handles different token formats correctly", async () => {
            const differentToken = "different_token_456";
            const differentHash = "different_hash_456";

            // Mock the crypto module for different token
            jest.doMock("crypto", () => ({
                createHash: jest.fn(() => ({
                    update: jest.fn(() => ({
                        digest: jest.fn(() => differentHash),
                    })),
                })),
            }));

            mockPrisma.shareLink.findUnique.mockResolvedValue(mockShareLinkWithProject);
            mockPrisma.shareLink.update.mockResolvedValue({
                ...mockShareLink,
                viewCount: 1,
                lastViewedAt: now,
            });

            await getShareLink({ token: differentToken });

            expect(mockPrisma.shareLink.findUnique).toHaveBeenCalledWith({
                where: { tokenHash: expect.any(String) },
                include: {
                    project: {
                        include: {
                            client: true,
                            scopeItems: true,
                            requests: true,
                            changeOrders: true,
                        },
                    },
                },
            });
        });
    });

    // ---------------------------
    // getShareLinks
    // ---------------------------
    describe("getShareLinks", () => {
        it("returns all share links for a project", async () => {
            const shareLinks = [
                {
                    id: "sl_1",
                    projectId,
                    createdAt: now,
                    updatedAt: now,
                    expiresAt: expiresAt,
                    revokedAt: null,
                    isActive: true,
                    viewCount: 5,
                    lastViewedAt: now,
                    showScopeItems: true,
                    showRequests: true,
                    showChangeOrders: true,
                    tokenHash: "hash_1",
                },
                {
                    id: "sl_2",
                    projectId,
                    createdAt: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
                    updatedAt: new Date(now.getTime() - 60 * 60 * 1000),
                    expiresAt: null,
                    revokedAt: null,
                    isActive: true,
                    viewCount: 0,
                    lastViewedAt: null,
                    showScopeItems: false,
                    showRequests: true,
                    showChangeOrders: false,
                    tokenHash: "hash_2",
                },
                {
                    id: "sl_3",
                    projectId,
                    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
                    updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
                    expiresAt: null,
                    revokedAt: now,
                    isActive: false,
                    viewCount: 10,
                    lastViewedAt: new Date(now.getTime() - 60 * 60 * 1000),
                    showScopeItems: true,
                    showRequests: false,
                    showChangeOrders: true,
                    tokenHash: "hash_3",
                },
            ];

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.shareLink.findMany.mockResolvedValue(shareLinks);

            const result = await getShareLinks({ userId, projectId });

            expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
                where: { id: projectId, userId },
            });
            expect(mockPrisma.shareLink.findMany).toHaveBeenCalledWith({
                where: { projectId },
                orderBy: { createdAt: "desc" },
            });
            expect(result).toEqual([
                {
                    id: "sl_1",
                    createdAt: now,
                    expiresAt: expiresAt,
                    revokedAt: null,
                    isActive: true,
                    viewCount: 5,
                    lastViewedAt: now,
                    projectId,
                    permissions: {
                        showScopeItems: true,
                        showRequests: true,
                        showChangeOrders: true,
                    },
                },
                {
                    id: "sl_2",
                    createdAt: new Date(now.getTime() - 60 * 60 * 1000),
                    expiresAt: null,
                    revokedAt: null,
                    isActive: true,
                    viewCount: 0,
                    lastViewedAt: null,
                    projectId,
                    permissions: {
                        showScopeItems: false,
                        showRequests: true,
                        showChangeOrders: false,
                    },
                },
                {
                    id: "sl_3",
                    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
                    expiresAt: null,
                    revokedAt: now,
                    isActive: false,
                    viewCount: 10,
                    lastViewedAt: new Date(now.getTime() - 60 * 60 * 1000),
                    projectId,
                    permissions: {
                        showScopeItems: true,
                        showRequests: false,
                        showChangeOrders: true,
                    },
                },
            ]);
        });

        it("returns empty array when no share links exist", async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.shareLink.findMany.mockResolvedValue([]);

            const result = await getShareLinks({ userId, projectId });

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });

        it("returns share links ordered by creation date (newest first)", async () => {
            const shareLinks = [
                {
                    id: "sl_newest",
                    projectId,
                    createdAt: now,
                    updatedAt: now,
                    expiresAt: null,
                    revokedAt: null,
                    isActive: true,
                    viewCount: 0,
                    lastViewedAt: null,
                    showScopeItems: true,
                    showRequests: true,
                    showChangeOrders: true,
                    tokenHash: "hash_newest",
                },
                {
                    id: "sl_oldest",
                    projectId,
                    createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
                    updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                    expiresAt: null,
                    revokedAt: null,
                    isActive: true,
                    viewCount: 0,
                    lastViewedAt: null,
                    showScopeItems: true,
                    showRequests: true,
                    showChangeOrders: true,
                    tokenHash: "hash_oldest",
                },
            ];

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.shareLink.findMany.mockResolvedValue(shareLinks);

            const result = await getShareLinks({ userId, projectId });

            expect(result[0].id).toBe("sl_newest");
            expect(result[1].id).toBe("sl_oldest");
        });

        it("handles share links with various states", async () => {
            const shareLinks = [
                {
                    id: "sl_active",
                    projectId,
                    createdAt: now,
                    updatedAt: now,
                    expiresAt: expiresAt,
                    revokedAt: null,
                    isActive: true,
                    viewCount: 5,
                    lastViewedAt: now,
                    showScopeItems: true,
                    showRequests: true,
                    showChangeOrders: true,
                    tokenHash: "hash_active",
                },
                {
                    id: "sl_expired",
                    projectId,
                    createdAt: now,
                    updatedAt: now,
                    expiresAt: expiredAt,
                    revokedAt: null,
                    isActive: true,
                    viewCount: 2,
                    lastViewedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
                    showScopeItems: false,
                    showRequests: false,
                    showChangeOrders: false,
                    tokenHash: "hash_expired",
                },
                {
                    id: "sl_revoked",
                    projectId,
                    createdAt: now,
                    updatedAt: now,
                    expiresAt: null,
                    revokedAt: now,
                    isActive: false,
                    viewCount: 8,
                    lastViewedAt: new Date(now.getTime() - 60 * 60 * 1000),
                    showScopeItems: true,
                    showRequests: false,
                    showChangeOrders: true,
                    tokenHash: "hash_revoked",
                },
            ];

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.shareLink.findMany.mockResolvedValue(shareLinks);

            const result = await getShareLinks({ userId, projectId });

            expect(result).toHaveLength(3);
            expect(result[0].isActive).toBe(true);
            expect(result[1].isActive).toBe(true);
            expect(result[2].isActive).toBe(false);
        });

        it("throws PROJECT_NOT_FOUND when project does not exist", async () => {
            mockPrisma.project.findFirst.mockResolvedValue(null);

            await expect(getShareLinks({ userId, projectId })).rejects.toThrow(ServiceError);
            await expect(getShareLinks({ userId, projectId })).rejects.toHaveProperty(
                "code",
                ServiceErrorCodes.PROJECT_NOT_FOUND,
            );

            expect(mockPrisma.shareLink.findMany).not.toHaveBeenCalled();
        });

        it("throws PROJECT_NOT_FOUND when project belongs to different user", async () => {
            mockPrisma.project.findFirst.mockResolvedValue(null);

            await expect(getShareLinks({ userId: "different-user", projectId })).rejects.toThrow(ServiceError);
            await expect(getShareLinks({ userId: "different-user", projectId })).rejects.toHaveProperty(
                "code",
                ServiceErrorCodes.PROJECT_NOT_FOUND,
            );

            expect(mockPrisma.shareLink.findMany).not.toHaveBeenCalled();
        });

        it("handles database errors during project lookup", async () => {
            mockPrisma.project.findFirst.mockRejectedValue(new Error("Database error"));

            await expect(getShareLinks({ userId, projectId })).rejects.toThrow("Database error");
            expect(mockPrisma.shareLink.findMany).not.toHaveBeenCalled();
        });

        it("handles database errors during share links fetch", async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.shareLink.findMany.mockRejectedValue(new Error("Fetch failed"));

            await expect(getShareLinks({ userId, projectId })).rejects.toThrow("Fetch failed");
        });

        it("handles large number of share links", async () => {
            const manyShareLinks = Array.from({ length: 50 }, (_, i) => ({
                id: `sl_${i}`,
                projectId,
                createdAt: new Date(now.getTime() - i * 60 * 1000), // Spread over time
                updatedAt: new Date(now.getTime() - i * 60 * 1000),
                expiresAt: null,
                revokedAt: null,
                isActive: true,
                viewCount: i,
                lastViewedAt: i > 0 ? new Date(now.getTime() - i * 60 * 1000) : null,
                showScopeItems: i % 2 === 0,
                showRequests: i % 3 === 0,
                showChangeOrders: i % 4 === 0,
                tokenHash: `hash_${i}`,
            }));

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.shareLink.findMany.mockResolvedValue(manyShareLinks);

            const result = await getShareLinks({ userId, projectId });

            expect(result).toHaveLength(50);
            expect(result[0].id).toBe("sl_0");
            expect(result[49].id).toBe("sl_49");
        });
    });

    // ---------------------------
    // revokeShareLink
    // ---------------------------
    describe("revokeShareLink", () => {
        it("revokes active share link successfully", async () => {
            const activeShareLink = {
                ...mockShareLink,
                isActive: true,
                revokedAt: null,
            };

            const revokedShareLink = {
                ...activeShareLink,
                revokedAt: now,
                isActive: false,
            };

            mockPrisma.shareLink.findFirst.mockResolvedValue(activeShareLink);
            mockPrisma.shareLink.update.mockResolvedValue(revokedShareLink);

            const result = await revokeShareLink({ userId, id: shareLinkId });

            expect(mockPrisma.shareLink.findFirst).toHaveBeenCalledWith({
                where: { id: shareLinkId, project: { userId } },
            });
            expect(mockPrisma.shareLink.update).toHaveBeenCalledWith({
                where: { id: shareLinkId },
                data: {
                    revokedAt: expect.any(Date),
                    isActive: false,
                },
            });
            expect(result).toEqual({
                id: shareLinkId,
                revokedAt: now,
                isActive: false,
            });
        });

        it("revokes share link with expiration date", async () => {
            const shareLinkWithExpiry = {
                ...mockShareLink,
                expiresAt: expiresAt,
                isActive: true,
                revokedAt: null,
            };

            const revokedShareLink = {
                ...shareLinkWithExpiry,
                revokedAt: now,
                isActive: false,
            };

            mockPrisma.shareLink.findFirst.mockResolvedValue(shareLinkWithExpiry);
            mockPrisma.shareLink.update.mockResolvedValue(revokedShareLink);

            const result = await revokeShareLink({ userId, id: shareLinkId });

            expect(result.isActive).toBe(false);
            expect(result.revokedAt).toEqual(now);
        });

        it("revokes share link with view history", async () => {
            const shareLinkWithViews = {
                ...mockShareLink,
                viewCount: 15,
                lastViewedAt: new Date(now.getTime() - 60 * 60 * 1000),
                isActive: true,
                revokedAt: null,
            };

            const revokedShareLink = {
                ...shareLinkWithViews,
                revokedAt: now,
                isActive: false,
            };

            mockPrisma.shareLink.findFirst.mockResolvedValue(shareLinkWithViews);
            mockPrisma.shareLink.update.mockResolvedValue(revokedShareLink);

            const result = await revokeShareLink({ userId, id: shareLinkId });

            expect(result.id).toBe(shareLinkId);
            expect(result.isActive).toBe(false);
        });

        it("throws SHARE_LINK_NOT_FOUND when link does not exist", async () => {
            mockPrisma.shareLink.findFirst.mockResolvedValue(null);

            await expect(revokeShareLink({ userId, id: shareLinkId })).rejects.toThrow(ServiceError);
            await expect(revokeShareLink({ userId, id: shareLinkId })).rejects.toHaveProperty(
                "code",
                ServiceErrorCodes.SHARE_LINK_NOT_FOUND,
            );

            expect(mockPrisma.shareLink.update).not.toHaveBeenCalled();
        });

        it("throws SHARE_LINK_NOT_FOUND when link belongs to different user", async () => {
            mockPrisma.shareLink.findFirst.mockResolvedValue(null);

            await expect(revokeShareLink({ userId: "different-user", id: shareLinkId })).rejects.toThrow(ServiceError);
            await expect(revokeShareLink({ userId: "different-user", id: shareLinkId })).rejects.toHaveProperty(
                "code",
                ServiceErrorCodes.SHARE_LINK_NOT_FOUND,
            );

            expect(mockPrisma.shareLink.update).not.toHaveBeenCalled();
        });

        it("throws SHARE_LINK_NOT_ACTIVE when link is already inactive", async () => {
            const inactiveShareLink = {
                ...mockShareLink,
                isActive: false,
                revokedAt: new Date(now.getTime() - 60 * 60 * 1000),
            };

            mockPrisma.shareLink.findFirst.mockResolvedValue(inactiveShareLink);

            await expect(revokeShareLink({ userId, id: shareLinkId })).rejects.toThrow(ServiceError);
            await expect(revokeShareLink({ userId, id: shareLinkId })).rejects.toHaveProperty(
                "code",
                ServiceErrorCodes.SHARE_LINK_NOT_ACTIVE,
            );

            expect(mockPrisma.shareLink.update).not.toHaveBeenCalled();
        });

        it("handles database errors during share link lookup", async () => {
            mockPrisma.shareLink.findFirst.mockRejectedValue(new Error("Database error"));

            await expect(revokeShareLink({ userId, id: shareLinkId })).rejects.toThrow("Database error");
            expect(mockPrisma.shareLink.update).not.toHaveBeenCalled();
        });

        it("handles database errors during share link update", async () => {
            mockPrisma.shareLink.findFirst.mockResolvedValue({
                ...mockShareLink,
                isActive: true,
                revokedAt: null,
            });
            mockPrisma.shareLink.update.mockRejectedValue(new Error("Update failed"));

            await expect(revokeShareLink({ userId, id: shareLinkId })).rejects.toThrow("Update failed");
        });

        it("handles different share link IDs correctly", async () => {
            const differentId = "sl_different_123";
            const differentShareLink = {
                ...mockShareLink,
                id: differentId,
                isActive: true,
                revokedAt: null,
            };

            const revokedShareLink = {
                ...differentShareLink,
                revokedAt: now,
                isActive: false,
            };

            mockPrisma.shareLink.findFirst.mockResolvedValue(differentShareLink);
            mockPrisma.shareLink.update.mockResolvedValue(revokedShareLink);

            const result = await revokeShareLink({ userId, id: differentId });

            expect(mockPrisma.shareLink.findFirst).toHaveBeenCalledWith({
                where: { id: differentId, project: { userId } },
            });
            expect(mockPrisma.shareLink.update).toHaveBeenCalledWith({
                where: { id: differentId },
                data: {
                    revokedAt: expect.any(Date),
                    isActive: false,
                },
            });
            expect(result.id).toBe(differentId);
        });

        it("verifies proper ownership check in where clause", async () => {
            mockPrisma.shareLink.findFirst.mockResolvedValue({
                ...mockShareLink,
                isActive: true,
                revokedAt: null,
            });
            mockPrisma.shareLink.update.mockResolvedValue({
                ...mockShareLink,
                revokedAt: now,
                isActive: false,
            });

            await revokeShareLink({ userId, id: shareLinkId });

            expect(mockPrisma.shareLink.findFirst).toHaveBeenCalledWith({
                where: {
                    id: shareLinkId,
                    project: { userId },
                },
            });
        });

        it("sets correct timestamp for revocation", async () => {
            mockPrisma.shareLink.findFirst.mockResolvedValue({
                ...mockShareLink,
                isActive: true,
                revokedAt: null,
            });
            
            const revokedAt = new Date();
            mockPrisma.shareLink.update.mockResolvedValue({
                ...mockShareLink,
                revokedAt: revokedAt,
                isActive: false,
            });

            const result = await revokeShareLink({ userId, id: shareLinkId });

            expect(mockPrisma.shareLink.update).toHaveBeenCalledWith({
                where: { id: shareLinkId },
                data: {
                    revokedAt: expect.any(Date),
                    isActive: false,
                },
            });
            expect(result.revokedAt).toEqual(revokedAt);
            expect(result.isActive).toBe(false);
        });
    });
});
