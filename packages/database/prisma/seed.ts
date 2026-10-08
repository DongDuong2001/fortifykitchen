import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Seed default admin
  // Password: fortifykitchen123
  const adminPasswordHash =
    "$argon2id$v=19$m=65536,t=3,p=4$fkpyszf0pM/vhcfYk4wqaA$oFHOiD2+QyDl9Z3c+H9L0X9Vn7TtvSicIOnaW+CVWfI";
  const admin = await prisma.user.upsert({
    where: { email: "admin@fortifykitchen.com" },
    // update the hash too (not just {}) so re-running the seed after a
    // password change actually applies it to an already-existing admin row.
    update: { passwordHash: adminPasswordHash },
    create: {
      email: "admin@fortifykitchen.com",
      firstName: "Admin",
      lastName: "User",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`Seeded admin user: ${admin.email}`);

  // Second admin account — Chrome's breach-password nag kept interrupting
  // login with the first account's password, so this is a plain backup
  // login that doesn't trip that check.
  const admin2PasswordHash =
    "$argon2id$v=19$m=65536,t=3,p=4$gsRbxYbs8JUjBjuSnkSFHg$pCSQ/HC398NofbFrxqFp5kDONAe13HdeYAAL0Rt5+QA";
  const admin2 = await prisma.user.upsert({
    where: { email: "admin2@gmail.com" },
    update: { passwordHash: admin2PasswordHash },
    create: {
      email: "admin2@gmail.com",
      firstName: "Admin",
      lastName: "Two",
      passwordHash: admin2PasswordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`Seeded admin user: ${admin2.email}`);

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

  // Seed the real Fortify Kitchen menu — ported verbatim from the original
  // app's src/lib/menuData.js (DEFAULT_MENU_ITEMS): chicken in 7 flavors ×
  // 2 sizes, plus single-size beef and shrimp items. Cleared and reseeded
  // each run so this stays idempotent; safe because MenuItem is only
  // referenced via an optional (onDelete: SetNull) FK from OrderItem, which
  // keeps its own protein/flavor/size/price snapshot regardless of whether
  // the source MenuItem row still exists.
  const chickenFlavors = [
    "xá xíu",
    "teriyaki",
    "cay Hàn Quốc",
    "muối ớt",
    "phô mai",
    "tiêu đen",
    "sốt thái",
  ];

  const menuItems = [
    ...chickenFlavors.flatMap((flavor) => [
      { protein: "CHICKEN" as const, flavor, sizeGrams: 150, price: 25000 },
      { protein: "CHICKEN" as const, flavor, sizeGrams: 250, price: 42000 },
    ]),
    { protein: "BEEF" as const, flavor: "herb", sizeGrams: 150, price: 50000 },
    { protein: "SHRIMP" as const, flavor: "herb", sizeGrams: 150, price: 50000 },
    { protein: "SHRIMP" as const, flavor: "muối ớt", sizeGrams: 150, price: 50000 },
    { protein: "SHRIMP" as const, flavor: "sốt thái", sizeGrams: 150, price: 50000 },
  ];

  await prisma.menuItem.deleteMany({});
  await prisma.menuItem.createMany({
    data: menuItems.map((item) => ({ ...item, isAvailable: true })),
  });

  console.log(`Seeded ${menuItems.length} menu items.`);

  // Clean up any transactional data to start fresh without mock data
  await prisma.customer.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.customPlanRequest.deleteMany({});
  console.log("Cleared mock/transactional data (customers, orders, subscriptions, custom plan requests).");

// --- Seed default discount codes ------------------------------------------
  await prisma.discount.deleteMany({});
  await prisma.discount.create({
    data: {
      code: "WELCOME10",
      type: "PERCENTAGE",
      amount: 10,
      isActive: true,
      startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      endsAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 years later
    },
  });
  console.log("Seeded default discount code: WELCOME10");

  // --- Seed default subscription plans ---------------------------------------
  const plans = [
    {
      name: "Gói 1.5 triệu",
      price: 1500000,
      voucherPercent: 5,
      description: "Tặng 5% giảm giá mọi đơn, phù hợp người mới bắt đầu",
      isActive: true,
    },
    {
      name: "Gói 3 triệu",
      price: 3000000,
      voucherPercent: 10,
      description: "Tặng 10% giảm giá mọi đơn + 1 món miễn phí/tháng",
      isActive: true,
    },
    {
      name: "Gói 5 triệu",
      price: 5000000,
      voucherPercent: 15,
      description: "Tặng 15% giảm giá mọi đơn + ưu tiên giao hàng + món miễn phí/tháng",
      isActive: true,
    },
    {
      name: "Gói 10 triệu",
      price: 10000000,
      voucherPercent: 20,
      description: "Tặng 20% giảm giá mọi đơn + ưu tiên giao hàng + miễn phí giao hàng trọn đời + tư vấn dinh dưỡng 1-1/tháng",
      isActive: true,
    },
  ];

for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    });
  }
  console.log(`Seeded ${plans.length} subscription plans.`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
