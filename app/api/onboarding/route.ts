import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EMPTY_ONBOARDING_STATE } from "@/types/onboarding";
import type { OnboardingState } from "@/types/onboarding";

function parseState(raw: unknown): OnboardingState {
  if (!raw || typeof raw !== "object") return { ...EMPTY_ONBOARDING_STATE };
  const s = raw as Partial<OnboardingState>;
  return {
    buyer: Array.isArray(s.buyer) ? s.buyer : [],
    seller: Array.isArray(s.seller) ? s.seller : [],
    tours: Array.isArray(s.tours) ? s.tours : [],
    sellerOptIn: typeof s.sellerOptIn === "boolean" ? s.sellerOptIn : false,
  };
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingState: true },
  });

  return NextResponse.json(parseState(user?.onboardingState));
}

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { step, stepType, tour, sellerOptIn } = body as {
    step?: string;
    stepType?: "buyer" | "seller";
    tour?: string;
    sellerOptIn?: boolean;
  };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingState: true },
  });

  const state = parseState(user?.onboardingState);

  if (step && stepType === "buyer" && !state.buyer.includes(step as any)) {
    state.buyer = [...state.buyer, step as any];
  }
  if (step && stepType === "seller" && !state.seller.includes(step as any)) {
    state.seller = [...state.seller, step as any];
  }
  if (tour && !state.tours.includes(tour as any)) {
    state.tours = [...state.tours, tour as any];
  }
  if (sellerOptIn === true) {
    state.sellerOptIn = true;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingState: state as any },
  });

  return NextResponse.json({ ok: true });
}
