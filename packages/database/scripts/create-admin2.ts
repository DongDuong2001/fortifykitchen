// One-off helper to add a second admin account WITHOUT re-running the full
// seed (which would wipe/recreate test customers/orders/subscriptions).
// Run from packages/database with: pnpm exec tsx scripts/create-admin2.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Password: Minhhao03102003
const PASSWORD_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$gsRbxYbs8JUjBjuSnkSFHg$pCSQ/HC398NofbFrxqFp5kDONAe13HdeYAAL0Rt5+QA";

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin2@gmail.com" },
    update: { passwordHash: PASSWORD_HASH },
    create: {
      email: "admin2@gmail.com",
      firstName: "Admin",
      lastName: "Two",
      passwordHash: PASSWORD_HASH,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log(`Ready to log in as ${admin.email}`);
}

main()
  .catch((e) => {
    console.error("Failed to create second admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
