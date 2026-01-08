"use client";

import { useState, useEffect } from "react";

export interface GuestCartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: string;
    images: string[];
  };
  variant?: {
    id: string;
    price: string;
    sizeDisplay?: string;
    color?: string;
  };
}

const GUEST_CART_KEY = "mdfld_guest_cart";

export function useGuestCart() {
  const [guestCart, setGuestCart] = useState<GuestCartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      if (stored) {
        try {
          setGuestCart(JSON.parse(stored));
        } catch (error) {
          console.error("Failed to parse guest cart:", error);
          localStorage.removeItem(GUEST_CART_KEY);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCart));
    }
  }, [guestCart, isLoaded]);

  const addItem = (item: GuestCartItem) => {
    setGuestCart((prev) => {
      // Check if item already exists
      const existingIndex = prev.findIndex(
        (i) =>
          i.productId === item.productId &&
          i.variantId === item.variantId
      );

      if (existingIndex >= 0) {
        // Update quantity
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity,
        };
        return updated;
      } else {
        // Add new item
        return [...prev, item];
      }
    });
  };

  const updateQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
    setGuestCart((prev) => {
      if (quantity <= 0) {
        // Remove item if quantity is 0
        return prev.filter(
          (i) => !(i.productId === productId && i.variantId === variantId)
        );
      }

      return prev.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      );
    });
  };

  const removeItem = (productId: string, variantId: string | undefined) => {
    setGuestCart((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variantId === variantId))
    );
  };

  const clearCart = () => {
    setGuestCart([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(GUEST_CART_KEY);
    }
  };

  const getCartData = () => {
    const items = guestCart;
    const subtotal = items.reduce((sum, item) => {
      const price = Number(item.variant?.price || item.product.price);
      return sum + price * item.quantity;
    }, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      subtotal,
      itemCount,
    };
  };

  return {
    guestCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getCartData,
    isLoaded,
  };
}
