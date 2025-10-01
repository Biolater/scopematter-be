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
    project: {
        name: string;
        description: string | null | undefined;
    };
    client: {
        name: string;
        company: string | null | undefined;
    };
    scopeItems: Array<{
        id: string;
        name: string;
        description: string | null | undefined;
        status: string;
    }>;
    requests: Array<{
        id: string;
        description: string;
        status: string;
    }>;
    changeOrders: Array<{
        id: string;
        priceUsd: number;
        extraDays: number | null;
        status: string;
    }>;
    permissions: ShareLinkPermissions;
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