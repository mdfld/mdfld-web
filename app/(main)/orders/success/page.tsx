"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, CardBody, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { authClient } from "@/lib/auth-client";
import confetti from "canvas-confetti";

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { data: authSession } = authClient.useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    async function fulfillOrder() {
      try {
        const res = await fetch("/api/stripe/fulfill-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("[success] fulfill-order failed:", data);
          setError(data.error || "Failed to create order");
        } else {
          const ids = (data.orders || []).map((o: any) => o.id);
          setOrderIds(ids);

          // Fire confetti only on fresh order creation
          if (!data.alreadyFulfilled) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(() => {
              const timeLeft = animationEnd - Date.now();
              if (timeLeft <= 0) return clearInterval(interval);
              const particleCount = 50 * (timeLeft / duration);
              confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
              confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
          }
        }
      } catch (err) {
        console.error("[success] fetch error:", err);
        setError("Something went wrong");
      } finally {
        setIsLoading(false);
      }
    }

    fulfillOrder();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner size="lg" />
        <p className="text-default-500 text-sm">Confirming your order…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Card className="shadow-lg">
        <CardBody className="text-center py-12 px-6">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className={`${error ? "bg-danger/10" : "bg-success/10"} rounded-full p-6`}>
              <Icon
                icon={error ? "solar:close-circle-bold" : "solar:check-circle-bold"}
                className={`text-6xl ${error ? "text-danger" : "text-success"}`}
              />
            </div>
          </div>

          {error ? (
            <>
              <h1 className="text-3xl font-bold mb-3">Something went wrong</h1>
              <p className="text-default-500 mb-6 text-sm">{error}</p>
              <p className="text-default-400 text-xs mb-8">
                Your payment was successful. Contact support with your reference: <br />
                <span className="font-mono">{sessionId}</span>
              </p>
              <Button color="primary" onPress={() => router.push("/contact")}>
                Contact Support
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-3">Order Confirmed!</h1>
              <p className="text-lg text-default-600 mb-8">
                Thank you for your purchase. Your order has been successfully placed.
              </p>

              <div className="bg-default-100 rounded-lg p-6 mb-8 text-left">
                <h2 className="font-semibold mb-4 text-center">What happens next?</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Icon icon="solar:letter-bold" className="text-xl text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Confirmation Email</p>
                      <p className="text-sm text-default-500">
                        We've sent a confirmation email to {authSession?.user?.email || "your email"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon icon="solar:box-bold" className="text-xl text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Order Processing</p>
                      <p className="text-sm text-default-500">
                        Your order is being prepared for shipment
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon icon="solar:delivery-bold" className="text-xl text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Shipping Updates</p>
                      <p className="text-sm text-default-500">
                        You'll receive tracking information once your order ships
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  variant="flat"
                  onPress={() => router.push("/dashboard/orders")}
                  startContent={<Icon icon="solar:bag-4-linear" />}
                >
                  View My Orders
                </Button>
                <Button
                  size="lg"
                  color="primary"
                  onPress={() => router.push("/shop")}
                  startContent={<Icon icon="solar:shop-linear" />}
                >
                  Continue Shopping
                </Button>
              </div>

              {sessionId && (
                <div className="mt-8 pt-6 border-t border-default-200">
                  <p className="text-xs text-default-400">
                    Order Reference: {sessionId}
                  </p>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardBody className="text-center py-6">
          <p className="text-sm text-default-600 mb-2">Need help with your order?</p>
          <Button
            variant="light"
            size="sm"
            onPress={() => router.push("/contact")}
            startContent={<Icon icon="solar:chat-line-linear" />}
          >
            Contact Support
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}