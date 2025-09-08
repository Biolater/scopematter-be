import { ServiceError } from "../utils/service-error";
import { ServiceErrorCodes } from "../utils/service-error-codes";
import prisma from "../lib/prisma";
import { CreateRequestInput, GetRequestsInput, UpdateRequestInput } from "../lib/types/request";

export const createRequest = async ({ projectId, description, userId }: CreateRequestInput) => {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND);
    }

    return tx.request.create({
      data: { projectId, description, status: "PENDING" },
    });
  });
};

export const getRequests = async ({ projectId, userId }: GetRequestsInput) => {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new ServiceError(ServiceErrorCodes.PROJECT_NOT_FOUND);
    }

    return tx.request.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
  });
};

export const updateRequest = async ({ id, userId, data }: UpdateRequestInput) => {
  return prisma.$transaction(async (tx) => {
    const request = await tx.request.findFirst({
      where: { id, project: { userId } },
    });

    if (!request) {
      throw new ServiceError(ServiceErrorCodes.REQUEST_NOT_FOUND);
    }

    // Strip out undefined values before updating
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    return tx.request.update({
      where: { id },
      data: cleanData,
    });
  });
};