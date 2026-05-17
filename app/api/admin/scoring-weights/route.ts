import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { _resetCache } from "@/lib/scoring/getScoringWeights";

const WEIGHTS_KEY = "listing_scoring_weights";

const DEFAULT_WEIGHTS = {
  recencyWeight: 0.35,
  relevanceWeight: 0.30,
  trustWeight: 0.20,
  priceWeight: 0.15,
};

type Weights = typeof DEFAULT_WEIGHTS;

function isValidWeights(value: unknown): value is Weights {
  if (typeof value !== "object" || value === null) return false;
  const w = value as Record<string, unknown>;
  return (
    typeof w.recencyWeight === "number" &&
    typeof w.relevanceWeight === "number" &&
    typeof w.trustWeight === "number" &&
    typeof w.priceWeight === "number"
  );
}

function isSuperAdmin(user: unknown): boolean {
  return (user as { role?: string })?.role === "SUPER_ADMIN";
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isSuperAdmin(session.user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const row = await prisma.platformSetting.findUnique({
      where: { key: WEIGHTS_KEY },
    });

    const weights =
      row && isValidWeights(row.value) ? (row.value as Weights) : DEFAULT_WEIGHTS;

    return NextResponse.json(weights);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isSuperAdmin(session.user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (!isValidWeights(body)) {
      return NextResponse.json({ error: "Invalid weights format" }, { status: 400 });
    }

    const { recencyWeight, relevanceWeight, trustWeight, priceWeight } = body as Weights;
    const sum = recencyWeight + relevanceWeight + trustWeight + priceWeight;

    if (Math.abs(sum - 1.0) > 0.001) {
      return NextResponse.json(
        { error: `Weights must sum to 1.00 (got ${sum.toFixed(2)})` },
        { status: 400 },
      );
    }

    const value = { recencyWeight, relevanceWeight, trustWeight, priceWeight };

    await prisma.platformSetting.upsert({
      where: { key: WEIGHTS_KEY },
      create: { key: WEIGHTS_KEY, value },
      update: { value },
    });

    _resetCache();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
