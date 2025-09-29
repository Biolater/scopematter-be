import prisma from "../lib/prisma";

export async function upsertAppUser(data: any, type: string) {
    if (type === "user.deleted") {
        console.log("Marking user as inactive:", data?.id);
        return prisma.appUser.update({
            where: { clerkId: data.id },
            data: { isActive: false },
        });
    }

    return prisma.appUser.upsert({
        where: { clerkId: data.id },
        create: {
            clerkId: data.id,
            email: data.email_addresses?.[0]?.email_address ?? null,
            firstName: data.first_name ?? null,
            lastName: data.last_name ?? null,
            imageUrl: data.image_url ?? null,
            isActive: true,
        },
        update: {
            email: data.email_addresses?.[0]?.email_address ?? null,
            firstName: data.first_name ?? null,
            lastName: data.last_name ?? null,
            imageUrl: data.image_url ?? null,
            isActive: true,
        },
    });
}
