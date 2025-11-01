"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface WishlistButtonProps {
  productId: string;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "flat" | "light";
  className?: string;
  onToggle?: (isInWishlist: boolean) => void;
}

export function WishlistButton({
  productId,
  size = "sm",
  variant = "flat",
  className = "",
  onToggle,
}: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      checkWishlistStatus();
    }
  }, [productId, session]);

  const checkWishlistStatus = async () => {
    try {
      const response = await fetch(`/api/wishlist`);
      if (response.ok) {
        const data = await response.json();
        const inWishlist = data.items.some(
          (item: any) => item.id === productId,
        );
        setIsInWishlist(inWishlist);
      }
    } catch (error) {
      // Failed to check wishlist status
    }
  };

  const toggleWishlist = async () => {
    if (!session?.user) {
      router.push("/signin");
      return;
    }

    setIsLoading(true);

    try {
      if (isInWishlist) {
        const response = await fetch(`/api/wishlist/${productId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setIsInWishlist(false);
          onToggle?.(false);
        }
      } else {
        const response = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });

        if (response.ok) {
          setIsInWishlist(true);
          onToggle?.(true);
        }
      }
    } catch (error) {
      // Failed to toggle wishlist
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      isIconOnly
      size={size}
      variant={variant}
      className={className}
      onPress={toggleWishlist}
      isLoading={isLoading}
    >
      <Icon
        icon={isInWishlist ? "solar:heart-bold" : "solar:heart-outline"}
        className={isInWishlist ? "text-danger" : ""}
      />
    </Button>
  );
}
