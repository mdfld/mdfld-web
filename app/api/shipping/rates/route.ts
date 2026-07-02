import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getShippingRates, type RateOption } from "@/lib/easypost";

type ShipmentResult = {
  sellerId: string
  sellerName: string
  standard: RateOption & { service: string }
  express: (RateOption & { service: string }) | null
}

export async function POST(request: NextRequest) {
  try {
    const { toAddress, items } = await request.json();

    if (!toAddress?.street || !toAddress?.city || !toAddress?.state || !toAddress?.zip || !toAddress?.country) {
      return NextResponse.json({ error: "Invalid delivery address" }, { status: 400 });
    }

    const settings = await prisma.platformSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
      select: { shippingMarkupPct: true, shippingFlatRateCents: true },
    });

    const { shippingMarkupPct, shippingFlatRateCents } = settings;

    // Group items by sellerId
    const bySeller: Record<string, typeof items> = {};
    for (const item of items) {
      if (!bySeller[item.sellerId]) bySeller[item.sellerId] = [];
      bySeller[item.sellerId].push(item);
    }

    const shipments: ShipmentResult[] = [];

    for (const [sellerId, sellerItems] of Object.entries(bySeller)) {
      const productIds = sellerItems.map((i: any) => i.productId);

      const [sellerProfile, products] = await Promise.all([
        prisma.sellerProfile.findUnique({
          where: { id: sellerId },
          select: { storeName: true, organizationId: true },
        }),
        prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, weight: true, dimensions: true, shippingTerms: true },
        }),
      ]);

      const sellerName = sellerProfile?.storeName ?? "Seller";
      const fallback = (svc: string): ShipmentResult => ({
        sellerId,
        sellerName,
        standard: { easypostRateId: "", carrier: "", service: svc, rateCents: svc === "DDP" ? 0 : shippingFlatRateCents, totalCents: svc === "DDP" ? 0 : shippingFlatRateCents, deliveryDays: null },
        express: null,
      });

      // DDP check — all items must be DDP
      const allDdp = products.every((p) => p.shippingTerms === "INCLUDED_DDP");
      if (allDdp) { shipments.push(fallback("DDP")); continue; }

      // Seller address check
      const org = sellerProfile?.organizationId
        ? await prisma.organization.findUnique({
            where: { id: sellerProfile.organizationId },
            select: { addressStreet: true, addressCity: true, addressState: true, addressZip: true, addressCountry: true },
          })
        : null;

      const fromAddress = org?.addressStreet && org?.addressCity && org?.addressState && org?.addressZip && org?.addressCountry
        ? { street: org.addressStreet, city: org.addressCity, state: org.addressState, zip: org.addressZip, country: org.addressCountry }
        : null;

      if (!fromAddress) { shipments.push(fallback("FALLBACK")); continue; }

      // Build parcel — sum weights, largest dimensions
      let totalWeightOz = 0;
      let maxL = 0, maxW = 0, maxH = 0;

      for (const item of sellerItems) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) continue;
        const qty = item.quantity ?? 1;
        totalWeightOz += (product.weight ?? 0.5) * 35.274 * qty;
        const dims = product.dimensions as { length?: number; width?: number; height?: number } | null;
        maxL = Math.max(maxL, dims?.length ?? 10);
        maxW = Math.max(maxW, dims?.width ?? 10);
        maxH = Math.max(maxH, dims?.height ?? 10);
      }

      if (totalWeightOz === 0) totalWeightOz = 16; // 1 lb fallback

      try {
        const rates = await getShippingRates({
          fromAddress,
          toAddress,
          parcel: { weightOz: totalWeightOz, length: maxL, width: maxW, height: maxH },
          markupPct: shippingMarkupPct,
        });
        shipments.push({ sellerId, sellerName, ...rates });
      } catch {
        shipments.push(fallback("FALLBACK"));
      }
    }

    return NextResponse.json({ shipments });
  } catch (error) {
    console.error("[shipping/rates] error:", error);
    return NextResponse.json({ error: "Failed to calculate shipping rates" }, { status: 500 });
  }
}
