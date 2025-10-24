import { prisma } from "@/lib/prisma";

export async function getOrganizationBySlug(slug: string) {
  const organization = await prisma.organization.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      products: {
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 12,
      },
      sellerProfile: {
        include: {
          _count: {
            select: {
              products: true,
              reviews: true,
            },
          },
        },
      },
      _count: {
        select: {
          products: {
            where: {
              isActive: true,
            },
          },
          orders: true,
          members: true,
        },
      },
    },
  });

  if (!organization) return null;

  // Serialize Decimal fields in products
  return {
    ...organization,
    products: organization.products.map((product) => ({
      ...product,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice
        ? Number(product.compareAtPrice)
        : null,
    })),
    sellerProfile: organization.sellerProfile
      ? {
          ...organization.sellerProfile,
          averageRating: Number(organization.sellerProfile.averageRating),
        }
      : null,
  };
}
