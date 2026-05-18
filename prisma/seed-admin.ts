import { prisma } from "../lib/prisma";

const ADMIN_EMAILS = ["ayoola@mdfld.co", "kayla@mdfld.co"];

async function main() {
  for (const email of ADMIN_EMAILS) {
    const result = await prisma.user.updateMany({
      where: { email },
      data: { role: "SUPER_ADMIN" },
    });
    console.log(`${email}: ${result.count > 0 ? "✓ set to SUPER_ADMIN" : "⚠ user not found"}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
