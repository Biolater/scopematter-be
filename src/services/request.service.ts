import { ServiceError } from "../utils/service-error";
import { ServiceErrorCodes } from "../utils/service-error-codes";
import prisma from "../lib/prisma";
import { CreateRequestInput, GetRequestsInput, UpdateRequestInput, DeleteRequestInput } from "../lib/types/request";
import { invalidateDashboardCache } from "../lib/cache";
import { redis } from "../lib/redis";

export const createRequest = async ({ projectId, description, userId }: CreateRequestInput) => {
  const request = await prisma.$transaction(async (tx) => {
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

  await Promise.all([
    redis.del(`project:${projectId}`),
    invalidateDashboardCache(userId),
  ]);

  return request;
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
  const request = await prisma.$transaction(async (tx) => {
    const existingRequest = await tx.request.findFirst({
      where: { id, project: { userId } },
    });

    if (!existingRequest) {
      throw new ServiceError(ServiceErrorCodes.REQUEST_NOT_FOUND);
    }

    // Strip out undefined values before updating
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    const request = await tx.request.update({
      where: { id },
      data: cleanData,
    });

    await Promise.all([
      redis.del(`project:${existingRequest.projectId}`),
      invalidateDashboardCache(userId),
    ]);

    return request;
  });



  return request;
};

export const deleteRequest = async ({ id, userId }: DeleteRequestInput) => {
  const request = await prisma.$transaction(async (tx) => {
    const existingRequest = await tx.request.findFirst({
      where: { id, project: { userId } },
    });

    if (!existingRequest) {
      throw new ServiceError(ServiceErrorCodes.REQUEST_NOT_FOUND);
    }

    const request = await tx.request.delete({
      where: { id },
    });

    await Promise.all([
      redis.del(`project:${existingRequest.projectId}`),
      invalidateDashboardCache(userId),
    ]);

    return request;
  });


  return request;
};
