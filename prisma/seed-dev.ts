import { prisma } from "../lib/prisma";
import { auth } from "../lib/auth";

/**
 * Populates a fresh dev/preview database with a realistic-looking, fully
 * fictional marketplace: a couple of sellers, an org store, a buyer, real
 * boot listings, and a live org-inbox conversation. Meant for Vercel preview
 * branches — never point this at production data.
 *
 * Shared login for anyone testing a preview: demo@mdfld.co / MdfldPreview2026!
 * (member of the seeded Whitfield FC Gear org, so the org inbox is visible.)
 */

const DEMO_PASSWORD = "MdfldPreview2026!";

const PLACEHOLDER_IMAGE = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`;

async function createUser(opts: {
  email: string;
  name: string;
  username: string;
  bio?: string;
  role?: "BUYER" | "SELLER";
}) {
  const { user } = await auth.api.signUpEmail({
    body: {
      email: opts.email,
      password: DEMO_PASSWORD,
      name: opts.name,
    },
  });

  return prisma.user.update({
    where: { id: user.id },
    data: {
      username: opts.username,
      displayUsername: opts.username,
      emailVerified: true,
      bio: opts.bio,
      role: opts.role ?? "BUYER",
      isVerifiedSeller: opts.role === "SELLER",
    },
  });
}

async function main() {
  console.log("Seeding dev database...");

  const demo = await createUser({
    email: "demo@mdfld.co",
    name: "Demo Account",
    username: "demo",
    bio: "Shared login for previewing MDFLD trial branches.",
  });

  const sofia = await createUser({
    email: "sofia.reyes@example.com",
    name: "Sofia Reyes",
    username: "sofia.reyes",
    bio: "Boot collector turned reseller. Based in Austin, TX.",
    role: "SELLER",
  });

  const jordan = await createUser({
    email: "jordan.whitfield@example.com",
    name: "Jordan Whitfield",
    username: "jwhitfield",
    bio: "Running Whitfield FC Gear with the team.",
  });

  const dez = await createUser({
    email: "dez.okafor@example.com",
    name: "Dez Okafor",
    username: "dez.okafor",
    bio: "Looking for match-worn kits and rare boots.",
  });

  // --- Individual seller: Sofia's personal store ---
  const sofiaSeller = await prisma.sellerProfile.create({
    data: {
      userId: sofia.id,
      storeName: "Sofia's Boot Room",
      storeDescription: "Curated resale — mostly Nike and Adidas boots, all condition-checked.",
      businessEmail: sofia.email,
      isActive: true,
    },
  });

  await prisma.product.createMany({
    data: [
      {
        sellerProfileId: sofiaSeller.id,
        title: "Nike Mercurial Vapor 15 Elite FG",
        description: "Worn twice indoors, otherwise game-ready. Size US 9.",
        price: 165.0,
        category: "BOOTS",
        brand: "Nike",
        condition: "USED_LIKE_NEW",
        images: [PLACEHOLDER_IMAGE("mercurial-vapor-15")],
        tags: ["nike", "mercurial", "firm-ground"],
        inventory: 5,
      },
      {
        sellerProfileId: sofiaSeller.id,
        title: "Adidas Predator Accuracy+ FG",
        description: "Brand new with tags, half size up recommended.",
        price: 220.0,
        category: "BOOTS",
        brand: "Adidas",
        condition: "NEW_WITH_TAGS",
        images: [PLACEHOLDER_IMAGE("predator-accuracy")],
        tags: ["adidas", "predator", "firm-ground"],
        inventory: 5,
      },
    ],
  });

  // --- Org store: Whitfield FC Gear ---
  const org = await prisma.organization.create({
    data: {
      name: "Whitfield FC Gear",
      slug: "whitfield-fc-gear",
      description: "Small-batch match-worn kits and boots, sourced directly from lower-league clubs.",
      businessType: "SMALL_BUSINESS",
      isVerified: true,
      storeStatus: "APPROVED",
    },
  });

  await prisma.organizationMember.createMany({
    data: [
      { organizationId: org.id, userId: jordan.id, role: "owner" },
      { organizationId: org.id, userId: demo.id, role: "admin" },
    ],
  });

  const orgSeller = await prisma.sellerProfile.create({
    data: {
      organizationId: org.id,
      storeName: "Whitfield FC Gear",
      storeDescription: "Small-batch match-worn kits and boots.",
      businessEmail: "store@whitfieldfc.example.com",
      isActive: true,
    },
  });

  await prisma.product.createMany({
    data: [
      {
        sellerProfileId: orgSeller.id,
        organizationId: org.id,
        title: "Puma Future Ultimate FG/AG",
        description: "Club-issued, unworn. Size US 10.5.",
        price: 190.0,
        category: "BOOTS",
        brand: "Puma",
        condition: "BRAND_NEW",
        images: [PLACEHOLDER_IMAGE("puma-future-ultimate")],
        tags: ["puma", "future", "club-issued"],
        inventory: 5,
      },
      {
        sellerProfileId: orgSeller.id,
        organizationId: org.id,
        title: "Whitfield FC Home Kit 2025/26",
        description: "Match-worn, player-issue fit. Washed, no repairs needed.",
        price: 85.0,
        category: "JERSEYS",
        brand: "Whitfield FC",
        condition: "USED_GOOD",
        images: [PLACEHOLDER_IMAGE("whitfield-home-kit")],
        tags: ["jersey", "match-worn"],
        inventory: 5,
      },
    ],
  });

  // --- Org inbox conversation: Dez asking Whitfield FC Gear about a boot ---
  const conversation = await prisma.conversation.create({
    data: {
      type: "ORGANIZATION",
      participants: {
        create: [
          { userId: dez.id, role: "member" },
          { userId: demo.id, role: "member" },
        ],
      },
    },
  });

  await prisma.orgConversation.create({
    data: {
      organizationId: org.id,
      conversationId: conversation.id,
      handledBy: demo.id,
      status: "OPEN",
    },
  });

  const messages = [
    { senderId: dez.id, content: "Hey! Is the Future Ultimate true to size, or should I go half up?" },
    { senderId: demo.id, content: "True to size for us — most buyers stick with their usual size." },
    { senderId: dez.id, content: "Perfect, grabbing a pair now. Thanks!" },
  ];

  let lastMessageId: string | undefined;
  for (const m of messages) {
    const created = await prisma.message.create({
      data: { conversationId: conversation.id, senderId: m.senderId, content: m.content },
    });
    lastMessageId = created.id;
  }

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageId, lastMessageAt: new Date() },
  });

  console.log("Done. Shared login: demo@mdfld.co / " + DEMO_PASSWORD);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
