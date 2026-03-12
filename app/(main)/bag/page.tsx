"use client";

import React from "react";
import {
  Button,
  Card,
  CardBody,
  Divider,
  Image,
  Input,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";
// Stripe redirect handled via checkout session URL
import { useGuestCart } from "@/hooks/use-guest-cart";
import { useAuth } from "@/hooks/use-auth";



export default function BagPage() {
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [promoCode, setPromoCode] = React.useState("");

  // Auth state
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Guest cart
  const guestCart = useGuestCart();

  // Authenticated cart
  const { data: authCartData, isLoading: authCartLoading, refetch } = trpc.cart.get.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Mutations for authenticated users
  const updateQuantity = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => refetch(),
  });

  const removeItem = trpc.cart.removeItem.useMutation({
    onSuccess: () => {
      toast.success("Item removed from bag");
      refetch();
    },
  });

  // Determine which cart data to use
  const cartData = isAuthenticated ? authCartData : guestCart.getCartData();
  const isLoading = authLoading || (isAuthenticated && authCartLoading) || !guestCart.isLoaded;

  const handleQuantityChange = async (
    itemId: string,
    productId: string,
    variantId: string | undefined,
    newQuantity: number
  ) => {
    if (isAuthenticated) {
      // Authenticated user - use tRPC mutation
      if (newQuantity < 1) {
        await removeItem.mutateAsync({ itemId });
      } else {
        await updateQuantity.mutateAsync({ itemId, quantity: newQuantity });
      }
    } else {
      // Guest user - use localStorage
      if (newQuantity < 1) {
        guestCart.removeItem(productId, variantId);
        toast.success("Item removed from bag");
      } else {
        guestCart.updateQuantity(productId, variantId, newQuantity);
      }
    }
  };

  const handleRemoveItem = (
    itemId: string,
    productId: string,
    variantId: string | undefined
  ) => {
    if (isAuthenticated) {
      removeItem.mutate({ itemId });
    } else {
      guestCart.removeItem(productId, variantId);
      toast.success("Item removed from bag");
    }
  };

  const handleCheckout = async () => {
    if (!cartData?.items.length) {
      toast.error("Your bag is empty");
      return;
    }

    // Guest users need to log in
    if (!isAuthenticated) {
      toast.info("Please log in to continue to checkout");
      router.push("/sign-in?redirect=/bag");
      return;
    }

    setIsCheckingOut(true);
    try {
      // Create Stripe checkout session
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartData.items.map((item: any) => ({
            productId: item.product.id,
            variantId: item.variant?.id,
            quantity: item.quantity,
            price: item.variant?.price || item.product.price,
            name: item.product.title,
            image: item.product.images?.[0],
            sellerId: item.product.seller?.id,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();

      // Redirect directly to Stripe Checkout URL
      if (!url) throw new Error("No checkout URL received");
      window.location.href = url;
    } catch (error) {
      // Checkout error
      toast.error("Failed to start checkout");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!cartData?.items.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-8">Shopping Bag</h1>
        <Card className="max-w-md mx-auto">
          <CardBody className="text-center py-12">
            <Icon
              icon="solar:bag-4-linear"
              className="w-16 h-16 mx-auto mb-4 text-default-400"
            />
            <h2 className="text-xl font-medium mb-2">Your bag is empty</h2>
            <p className="text-default-500 mb-6">
              Add items to your bag to get started
            </p>
            <Button color="primary" onPress={() => router.push("/products")}>
              Continue Shopping
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const subtotal: number = cartData?.subtotal || 0;
  const shipping: number = 0; // Free shipping or calculate based on rules
  const tax: number = subtotal * 0.08; // 8% tax rate (adjust as needed)
  const total: number = subtotal + shipping + tax;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-8">
        Shopping Bag ({cartData.itemCount}{" "}
        {cartData.itemCount === 1 ? "item" : "items"})
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartData.items.map((item: any) => {
            // Handle both guest and auth cart item structures
            const itemId = item.id || `${item.productId}-${item.variantId || 'no-variant'}`;
            const productId = item.productId || item.product?.id;
            const variantId = item.variantId || item.variant?.id;

            return (
              <Card key={itemId}>
                <CardBody className="p-4">
                  <div className="flex gap-4">
                    <Image
                      src={item.product.images?.[0] || "/placeholder-product.jpg"}
                      alt={item.product.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">{item.product.title}</h3>
                          {item.variant && (
                            <div className="text-sm text-default-500 mt-1">
                              {item.variant.sizeDisplay && (
                                <span>Size: {item.variant.sizeDisplay}</span>
                              )}
                              {item.variant.color && (
                                <span className="ml-3">
                                  Color: {item.variant.color}
                                </span>
                              )}
                            </div>
                          )}
                          {isAuthenticated && item.product.seller && (
                            <p className="text-sm text-default-500 mt-1">
                              by{" "}
                              {item.product.seller?.storeName || "Unknown Seller"}
                            </p>
                          )}
                        </div>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleRemoveItem(itemId, productId, variantId)}
                        >
                          <Icon icon="solar:trash-bin-2-linear" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() =>
                              handleQuantityChange(
                                itemId,
                                productId,
                                variantId,
                                item.quantity - 1
                              )
                            }
                          >
                            <Icon icon="solar:minus-linear" />
                          </Button>
                          <span className="w-12 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() =>
                              handleQuantityChange(
                                itemId,
                                productId,
                                variantId,
                                item.quantity + 1
                              )
                            }
                          >
                            <Icon icon="solar:add-linear" />
                          </Button>
                        </div>
                        <p className="font-medium">
                          $
                          {(
                            Number(item.variant?.price || item.product.price) *
                            item.quantity
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardBody className="p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-default-600">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-600">Shipping</span>
                  <span>
                    {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-600">Estimated Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              <Divider className="my-4" />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    size="sm"
                  />
                  <Button size="sm" variant="flat">
                    Apply
                  </Button>
                </div>

                <Button
                  fullWidth
                  color="primary"
                  size="lg"
                  onPress={handleCheckout}
                  isLoading={isCheckingOut}
                  startContent={<Icon icon="solar:lock-keyhole-bold" />}
                >
                  {isAuthenticated ? "Secure Checkout" : "Continue to Checkout"}
                </Button>

                {!isAuthenticated && (
                  <p className="text-xs text-center text-default-500">
                    You'll be asked to log in at checkout
                  </p>
                )}

                <div className="flex items-center justify-center gap-2 text-xs text-default-500">
                  <Icon icon="solar:shield-check-linear" />
                  <span>Secure checkout powered by Stripe</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Accepted Payment Methods */}
          <Card className="mt-4">
            <CardBody className="p-4">
              <p className="text-sm text-default-600 mb-2">
                Accepted payment methods
              </p>
              <div className="flex gap-2">
                <Icon icon="logos:visa" className="h-8" />
                <Icon icon="logos:mastercard" className="h-8" />
                <Icon icon="logos:amex" className="h-8" />
                <Icon icon="logos:discover" className="h-8" />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}