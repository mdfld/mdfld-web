"use client";

import React from "react";
import { Button, Image, Skeleton } from "@heroui/react";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";
import Link from "next/link";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export type ProductCardProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "id"
> & {
  product: {
    id: string;
    title: string;
    slug: string;
    description?: string;
    price: number;
    images: string[];
    category: string;
    condition: string;
    isActive: boolean;
    seller?: {
      id: string;
      storeName: string;
      averageRating: number;
    };
  };
  isLoading?: boolean;
  isWishlisted?: boolean;
  onWishlistChange?: (wishlisted: boolean) => void;
};

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  (
    {
      product,
      isLoading,
      isWishlisted: initialWishlisted = false,
      onWishlistChange,
      className,
      ...props
    },
    ref,
  ) => {
    const { user } = useAuth();
    const utils = trpc.useUtils();

    // Get current wishlist state
    const { data: wishlistProducts } = trpc.user.getWishlist.useQuery(
      undefined,
      { enabled: !!user },
    );

    // Check if this product is in the wishlist
    const isWishlisted = React.useMemo(() => {
      return wishlistProducts?.some((p: any) => p.id === product.id) || false;
    }, [wishlistProducts, product.id]);

    // Add to wishlist mutation
    const addToWishlist = trpc.user.addToWishlist.useMutation({
      onSuccess: () => {
        onWishlistChange?.(true);
        toast.success("Added to wishlist");
        // Invalidate user query to refresh wishlist
        utils.user.getWishlist.invalidate();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to add to wishlist");
      },
    });

    // Remove from wishlist mutation
    const removeFromWishlist = trpc.user.removeFromWishlist.useMutation({
      onSuccess: () => {
        onWishlistChange?.(false);
        toast.success("Removed from wishlist");
        // Invalidate user query to refresh wishlist
        utils.user.getWishlist.invalidate();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to remove from wishlist");
      },
    });

    // Add to cart mutation
    const addToCart = trpc.cart.addItem.useMutation({
      onSuccess: () => {
        toast.success("Added to bag");
        utils.cart.get.invalidate();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to add to bag");
      },
    });

    const handleWishlistToggle = () => {
      if (!user) {
        toast.error("Please log in to save items");
        return;
      }

      if (isWishlisted) {
        removeFromWishlist.mutate({ productId: product.id });
      } else {
        addToWishlist.mutate({ productId: product.id });
      }
    };

    const handleAddToBag = () => {
      if (!user) {
        toast.error("Please log in to add items to bag");
        return;
      }

      addToCart.mutate({
        productId: product.id,
        quantity: 1,
      });
    };

    const isProcessing =
      addToWishlist.isPending || removeFromWishlist.isPending;
    const isAddingToBag = addToCart.isPending;

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full flex-none flex-col gap-3",
          className,
        )}
        {...props}
      >
        <Button
          isIconOnly
          className="bg-background/60 dark:bg-default-100/50 absolute top-3 right-3 z-20 backdrop-blur-md backdrop-saturate-150"
          radius="full"
          size="sm"
          variant="flat"
          onPress={handleWishlistToggle}
          isDisabled={isProcessing}
        >
          {isProcessing ? (
            <Icon
              className="animate-spin text-default-500"
              icon="solar:refresh-linear"
              width={16}
            />
          ) : (
            <Icon
              className={cn("text-default-900/50", {
                "text-primary": isWishlisted,
              })}
              icon={isWishlisted ? "solar:heart-bold" : "solar:heart-linear"}
              width={16}
            />
          )}
        </Button>

        <Link href={`/products/${product.id}`} className="block">
          <Image
            isBlurred
            isZoomed
            alt={product.title}
            className="aspect-square w-full hover:scale-110"
            isLoading={isLoading}
            src={product.images[0] || "/placeholder.jpg"}
            fallbackSrc="/placeholder.jpg"
          />
        </Link>

        <div className="mt-1 flex flex-col gap-2 px-1">
          {isLoading ? (
            <div className="my-1 flex flex-col gap-3">
              <Skeleton className="w-3/5 rounded-lg">
                <div className="bg-default-200 h-3 w-3/5 rounded-lg" />
              </Skeleton>
              <Skeleton className="mt-3 w-4/5 rounded-lg">
                <div className="bg-default-200 h-3 w-4/5 rounded-lg" />
              </Skeleton>
              <Skeleton className="mt-4 w-2/5 rounded-lg">
                <div className="bg-default-300 h-3 w-2/5 rounded-lg" />
              </Skeleton>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-1">
                <h3 className="text-small text-default-700 font-medium flex-1 min-w-0 pr-2">
                  {product.title || "Untitled Product"}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Icon
                    className="text-default-500"
                    icon="solar:star-bold"
                    width={16}
                  />
                  <span className="text-small text-default-500">
                    {product.seller?.averageRating?.toFixed(1) || "0.0"}
                  </span>
                </div>
              </div>
              <p className="text-small text-default-500 line-clamp-2">
                {product.description || "No description available"}
              </p>
              <p className="text-small text-default-500 font-medium">
                ${Number(product.price).toFixed(2)}
              </p>
              <Button
                size="sm"
                color="primary"
                variant="solid"
                className="w-full mt-2"
                startContent={
                  isAddingToBag ? (
                    <Icon
                      className="animate-spin"
                      icon="solar:refresh-linear"
                      width={16}
                    />
                  ) : (
                    <Icon icon="solar:bag-3-linear" width={16} />
                  )
                }
                onPress={handleAddToBag}
                isDisabled={isAddingToBag}
              >
                {isAddingToBag ? "Adding..." : "Add to Bag"}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  },
);

ProductCard.displayName = "ProductCard";

export default ProductCard;
