import { scopeItemStatus } from "@prisma/client";

export interface CreateScopeItemInput {
    projectId: string;
    name: string;
    description: string;
    userId: string;
}

export interface GetScopeItemsInput {
    projectId: string;
    userId: string;
}

export interface DeleteScopeItemInput {
    projectId: string;
    id: string;
    userId: string;
}

export interface UpdateScopeItemInput {
    projectId: string;
    id: string;
    userId: string;
    name: string;
    description: string;
    status: scopeItemStatus
}