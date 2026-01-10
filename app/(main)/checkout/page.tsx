"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Image,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";
import { useGuestCart } from "@/hooks/use-guest-cart";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const guestCart = useGuestCart();

  // Merge cart mutation
  const mergeCart = trpc.cart.mergeGuestCart.useMutation();

  // Get cart data
  const { data: authCartData, isLoading: authLoading } = trpc.cart.get.useQuery(undefined, {
    enabled: !!session?.user,
  });

  const isLoading = session?.user ? authLoading || !guestCart.isLoaded : !guestCart.isLoaded;
  const cartData = session?.user ? authCartData : guestCart.getCartData();

  // Merge guest cart when user logs in
  useEffect(() => {
    if (session?.user && guestCart.guestCart.length > 0 && !isPending) {
      // User just logged in and has guest cart items
      const guestItems = guestCart.guestCart.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      mergeCart.mutate(
        { guestItems },
        {
          onSuccess: () => {
            // Clear guest cart after successful merge
            guestCart.clearCart();
            toast.success("Cart items merged successfully");
          },
          onError: () => {
            toast.error("Failed to merge cart items");
          },
        }
      );
    }
  }, [session?.user, isPending]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isPending && !session?.user) {
      toast.error("Please log in to continue with checkout");
      router.push("/auth/login?redirect=/checkout");
    }
  }, [session, isPending, router]);

  const handleCheckout = async () => {
    if (!cartData?.items.length) {
      toast.error("Your bag is empty");
      return;
    }

    setIsProcessing(true);
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
            sellerId: item.product.seller.id,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = `https://checkout.stripe.com/c/pay/${sessionId}`;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to process checkout");
      setIsProcessing(false);
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session?.user) {
    return null; // Will redirect in useEffect
  }

  if (!cartData?.items.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-8">Checkout</h1>
        <Card className="max-w-md mx-auto">
          <CardBody className="text-center py-12">
            <Icon
              icon="solar:bag-4-linear"
              className="w-16 h-16 mx-auto mb-4 text-default-400"
            />
            <h2 className="text-xl font-medium mb-2">Your bag is empty</h2>
            <p className="text-default-500 mb-6">
              Add items to your bag before checking out
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
  const shipping: number = 0; // Free shipping
  const tax: number = subtotal * 0.08; // 8% tax rate
  const total: number = subtotal + shipping + tax;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Button
          variant="light"
          startContent={<Icon icon="solar:arrow-left-linear" />}
          onPress={() => router.push("/bag")}
        >
          Back to Bag
        </Button>
      </div>

      <h1 className="text-2xl font-semibold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Checkout Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Secure Checkout Notice */}
          <Card className="bg-default-50 border-2 border-primary">
            <CardBody className="py-6">
              <div className="flex items-start gap-4">
                <Icon
                  icon="solar:shield-check-bold"
                  className="text-3xl text-primary flex-shrink-0 mt-1"
                />
                <div>
                  <h2 className="text-lg font-semibold mb-2">
                    Secure Stripe Checkout
                  </h2>
                  <p className="text-default-600 mb-3">
                    You'll be redirected to Stripe's secure payment page to
                    complete your purchase. Your payment information is never
                    stored on our servers.
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Icon icon="logos:visa" className="h-8" />
                    <Icon icon="logos:mastercard" className="h-8" />
                    <Icon icon="logos:amex" className="h-8" />
                    <Icon icon="logos:discover" className="h-8" />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* What to Expect */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">What to Expect</h2>
            </CardHeader>
            <Divider />
            <CardBody className="gap-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary font-semibold">1</span>
                </div>
                <div>
                  <p className="font-medium">Secure Payment</p>
                  <p className="text-sm text-default-500">
                    Enter your payment and shipping details on Stripe's secure
                    checkout page
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary font-semibold">2</span>
                </div>
                <div>
                  <p className="font-medium">Order Confirmation</p>
                  <p className="text-sm text-default-500">
                    Receive instant confirmation and email receipt
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary font-semibold">3</span>
                </div>
                <div>
                  <p className="font-medium">Fast Shipping</p>
                  <p className="text-sm text-default-500">
                    Your items will be prepared and shipped within 1-2 business
                    days
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Order Summary</h2>
            </CardHeader>
            <Divider />
            <CardBody className="gap-4">
              {/* Cart Items */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {cartData.items.map((item: any) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative">
                      <Image
                        src={
                          item.product.images?.[0] || "/placeholder-product.jpg"
                        }
                        alt={item.product.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="absolute -top-2 -right-2 bg-default-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.product.title}
                      </p>
                      {item.variant && (
                        <p className="text-xs text-default-500">
                          {item.variant.sizeDisplay && (
                            <span>Size: {item.variant.sizeDisplay}</span>
                          )}
                          {item.variant.color && (
                            <span className="ml-2">
                              Color: {item.variant.color}
                            </span>
                          )}
                        </p>
                      )}
                      <p className="text-sm font-medium mt-1">
                        $
                        {(
                          Number(item.variant?.price || item.product.price) *
                          item.quantity
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Divider />

              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-default-600">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-default-600">Shipping</span>
                  <span>
                    {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-default-600">Estimated Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              <Divider />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <Button
                fullWidth
                color="primary"
                size="lg"
                onPress={handleCheckout}
                isLoading={isProcessing}
                startContent={
                  !isProcessing && <Icon icon="solar:lock-keyhole-bold" />
                }
              >
                {isProcessing
                  ? "Redirecting to Stripe..."
                  : "Continue to Payment"}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-default-500">
                <Icon icon="solar:shield-check-linear" />
                <span>Secure checkout powered by Stripe</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
