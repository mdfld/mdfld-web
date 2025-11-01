"use client";

import {
  Card,
  CardHeader,
  CardFooter,
  Button,
  Image,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface WishlistItem {
  id: string;
  title: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  sellerName: string;
}

export const WishlistSpotlight = () => {
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await fetch("/api/wishlist");
        if (response.ok) {
          const data = await response.json();
          setWishlistItems(data.items);
        }
      } catch (error) {
        // Failed to fetch wishlist
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[320px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="space-y-4">
        <div className="px-2">
          <h3 className="text-lg font-semibold">Wishlist Spotlight</h3>
          <p className="text-small text-default-500">
            No items in your wishlist
          </p>
        </div>
        <Card className="w-full h-[320px] bg-default-100 flex items-center justify-center">
          <div className="text-center">
            <Icon
              icon="solar:heart-linear"
              className="w-16 h-16 mx-auto text-default-400 mb-4"
            />
            <p className="text-default-500">
              Add items to your wishlist to see them here
            </p>
            <Button
              color="primary"
              variant="flat"
              className="mt-4"
              onPress={() => router.push("/products")}
            >
              Browse Products
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentItem = wishlistItems[currentIndex];
  const discount = currentItem.compareAtPrice
    ? Math.round(
        ((currentItem.compareAtPrice - currentItem.price) /
          currentItem.compareAtPrice) *
          100,
      )
    : 0;

  const nextItem = () => {
    setCurrentIndex((prev) => (prev + 1) % wishlistItems.length);
  };

  const prevItem = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + wishlistItems.length) % wishlistItems.length,
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <div>
          <h3 className="text-lg font-semibold">Wishlist Spotlight</h3>
          <p className="text-small text-default-500">
            {wishlistItems.length} items saved
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={prevItem}
            aria-label="Previous item"
          >
            <Icon icon="solar:arrow-left-linear" width={16} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={nextItem}
            aria-label="Next item"
          >
            <Icon icon="solar:arrow-right-linear" width={16} />
          </Button>
        </div>
      </div>

      <Card isFooterBlurred className="w-full h-[320px]">
        <CardHeader className="absolute z-10 top-1 flex-col items-start">
          <p className="text-tiny text-white/80 uppercase font-bold drop-shadow-md">
            Wishlist Item
          </p>
          <h4 className="text-white font-medium text-large drop-shadow-md">
            {currentItem.title}
          </h4>
        </CardHeader>

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent z-[5] pointer-events-none" />

        <Image
          removeWrapper
          alt={currentItem.title}
          className="z-0 w-full h-full object-cover"
          src={currentItem.image}
        />

        <CardFooter className="absolute bg-black/40 bottom-0 z-10 border-t-1 border-default-600">
          <div className="flex grow gap-2 items-center">
            <div className="flex flex-col">
              <p className="text-tiny text-white/60">
                {currentItem.sellerName}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-white font-bold">${currentItem.price}</p>
                {currentItem.compareAtPrice && discount > 0 && (
                  <>
                    <p className="text-tiny text-white/60 line-through">
                      ${currentItem.compareAtPrice}
                    </p>
                    <p className="text-tiny bg-primary/80 text-white px-2 py-1 rounded-none">
                      {discount}% off
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button
            radius="md"
            size="sm"
            color="primary"
            startContent={<Icon icon="solar:bag-4-linear" width={16} />}
            onPress={() => router.push(`/products/${currentItem.id}`)}
          >
            View Item
          </Button>
        </CardFooter>
      </Card>

      <div className="flex justify-center gap-1">
        {wishlistItems.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? "bg-primary" : "bg-default-200"
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};
