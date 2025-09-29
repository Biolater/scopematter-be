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