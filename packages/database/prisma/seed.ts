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

  // Look up seeded menu items we'll reference below, by flavor+size, so the
  // order/subscription/delivery line items snapshot real ids/prices.
  const findItem = async (protein: "CHICKEN" | "BEEF" | "SHRIMP", flavor: string, sizeGrams: number) => {
    const item = await prisma.menuItem.findFirstOrThrow({ where: { protein, flavor, sizeGrams } });
    return item;
  };

  const chickenXaXiu150 = await findItem("CHICKEN", "xá xíu", 150);
  const chickenXaXiu250 = await findItem("CHICKEN", "xá xíu", 250);
  const chickenTeriyaki150 = await findItem("CHICKEN", "teriyaki", 150);
  const beefHerb150 = await findItem("BEEF", "herb", 150);
  const shrimpHerb150 = await findItem("SHRIMP", "herb", 150);

  // --- Test customers -----------------------------------------------------
  await prisma.customer.deleteMany({});
  const customerA = await prisma.customer.create({
    data: { name: "Nguyễn Văn An", phone: "0901111111", zalo: "0901111111", address: "12 Nguyễn Huệ, Q1, TP.HCM" },
  });
  const customerB = await prisma.customer.create({
    data: { name: "Trần Thị Bích", phone: "0902222222", zalo: "0902222222", address: "45 Lê Lợi, Q1, TP.HCM" },
  });
  const customerC = await prisma.customer.create({
    data: { name: "Lê Văn Cường", phone: "0903333333", address: "78 Hai Bà Trưng, Q3, TP.HCM" },
  });
  console.log("Seeded 3 test customers.");

  // --- Test one-off orders -------------------------------------------------
  await prisma.order.deleteMany({});
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const addDays = (d: Date, n: number) => {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + n);
    return copy;
  };
  const lineTotal = (items: { unitPrice: number; qty: number }[]) =>
    items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);

  const orderSeeds = [
    {
      customer: customerA,
      deliveryDate: addDays(today, -1),
      paymentStatus: "PAID" as const,
      status: "COMPLETED" as const,
      items: [{ menuItem: chickenXaXiu250, qty: 2 }],
      notes: "Giao trước 11h",
    },
    {
      customer: customerB,
      deliveryDate: today,
      paymentStatus: "PAID" as const,
      status: "COMPLETED" as const,
      items: [{ menuItem: beefHerb150, qty: 3 }, { menuItem: chickenTeriyaki150, qty: 2 }],
    },
    {
      customer: customerA,
      deliveryDate: today,
      paymentStatus: "UNPAID" as const,
      status: "PENDING_CONFIRMATION" as const,
      items: [{ menuItem: chickenXaXiu150, qty: 4 }],
    },
    {
      customer: customerC,
      deliveryDate: addDays(today, 1),
      paymentStatus: "DEPOSIT" as const,
      status: "CONFIRMED" as const,
      items: [{ menuItem: shrimpHerb150, qty: 5 }],
      notes: "Khách dị ứng hải sản cay",
    },
    {
      customer: customerB,
      deliveryDate: addDays(today, 3),
      paymentStatus: "UNPAID" as const,
      status: "PENDING_CONFIRMATION" as const,
      items: [{ menuItem: chickenXaXiu250, qty: 1 }, { menuItem: beefHerb150, qty: 1 }],
    },
  ];

  for (const o of orderSeeds) {
    const items = o.items.map((i) => ({
      menuItemId: i.menuItem.id,
      protein: i.menuItem.protein,
      flavor: i.menuItem.flavor,
      sizeGrams: i.menuItem.sizeGrams,
      unitPrice: i.menuItem.price,
      qty: i.qty,
    }));
    const subtotal = lineTotal(items);
    await prisma.order.create({
      data: {
        customerId: o.customer.id,
        customerName: o.customer.name,
        deliveryDate: o.deliveryDate,
        paymentStatus: o.paymentStatus,
        status: o.status,
        source: "ONE_OFF",
        paymentMethod: "CASH_ON_DELIVERY",
        deliveryAddress: o.customer.address,
        subtotal,
        discountAmount: 0,
        total: subtotal,
        notes: o.notes,
        items: { create: items },
      },
    });
  }
  console.log(`Seeded ${orderSeeds.length} test orders.`);

  // --- Test volume subscriptions -------------------------------------------
  await prisma.subscription.deleteMany({});

  // Subscription 1 (customer A): 30kg chicken + 10kg beef, 1kg/day, started
  // 3 days ago — includes 3 already-DELIVERED days (so pool balances are
  // visibly drawn down) plus 2 upcoming SCHEDULED days.
  const sub1Start = addDays(today, -3);
  const sub1 = await prisma.subscription.create({
    data: {
      customerId: customerA.id,
      customerName: customerA.name,
      packageName: "Gói khối lượng tháng 7 - Anh An",
      totalGrams: 40000,
      deliveryAmountGrams: 1000,
      deliveryIntervalDays: 1,
      startDate: sub1Start,
      totalPrice: 6800000,
      paymentStatus: "PAID",
      status: "ACTIVE",
      pools: {
        create: [
          { protein: "CHICKEN", totalGrams: 30000, remainingGrams: 30000 - 3 * 750 },
          { protein: "BEEF", totalGrams: 10000, remainingGrams: 10000 - 3 * 300 },
        ],
      },
    },
  });

  const sub1OrderDay = (offset: number, status: "COMPLETED" | "PENDING_CONFIRMATION") => {
    const items = [
      {
        menuItemId: chickenXaXiu150.id,
        protein: "CHICKEN" as const,
        flavor: chickenXaXiu150.flavor,
        sizeGrams: chickenXaXiu150.sizeGrams,
        unitPrice: chickenXaXiu150.price,
        qty: 5, // 5 × 150g = 750g
      },
      {
        menuItemId: beefHerb150.id,
        protein: "BEEF" as const,
        flavor: beefHerb150.flavor,
        sizeGrams: beefHerb150.sizeGrams,
        unitPrice: beefHerb150.price,
        qty: 2, // 2 × 150g = 300g
      },
    ];
    const subtotal = lineTotal(items);
    return prisma.order.create({
      data: {
        subscriptionId: sub1.id,
        source: "SUBSCRIPTION",
        customerId: customerA.id,
        customerName: customerA.name,
        deliveryDate: addDays(sub1Start, offset),
        status,
        paymentStatus: "PAID",
        paymentMethod: "CASH_ON_DELIVERY",
        deliveryAddress: customerA.address,
        fulfillmentType: "SCHEDULED",
        subtotal,
        discountAmount: 0,
        total: subtotal,
        items: { create: items },
      },
    });
  };

  await sub1OrderDay(0, "COMPLETED");
  await sub1OrderDay(1, "COMPLETED");
  await sub1OrderDay(2, "COMPLETED");
  await sub1OrderDay(3, "PENDING_CONFIRMATION"); // today
  await sub1OrderDay(4, "PENDING_CONFIRMATION"); // tomorrow

  // Subscription 2 (customer B): 15kg shrimp, 1.5kg every 3 days, starts
  // today — one upcoming order, nothing completed yet.
  const sub2 = await prisma.subscription.create({
    data: {
      customerId: customerB.id,
      customerName: customerB.name,
      packageName: "Gói tôm 2 tuần - Chị Bích",
      totalGrams: 15000,
      deliveryAmountGrams: 1500,
      deliveryIntervalDays: 3,
      startDate: today,
      totalPrice: 4500000,
      paymentStatus: "DEPOSIT",
      status: "ACTIVE",
      pools: { create: [{ protein: "SHRIMP", totalGrams: 15000, remainingGrams: 15000 }] },
    },
  });
  const sub2Items = [
    {
      menuItemId: shrimpHerb150.id,
      protein: "SHRIMP" as const,
      flavor: shrimpHerb150.flavor,
      sizeGrams: shrimpHerb150.sizeGrams,
      unitPrice: shrimpHerb150.price,
      qty: 10, // 10 × 150g = 1500g
    },
  ];
  const sub2Subtotal = lineTotal(sub2Items);
  await prisma.order.create({
    data: {
      subscriptionId: sub2.id,
      source: "SUBSCRIPTION",
      customerId: customerB.id,
      customerName: customerB.name,
      deliveryDate: today,
      status: "PENDING_CONFIRMATION",
      paymentStatus: "DEPOSIT",
      paymentMethod: "CASH_ON_DELIVERY",
      deliveryAddress: customerB.address,
      fulfillmentType: "SCHEDULED",
      subtotal: sub2Subtotal,
      discountAmount: 0,
      total: sub2Subtotal,
      items: { create: sub2Items },
    },
  });

  // Subscription 3 (customer C): small chicken pool almost consumed, to
  // exercise the "nearing depletion" dashboard stat.
  await prisma.subscription.create({
    data: {
      customerId: customerC.id,
      customerName: customerC.name,
      packageName: "Gói dùng thử - Anh Cường",
      totalGrams: 5000,
      deliveryAmountGrams: 500,
      deliveryIntervalDays: 2,
      startDate: addDays(today, -10),
      totalPrice: 900000,
      paymentStatus: "PAID",
      status: "ACTIVE",
      pools: { create: [{ protein: "CHICKEN", totalGrams: 5000, remainingGrams: 400 }] },
    },
  });

  console.log("Seeded 3 test volume subscriptions (with order history for one).");

  // --- Test custom plan requests -------------------------------------------
  await prisma.customPlanRequest.deleteMany({});
  await prisma.customPlanRequest.create({
    data: {
      customerId: customerC.id,
      customerName: customerC.name,
      phone: customerC.phone,
      desiredProteins: ["CHICKEN", "SHRIMP"],
      estimatedTotalGrams: 20000,
      preferredIntervalDays: 2,
      budgetHint: 3500000,
      notes: "Muốn tăng cơ, ít tinh bột, giao 3 lần/tuần buổi sáng.",
      status: "PENDING",
    },
  });
  await prisma.customPlanRequest.create({
    data: {
      customerName: "Phạm Thị Dung",
      phone: "0904444444",
      desiredProteins: ["BEEF"],
      notes: "Hỏi thử gói bò riêng cho cả tuần, chưa chắc số lượng.",
      status: "REVIEWED",
      adminNotes: "Đã gọi tư vấn, đang chờ khách chốt ngân sách.",
    },
  });
  console.log("Seeded 2 test custom plan requests.");

  // --- Seed default discount codes ------------------------------------------
  await prisma.discount.deleteMany({});
  const welcomeDiscount = await prisma.discount.create({
    data: {
      code: "WELCOME10",
      type: "PERCENTAGE",
      amount: 10,
      isActive: true,
      startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      endsAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 years later
    },
  });
  console.log(`Seeded default discount code: ${welcomeDiscount.code}`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
