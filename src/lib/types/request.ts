import { UpdateRequestSchema } from "../../validation/request.schema";

export interface CreateRequestInput {
    projectId: string;
    description: string;
    userId: string;
}

export interface GetRequestsInput {
    projectId: string;
    userId: string;
}

export interface UpdateRequestInput {
    id: string;
    userId: string;
    data: UpdateRequestSchema;
}

export interface DeleteRequestInput {
    id: string;
    userId: string;
}