// One-off helper to change the admin password WITHOUT re-running the full
// seed (which would wipe/recreate test customers/orders/subscriptions).
// Run from packages/database with: pnpm exec tsx scripts/set-admin-password.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Password: fortifykitchen123
const NEW_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$fkpyszf0pM/vhcfYk4wqaA$oFHOiD2+QyDl9Z3c+H9L0X9Vn7TtvSicIOnaW+CVWfI";

async function main() {
  const admin = await prisma.user.update({
    where: { email: "admin@fortifykitchen.com" },
    data: { passwordHash: NEW_PASSWORD_HASH },
  });
  console.log(`Updated password for ${admin.email}`);
}

main()
  .catch((e) => {
    console.error("Failed to update admin password:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
