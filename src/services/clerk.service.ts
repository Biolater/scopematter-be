import prisma from "../lib/prisma";

export async function upsertAppUser(data: any, type: string) {
    return prisma.appUser.upsert({
        where: { clerkId: data.id },
        create: {
            clerkId: data.id,
            email: data.email_addresses[0]?.email_address,
            username: data.username,
            firstName: data.first_name,
            lastName: data.last_name,
            imageUrl: data.image_url,
        },
        update: {
            email: data.email_addresses[0]?.email_address,
            username: data.username,
            firstName: data.first_name,
            lastName: data.last_name,
            imageUrl: data.image_url,
            isActive: type === "user.deleted" ? false : true,
        },
    });
}
