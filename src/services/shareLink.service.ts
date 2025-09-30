import { createHash } from "crypto";
import { ENV } from "../config/env";
import prisma from "../lib/prisma";
import { CreateShareLinkInput, GetShareLinkInput, GetShareLinksInput, RevokeShareLinkInput } from "../lib/types/shareLink";
import { ServiceError } from "../utils/service-error";
import { ServiceErrorCodes } from "../utils/service-error-codes";
import { generateShareToken } from "../utils/share-link";

export const createShareLink = async ({ projectId, expiresAt = null, showScopeItems = true, showRequests = true, showChangeOrders = true, userId }: CreateShareLinkInput) => {
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
            }
        })

        return {
            id: shareLink.id,
            url: `${ENV.APP_URL}/p/${token}`,
            expiresAt: shareLink.expiresAt,
            showScopeItems: shareLink.showScopeItems,
            showRequests: shareLink.showRequests,
            showChangeOrders: shareLink.showChangeOrders,
            createdAt: shareLink.createdAt,
        }
    })
}

export const getShareLink = async ({ token }: GetShareLinkInput) => {
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

    const { project } = shareLink;

    await prisma.shareLink.update({
        where: { id: shareLink.id },
        data: {
            lastViewedAt: new Date(),
            viewCount: { increment: 1 },
        },
    });


    return {
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
                priceUsd: c.priceUsd,
                extraDays: c.extraDays,
                status: c.status,
            }))
            : [],
        permissions: {
            showScopeItems: shareLink.showScopeItems,
            showRequests: shareLink.showRequests,
            showChangeOrders: shareLink.showChangeOrders,
        },
    }
};

export const getShareLinks = async ({ userId, projectId }: GetShareLinksInput) => {
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
    })

    if (!project) throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND);

    const links = await prisma.shareLink.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
    });

    return links.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())  .map((l) => ({
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
}

export const revokeShareLink = async ({ userId, id }: RevokeShareLinkInput) => {
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
    return {
        id: updatedLink.id,
        revokedAt: updatedLink.revokedAt,
        isActive: updatedLink.isActive,
    };
}