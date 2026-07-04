import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Seed default admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@fortifykitchen.com" },
    update: {},
    create: {
      email: "admin@fortifykitchen.com",
      firstName: "Admin",
      lastName: "User",
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$z8X5...", // placeholder hash
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`Seeded admin user: ${admin.email}`);

  // Seed default menu categories
  const categories = [
    { name: "Salads", slug: "salads" },
    { name: "Healthy Bowls", slug: "healthy-bowls" },
    { name: "Smoothies", slug: "smoothies" },
    { name: "Cold Pressed Juices", slug: "cold-pressed-juices" },
    { name: "Healthy Snacks", slug: "healthy-snacks" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
      },
    });
  }

  console.log("Seeded default menu categories.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
