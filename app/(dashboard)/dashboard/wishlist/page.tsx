"use client";

import { useState, useEffect } from "react";
import { Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import SidebarWrapper from "@/components/sidebar/dashboard/app";
import ProductCard from "@/components/product-card";
import { Button } from "@heroui/react";

interface WishlistItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: string;
  condition: string;
  description?: string;
  seller?: {
    id: string;
    storeName: string;
    averageRating: number;
  };
  sellerName?: string;
  isActive: boolean;
  inventory: number;
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      fetchWishlistItems();
    }
  }, [session]);

  const fetchWishlistItems = async () => {
    try {
      const response = await fetch("/api/wishlist");
      if (response.ok) {
        const data = await response.json();
        // Transform the data to match ProductCard format
        const transformedItems = data.items.map((item: any) => ({
          ...item,
          slug: item.slug || item.title.toLowerCase().replace(/\s+/g, "-"),
          images: item.images || [item.image],
          seller: item.seller || {
            id: item.sellerId || "",
            storeName: item.sellerName || "Unknown Seller",
            averageRating: 0,
          },
        }));
        setWishlistItems(transformedItems);
      }
    } catch (error) {
      // Failed to fetch wishlist items
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <SidebarWrapper>
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Content */}
            {wishlistItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <Icon
                  icon="solar:heart-broken-linear"
                  className="w-20 h-20 text-default-300 mb-4"
                />
                <h2 className="text-2xl font-semibold text-default-700 mb-2">
                  Your wishlist is empty
                </h2>
                <p className="text-default-500 mb-6">
                  Start adding items you love to your wishlist
                </p>
                <Button
                  color="primary"
                  onPress={() => router.push("/products")}
                  startContent={<Icon icon="solar:bag-smile-outline" />}
                >
                  Browse Products
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {wishlistItems.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    isWishlisted={true}
                    className="w-full animate-appearance-in"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarWrapper>
    </div>
  );
}
