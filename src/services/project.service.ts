import { CreateProjectInput } from "../lib/types/project";
import prisma from "../lib/prisma";

export const createProject = async (data: CreateProjectInput) => {
    return prisma.$transaction(async (tx) => {
        const client = await tx.client.create({
            data: {
                name: data.client.name,
                email: data.client.email,
                company: data.client.company,
            },
        });

        return tx.project.create({
            data: {
                name: data.name,
                description: data.description,
                userId: data.userId,
                clientId: client.id,
            },
        });
    });
};
