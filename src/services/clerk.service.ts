import prisma from "../lib/prisma";

export async function upsertAppUser(data: any, type: string) {
  const email = data.email_addresses?.[0]?.email_address ?? null;

  // Handle account deletion → soft delete
  if (type === "user.deleted") {
    console.log("Marking user as inactive:", data?.id);
    return prisma.appUser.updateMany({
      where: { clerkId: data.id },
      data: { isActive: false },
    });
  }

  // Handle account creation/update
  const existingByEmail = email
    ? await prisma.appUser.findUnique({ where: { email } })
    : null;

  if (existingByEmail && existingByEmail.clerkId !== data.id) {
    // Reactivate and update Clerk ID
    console.log("Reactivating existing user:", email);
    return prisma.appUser.update({
      where: { email },
      data: {
        clerkId: data.id,
        firstName: data.first_name ?? null,
        lastName: data.last_name ?? null,
        imageUrl: data.image_url ?? null,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }

  // Default upsert if no conflicts
  return prisma.appUser.upsert({
    where: { clerkId: data.id },
    create: {
      clerkId: data.id,
      email,
      firstName: data.first_name ?? null,
      lastName: data.last_name ?? null,
      imageUrl: data.image_url ?? null,
      isActive: true,
    },
    update: {
      email,
      firstName: data.first_name ?? null,
      lastName: data.last_name ?? null,
      imageUrl: data.image_url ?? null,
      isActive: true,
    },
  });
}