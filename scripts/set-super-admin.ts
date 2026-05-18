import { prisma } from "../lib/prisma";

async function main() {
  const user = await prisma.user.update({
    where: { email: "kayla@mdfld.co" },
    data: { role: "SUPER_ADMIN" },
    select: { id: true, email: true, role: true },
  });
  console.log("Updated:", user);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
