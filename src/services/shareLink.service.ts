import { createHash } from "crypto";
import { ENV } from "../config/env";
import prisma from "../lib/prisma";
import {
    CreateShareLinkInput,
    CreateShareLinkResponse,
    GetShareLinkInput,
    GetShareLinkResponse,
    GetShareLinksInput,
    ShareLinkListItem,
    RevokeShareLinkInput,
    RevokeShareLinkResponse,
} from "../lib/types/shareLink";
import { ServiceError } from "../utils/service-error";
import { ServiceErrorCodes } from "../utils/service-error-codes";
import { generateShareToken } from "../utils/share-link";
import { redis } from "../lib/redis";

// -------------------- Create --------------------
export const createShareLink = async ({
    projectId,
    expiresAt = null,
    showScopeItems = true,
    showRequests = true,
    showChangeOrders = true,
    userId,
}: CreateShareLinkInput): Promise<CreateShareLinkResponse> => {
    return prisma.$transaction(async (tx) => {
        const project = await tx.project.findFirst({
            where: { id: projectId, userId },
        });
        if (!project) throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND);

        const { token, tokenHash } = generateShareToken();

        const shareLink = await tx.shareLink.create({
            data: {
                projectId,
                tokenHash,
                expiresAt,
                showScopeItems,
                showRequests,
                showChangeOrders,
                isActive: true,
            },
        });

        await redis.del(`share-links:${projectId}`);

        return {
            id: shareLink.id,
            url: `${ENV.APP_URL}/p/${token}`,
            expiresAt: shareLink.expiresAt,
            showScopeItems: shareLink.showScopeItems,
            showRequests: shareLink.showRequests,
            showChangeOrders: shareLink.showChangeOrders,
            createdAt: shareLink.createdAt,
        };
    });
};

// -------------------- Get single share link --------------------
export const getShareLink = async ({ token }: GetShareLinkInput): Promise<GetShareLinkResponse> => {
    // Derive hash to find link by token
    const tokenHash = createHash("sha256").update(token).digest("base64url");
    const shareLink = await prisma.shareLink.findUnique({
        where: { tokenHash },
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

    if (!shareLink) throw new ServiceError(ServiceErrorCodes.SHARE_LINK_NOT_FOUND);
    if (!shareLink.isActive) throw new ServiceError(ServiceErrorCodes.SHARE_LINK_NOT_ACTIVE);
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
        throw new ServiceError(ServiceErrorCodes.SHARE_LINK_EXPIRED);
    }

    const cacheKey = `share-link:${shareLink.id}`;
    const cached = await redis.get<GetShareLinkResponse>(cacheKey);
    if (cached) return cached;

    const { project } = shareLink;

    await prisma.shareLink.update({
        where: { id: shareLink.id },
        data: {
            lastViewedAt: new Date(),
            viewCount: { increment: 1 },
        },
    });

    const data: GetShareLinkResponse = {
        project: {
            name: project.name,
            description: project.description,
        },
        client: {
            name: project.client.name,
            company: project.client.company,
        },
        scopeItems: shareLink.showScopeItems
            ? project.scopeItems.map((s) => ({
                id: s.id,
                name: s.name,
                description: s.description,
                status: s.status,
            }))
            : [],
        requests: shareLink.showRequests
            ? project.requests.map((r) => ({
                id: r.id,
                description: r.description,
                status: r.status,
            }))
            : [],
        changeOrders: shareLink.showChangeOrders
            ? project.changeOrders.map((c) => ({
                id: c.id,
                // Prisma Decimal -> number for DTO
                priceUsd: Number(c.priceUsd),
                extraDays: c.extraDays,
                status: c.status,
            }))
            : [],
        permissions: {
            showScopeItems: shareLink.showScopeItems,
            showRequests: shareLink.showRequests,
            showChangeOrders: shareLink.showChangeOrders,
        },
    };

    await redis.set(cacheKey, data, { ex: 60 * 5 });
    return data;
};

// -------------------- Get list of share links --------------------
export const getShareLinks = async ({ userId, projectId }: GetShareLinksInput): Promise<ShareLinkListItem[]> => {
    const cacheKey = `share-links:${projectId}`;
    const cachedShareLinks = await redis.get<ShareLinkListItem[]>(cacheKey);
    if (cachedShareLinks) {
        return cachedShareLinks;
    }

    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
    });
    if (!project) throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND);

    const links = await prisma.shareLink.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
    });

    const data: ShareLinkListItem[] = links.map((l) => ({
        id: l.id,
        createdAt: l.createdAt,
        expiresAt: l.expiresAt,
        revokedAt: l.revokedAt,
        isActive: l.isActive,
        viewCount: l.viewCount,
        lastViewedAt: l.lastViewedAt,
        projectId: l.projectId,
        permissions: {
            showScopeItems: l.showScopeItems,
            showRequests: l.showRequests,
            showChangeOrders: l.showChangeOrders,
        },
    }));

    await redis.set(cacheKey, data, { ex: 60 * 5 }); // 5 minutes
    return data;
};

// -------------------- Revoke --------------------
export const revokeShareLink = async ({ userId, id }: RevokeShareLinkInput): Promise<RevokeShareLinkResponse> => {
    const link = await prisma.shareLink.findFirst({
        where: { id, project: { userId } },
    });
    if (!link) throw new ServiceError(ServiceErrorCodes.SHARE_LINK_NOT_FOUND);
    if (!link.isActive) throw new ServiceError(ServiceErrorCodes.SHARE_LINK_NOT_ACTIVE);

    const updatedLink = await prisma.shareLink.update({
        where: { id },
        data: {
            revokedAt: new Date(),
            isActive: false,
        },
    });

    await Promise.all([
        redis.del(`share-link:${id}`),
        redis.del(`share-links:${link.projectId}`),
    ]);

    return {
        id: updatedLink.id,
        revokedAt: updatedLink.revokedAt,
        isActive: updatedLink.isActive,
    };
};