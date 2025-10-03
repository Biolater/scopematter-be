import { ChangeOrderStatus, ProjectStatus } from "@prisma/client";

export interface CreateShareLinkInput {
    projectId: string;
    expiresAt?: Date | null;
    showScopeItems?: boolean;
    showRequests?: boolean;
    showChangeOrders?: boolean;
    userId: string;
}

export interface GetShareLinkInput {
    token: string;
}

export interface GetShareLinksInput {
    userId: string;
    projectId: string;
}

export interface RevokeShareLinkInput {
    userId: string;
    id: string;
}

// -------------------- Output DTOs --------------------

export interface CreateShareLinkResponse {
    id: string;
    url: string;
    expiresAt: Date | null;
    showScopeItems: boolean;
    showRequests: boolean;
    showChangeOrders: boolean;
    createdAt: Date;
}

export interface ShareLinkPermissions {
    showScopeItems: boolean;
    showRequests: boolean;
    showChangeOrders: boolean;
}

export interface GetShareLinkResponse {
    link: {
        id: string;
        projectId: string;
        expiresAt: Date | null;
        revokedAt: Date | null;
        isActive: boolean;
        viewCount: number;
        lastViewedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        permissions: ShareLinkPermissions;
    }
    project: {
        name: string;
        description: string | null | undefined;
        status: ProjectStatus;
        client?: {
            name: string;
            company?: string | null | undefined;
        };
        createdAt: Date;
        updatedAt: Date;
    };
    scopeItems: Array<{
        id: string;
        name: string;
        description: string | null | undefined;
        status: string;
        createdAt: Date;
    }>;
    requests: Array<{
        id: string;
        description: string;
        status: string;
        createdAt: Date;
        changeOrder?: {
            id: string;
            status: ChangeOrderStatus;
        }
    }>;
    changeOrders: Array<{
        id: string;
        priceUsd: number;
        extraDays: number | null;
        status: string;
    }>;
}

export interface ShareLinkListItem {
    id: string;
    createdAt: Date;
    expiresAt: Date | null;
    revokedAt: Date | null;
    isActive: boolean;
    viewCount: number;
    lastViewedAt: Date | null;
    projectId: string;
    permissions: ShareLinkPermissions;
}

export interface RevokeShareLinkResponse {
    id: string;
    revokedAt: Date | null;
    isActive: boolean;
}