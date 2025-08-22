import prisma from "../lib/prisma";

export async function upsertAppUser(data: any, type: string) {
    console.log("➡️ upsertAppUser called");
    console.log("Event type:", type);
    console.log("Raw data:", JSON.stringify(data, null, 2));
    console.log("User ID (clerkId):", data?.id);

    if (type === "user.deleted") {
        console.log("Marking user as inactive:", data?.id);
        return prisma.appUser.update({
            where: { clerkId: data.id },
            data: { isActive: false },
        });
    }

    console.log("Upserting user:", {
        clerkId: data?.id,
        email: data?.email_addresses?.[0]?.email_address,
        username: data?.username,
        firstName: data?.first_name,
        lastName: data?.last_name,
        imageUrl: data?.image_url,
    });

    return prisma.appUser.upsert({
        where: { clerkId: data.id },
        create: {
            clerkId: data.id,
            email: data.email_addresses?.[0]?.email_address ?? null,
            username: data.username ?? null,
            firstName: data.first_name ?? null,
            lastName: data.last_name ?? null,
            imageUrl: data.image_url ?? null,
            isActive: true,
        },
        update: {
            email: data.email_addresses?.[0]?.email_address ?? null,
            username: data.username ?? null,
            firstName: data.first_name ?? null,
            lastName: data.last_name ?? null,
            imageUrl: data.image_url ?? null,
            isActive: true,
        },
    });
}
