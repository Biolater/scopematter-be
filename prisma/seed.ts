/* import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Create a mock freelancer (AppUser)
  const user = await prisma.appUser.create({
    data: {
      clerkId: "mock_clerk_id_123",
      email: "freelancer@example.com",
      firstName: "Alice",
      lastName: "Johnson",
      imageUrl: "https://via.placeholder.com/150",
    },
  });

  // 2. Create a mock client
  const client = await prisma.client.create({
    data: {
      name: "Acme Corp",
      email: "client@acme.com",
      company: "Acme Corporation",
    },
  });

  // 3. Create a project
  const project = await prisma.project.create({
    data: {
      name: "Marketing Website Revamp",
      description: "Build a new landing page and blog for Acme Corp",
      userId: user.id,
      clientId: client.id,
    },
  });

  // 4. Add scope items
  await prisma.scopeItem.createMany({
    data: [
      { projectId: project.id, description: "Landing page design" },
      { projectId: project.id, description: "3-page blog implementation" },
      { projectId: project.id, description: "Contact form integration" },
    ],
  });

  // 5. Add a client request
  const request = await prisma.request.create({
    data: {
      projectId: project.id,
      description: "Add a dashboard export to CSV",
      status: "OUT_OF_SCOPE",
    },
  });

  // 6. Create a change order for that request
  await prisma.changeOrder.create({
    data: {
      requestId: request.id,
      projectId: project.id,
      userId: user.id,
      priceUsd: 300.0,
      extraDays: 5,
      status: "PENDING",
    },
  });

  console.log("✅ Mock data for Scopematter inserted!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
 */