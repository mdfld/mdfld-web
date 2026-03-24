import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { ProductCategory, ProductCondition } from "@prisma/client";
import type { SizeSystem } from "@prisma/client";

const MAX_ROWS = 5000;

const rowSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  category: z.nativeEnum(ProductCategory),
  condition: z.nativeEnum(ProductCondition),
  brand: z.string().optional(),
  sku: z.string().optional(),
  inventory: z.number().int().nonnegative(),
  images: z.array(z.string()),
  tags: z.array(z.string()),
  hasVariants: z.boolean(),
  sizeValue: z.string().optional(),
  sizeSystem: z.string().optional().nullable(),
  sizeDisplay: z.string().optional(),
  variantPrice: z.number().optional(),
  variantInventory: z.number().optional(),
  variantSku: z.string().optional(),
  variantColor: z.string().optional(),
});

const bodySchema = z.object({
  rows: z.array(rowSchema).max(MAX_ROWS),
  sessionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the seller profile for this user
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!sellerProfile) {
    return NextResponse.json({ error: "No seller profile found" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Maximum ${MAX_ROWS} rows per import` }, { status: 400 });
  }

  // Check for SKU conflicts
  const skusToCheck = body.rows
    .map((r) => r.sku)
    .filter((s): s is string => !!s);
  const existingSkus = new Set(
    (await prisma.product.findMany({
      where: { sellerProfileId: sellerProfile.id, sku: { in: skusToCheck } },
      select: { sku: true },
    })).map((p) => p.sku)
  );

  let created = 0;
  let skipped = 0;

  try {
    await prisma.$transaction(async (tx) => {
      for (const row of body.rows) {
        if (row.sku && existingSkus.has(row.sku)) {
          skipped++;
          continue;
        }

        const sizeDisplay =
          row.sizeDisplay ??
          (row.sizeSystem && row.sizeValue ? `${row.sizeSystem} ${row.sizeValue}` : undefined);

        await tx.product.create({
          data: {
            sellerProfileId: sellerProfile.id,
            title: row.title,
            description: row.description || row.title,
            price: row.price,
            compareAtPrice: row.compareAtPrice,
            category: row.category,
            condition: row.condition,
            brand: row.brand,
            sku: row.sku || createId(),
            inventory: row.hasVariants ? 0 : row.inventory,
            images: row.images,
            tags: row.tags,
            isActive: false,
            hasVariants: row.hasVariants,
            variants:
              row.hasVariants && row.sizeValue && row.sizeSystem
                ? {
                    create: [
                      {
                        sizeValue: row.sizeValue,
                        sizeSystem: row.sizeSystem as SizeSystem,
                        sizeDisplay: sizeDisplay ?? `${row.sizeSystem} ${row.sizeValue}`,
                        color: row.variantColor,
                        sku: row.variantSku,
                        price: row.variantPrice ?? row.price,
                        inventory: row.variantInventory ?? row.inventory,
                      },
                    ],
                  }
                : undefined,
          },
        });
        created++;
      }
    });
  } catch (error) {
    console.error("[bulk-import/confirm] transaction failed:", error);
    return NextResponse.json(
      { error: "Import failed. No products were created. Please try again." },
      { status: 500 }
    );
  }

  // Clean up ImportSession if one was used
  if (body.sessionId) {
    await prisma.importSession.deleteMany({ where: { id: body.sessionId } });
  }

  return NextResponse.json({ created, skipped, reason: skipped > 0 ? "duplicate_sku" : undefined });
}
