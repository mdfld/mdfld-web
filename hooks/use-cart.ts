"use client";

import { useAuth } from "./use-auth";
import { useGuestCart } from "./use-guest-cart";
import { trpc } from "@/lib/trpc-client";

export function useCart() {
  const { isAuthenticated } = useAuth();
  const guestCart = useGuestCart();
  const utils = trpc.useUtils();

  // Get authenticated cart
  const { data: authCartData } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Use authenticated cart if logged in, otherwise use guest cart
  const cartData = isAuthenticated
    ? authCartData
    : guestCart.isLoaded
    ? guestCart.getCartData()
    : null;

  const addToCart = trpc.cart.addItem.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
    },
  });

  const updateCartQuantity = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
    },
  });

  const removeFromCart = trpc.cart.removeItem.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
    },
  });

  return {
    cartData,
    isLoading: isAuthenticated ? !authCartData : !guestCart.isLoaded,

    // Guest cart methods (used when not authenticated)
    addToGuestCart: guestCart.addItem,
    updateGuestQuantity: guestCart.updateQuantity,
    removeFromGuestCart: guestCart.removeItem,
    clearGuestCart: guestCart.clearCart,
    guestCartItems: guestCart.guestCart,

    // Auth cart mutations
    addToAuthCart: addToCart,
    updateAuthQuantity: updateCartQuantity,
    removeFromAuthCart: removeFromCart,

    isAuthenticated,
  };
}
