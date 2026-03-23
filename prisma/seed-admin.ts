import { prisma } from "../lib/prisma";

async function main() {
  await prisma.user.updateMany({
    where: { email: process.env.ADMIN_EMAIL! },
    data: { role: "SUPER_ADMIN" },
  });
  console.log("Admin role set for", process.env.ADMIN_EMAIL);
}
main().catch(console.error).finally(() => prisma.$disconnect());
