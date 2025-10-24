import { prisma } from "@/lib/prisma";

interface FraudScoreParams {
  userId: string;
  orderTotal: number;
  itemCount: number;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

export async function calculateFraudScore(
  params: FraudScoreParams,
): Promise<number> {
  const { userId, orderTotal, itemCount, ipAddress, userAgent } = params;

  let score = 0;
  const factors: string[] = [];

  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      buyerProfile: true,
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!user || !user.buyerProfile) {
    score += 0.3;
    factors.push("NEW_BUYER");
  } else {
    // Account age check
    const accountAge = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (accountAge < 7) {
      score += 0.2;
      factors.push("NEW_ACCOUNT");
    } else if (accountAge < 30) {
      score += 0.1;
      factors.push("YOUNG_ACCOUNT");
    }

    // Email verification
    if (!user.emailVerified) {
      score += 0.15;
      factors.push("UNVERIFIED_EMAIL");
    }

    // Previous fraud score
    if (user.buyerProfile.fraudScore > 0.5) {
      score += 0.2;
      factors.push("PREVIOUS_FRAUD_HISTORY");
    }

    // Chargeback history
    if (user.buyerProfile.chargebackCount > 0) {
      score += 0.3;
      factors.push("CHARGEBACK_HISTORY");
    }

    // Return rate
    if (user.buyerProfile.returnRate > 0.3) {
      score += 0.1;
      factors.push("HIGH_RETURN_RATE");
    }
  }

  // Order value checks
  const avgOrderValue = user?.buyerProfile?.averageOrderValue || 0;
  if (avgOrderValue > 0) {
    const deviation =
      Math.abs(orderTotal - Number(avgOrderValue)) / Number(avgOrderValue);
    if (deviation > 3) {
      score += 0.2;
      factors.push("UNUSUAL_ORDER_VALUE");
    }
  }

  // High value order
  if (orderTotal > 1000) {
    score += 0.1;
    factors.push("HIGH_VALUE_ORDER");
  }

  // Large quantity
  if (itemCount > 10) {
    score += 0.1;
    factors.push("LARGE_QUANTITY");
  }

  // Velocity checks - orders in last 24 hours
  if (user?.buyerProfile) {
    const recentOrders = await prisma.order.count({
      where: {
        buyerProfileId: user.buyerProfile.id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (recentOrders > 5) {
      score += 0.3;
      factors.push("HIGH_VELOCITY");
    } else if (recentOrders > 3) {
      score += 0.15;
      factors.push("ELEVATED_VELOCITY");
    }
  }

  // IP/Session checks
  if (ipAddress && user) {
    // Check if IP has been used by multiple accounts
    const ipUsers = await prisma.session.findMany({
      where: {
        ipAddress,
        userId: { not: userId },
      },
      distinct: ["userId"],
    });

    if (ipUsers.length > 2) {
      score += 0.2;
      factors.push("SHARED_IP");
    }

    // Check for suspicious session patterns
    const suspiciousSessions = user.sessions.filter((s: any) => s.isHighRisk);
    if (suspiciousSessions.length > 0) {
      score += 0.15;
      factors.push("SUSPICIOUS_SESSIONS");
    }
  }

  // Device fingerprint mismatch
  if (params.deviceFingerprint && user?.sessions[0]?.deviceFingerprint) {
    if (params.deviceFingerprint !== user.sessions[0].deviceFingerprint) {
      score += 0.1;
      factors.push("DEVICE_MISMATCH");
    }
  }

  // User agent analysis
  if (userAgent) {
    const botPatterns = /bot|crawler|spider|scraper|curl|wget/i;
    if (botPatterns.test(userAgent)) {
      score += 0.3;
      factors.push("BOT_DETECTED");
    }
  }

  // Update user's fraud score
  if (user?.buyerProfile) {
    await prisma.buyerProfile.update({
      where: { id: user.buyerProfile.id },
      data: {
        fraudScore: Math.min(score, 1.0),
      },
    });
  }

  // Create or update risk profile
  await prisma.riskProfile.upsert({
    where: {
      entityType_entityId: {
        entityType: "USER",
        entityId: userId,
      },
    },
    update: {
      riskScore: Math.min(score, 1.0),
      riskFactors: { factors, timestamp: new Date() },
      lastAssessment: new Date(),
      assessmentCount: { increment: 1 },
      riskHistory: {
        push: {
          score: Math.min(score, 1.0),
          factors,
          timestamp: new Date(),
        },
      },
    },
    create: {
      entityType: "USER",
      entityId: userId,
      riskScore: Math.min(score, 1.0),
      riskFactors: { factors, timestamp: new Date() },
      riskHistory: [
        {
          score: Math.min(score, 1.0),
          factors,
          timestamp: new Date(),
        },
      ],
    },
  });

  return Math.min(score, 1.0);
}

export async function assessSellerRisk(
  sellerProfileId: string,
): Promise<number> {
  let score = 0;
  const factors: string[] = [];

  const seller = await prisma.sellerProfile.findUnique({
    where: { id: sellerProfileId },
    include: {
      products: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      orders: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      },
      fraudAlerts: {
        where: { status: "ACTIVE" },
      },
    },
  });

  if (!seller) return 0;

  // Account age
  const accountAgeDays = seller.accountAge;
  if (accountAgeDays < 30) {
    score += 0.2;
    factors.push("NEW_SELLER");
  }

  // Verification level
  if (seller.verificationLevel < 3) {
    score += 0.1;
    factors.push("LOW_VERIFICATION");
  }

  // Stripe account status
  if (!seller.stripeChargesEnabled) {
    score += 0.15;
    factors.push("PAYMENTS_DISABLED");
  }

  // Active fraud alerts
  if (seller.fraudAlerts.length > 0) {
    score += 0.3;
    factors.push("ACTIVE_FRAUD_ALERTS");
  }

  // Price manipulation check
  const priceChanges = seller.products.filter(
    (p: any) => p.priceChangeFrequency > 5,
  );
  if (priceChanges.length > seller.products.length * 0.3) {
    score += 0.2;
    factors.push("FREQUENT_PRICE_CHANGES");
  }

  // Return rate from orders
  const cancelledOrders = seller.orders.filter(
    (o) => o.status === "CANCELLED" || o.status === "REFUNDED",
  );
  const returnRate =
    seller.orders.length > 0
      ? cancelledOrders.length / seller.orders.length
      : 0;
  if (returnRate > 0.2) {
    score += 0.15;
    factors.push("HIGH_CANCELLATION_RATE");
  }

  // Update seller fraud score
  await prisma.sellerProfile.update({
    where: { id: sellerProfileId },
    data: {
      fraudScore: Math.min(score, 1.0),
    },
  });

  return Math.min(score, 1.0);
}

export async function monitorProductAuthenticity(
  productId: string,
): Promise<number> {
  let score = 0;
  const factors: string[] = [];

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      seller: true,
      reviews: true,
      fraudReports: {
        where: { status: { in: ["PENDING", "IN_REVIEW"] } },
      },
    },
  });

  if (!product) return 0;

  // Price vs market check (simplified - in production, compare with market data)
  const categoryAvgPrice = await prisma.product.aggregate({
    where: {
      category: product.category,
      subcategory: product.subcategory,
      condition: product.condition,
      isActive: true,
    },
    _avg: { price: true },
  });

  if (categoryAvgPrice._avg.price) {
    const priceDeviation =
      Math.abs(Number(product.price) - Number(categoryAvgPrice._avg.price)) /
      Number(categoryAvgPrice._avg.price);
    if (priceDeviation > 0.5) {
      score += 0.2;
      factors.push("UNUSUAL_PRICE");
    }
  }

  // Seller reputation
  if (product.seller.fraudScore > 0.5) {
    score += 0.2;
    factors.push("RISKY_SELLER");
  }

  // Report count
  if (product.reportCount > 0) {
    score += 0.3;
    factors.push("REPORTED_PRODUCT");
  }

  // Active fraud reports
  if (product.fraudReports.length > 0) {
    score += 0.3;
    factors.push("FRAUD_REPORTS");
  }

  // Suspicious reviews pattern
  const suspiciousReviews = product.reviews.filter((r: any) => r.isSuspicious);
  if (suspiciousReviews.length > product.reviews.length * 0.2) {
    score += 0.1;
    factors.push("SUSPICIOUS_REVIEWS");
  }

  // Update product risk status
  await prisma.product.update({
    where: { id: productId },
    data: {
      isHighRisk: score > 0.5,
    },
  });

  return Math.min(score, 1.0);
}
