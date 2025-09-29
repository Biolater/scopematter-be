import { ChangeOrderStatus } from "@prisma/client";

export interface CreateChangeOrderInput {
    projectId: string;
    requestId: string;
    priceUsd: number;
    extraDays?: number;
    userId: string;
  }  

export interface GetChangeOrdersInput {
    projectId: string;
    userId: string;
}

export interface GetChangeOrderInput {
    projectId: string;
    id: string;
    userId: string;
}

export interface UpdateChangeOrderInput {
    projectId: string;
    id: string;
    priceUsd: number | undefined;
    extraDays: number | undefined;
    status: ChangeOrderStatus | undefined;
    userId: string;
}

export interface DeleteChangeOrderInput {
    projectId: string;
    id: string;
    userId: string;
}

export interface ExportChangeOrderInput {
    projectId: string;
    id: string;
    userId: string;
}