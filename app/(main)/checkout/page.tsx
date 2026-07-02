"use client";

import React, { useState, useEffect } from "react";
import {
  Button, Card, CardBody, Divider, Input, Select, SelectItem,
  RadioGroup, Radio, Spinner, Image,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";
import { useGuestCart } from "@/hooks/use-guest-cart";
import { useOnboarding } from "@/contexts/onboarding-context";

type Address = {
  name: string; street: string; apt: string;
  city: string; state: string; zip: string; country: string;
};

type RateOption = {
  easypostRateId: string; carrier: string; service: string;
  rateCents: number; totalCents: number; deliveryDays: number | null;
};

type Shipment = {
  sellerId: string; sellerName: string;
  standard: RateOption; express: RateOption | null;
};

type ShippingSelection = {
  sellerId: string; tier: "standard" | "express";
  rate: RateOption;
};

const COUNTRIES = [
  { key: "US", label: "United States" },
  { key: "CA", label: "Canada" },
  { key: "GB", label: "United Kingdom" },
  { key: "AU", label: "Australia" },
];

function fmt(cents: number) {
  return cents === 0 ? "Free" : `$${(cents / 100).toFixed(2)}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { completeStep } = useOnboarding();
  const guestCart = useGuestCart();
  const { data: fees } = trpc.admin.getPublicFees.useQuery();

  const { data: authCartData, isLoading: cartLoading } = trpc.cart.get.useQuery(
    undefined, { enabled: !!session?.user }
  );

  const cartData = session?.user ? authCartData : guestCart.getCartData();
  const isLoading = isPending || (!!session?.user && cartLoading);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [address, setAddress] = useState<Address>({
    name: "", street: "", apt: "", city: "", state: "", zip: "", country: "US",
  });
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selections, setSelections] = useState<Record<string, ShippingSelection>>({});
  const [fetchingRates, setFetchingRates] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      toast.error("Please log in to continue with checkout");
      router.push("/auth/login?redirect=/checkout");
    }
  }, [session, isPending, router]);

  if (isPending || isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  }
  if (!session?.user) return null;

  if (!cartData?.items?.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto"><CardBody className="text-center py-12">
          <Icon icon="solar:bag-4-linear" className="w-16 h-16 mx-auto mb-4 text-default-400" />
          <h2 className="text-xl font-medium mb-2">Your bag is empty</h2>
          <Button color="primary" onPress={() => router.push("/products")}>Continue Shopping</Button>
        </CardBody></Card>
      </div>
    );
  }

  const subtotal: number = cartData?.subtotal || 0;
  const marketplaceFee: number = subtotal * (fees?.buyerMarketplaceFee ?? 0);
  const shippingTotal = Object.values(selections).reduce((sum, s) => sum + s.rate.totalCents, 0) / 100;
  const total = subtotal + marketplaceFee + shippingTotal;

  const addressValid =
    address.name.trim() && address.street.trim() && address.city.trim() &&
    address.state.trim() && address.zip.trim() && address.country.trim();

  const allSelected = shipments.length > 0 && shipments.every((s) => selections[s.sellerId]);

  const handleFetchRates = async () => {
    if (!addressValid) return;
    setFetchingRates(true);
    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toAddress: { street: address.street + (address.apt ? ` ${address.apt}` : ""), city: address.city, state: address.state, zip: address.zip, country: address.country },
          items: cartData.items.map((item: any) => ({
            productId: item.product.id,
            variantId: item.variant?.id,
            quantity: item.quantity,
            sellerId: item.product.seller?.id,
          })),
        }),
      });
      if (!res.ok) throw new Error("Rate fetch failed");
      const { shipments: fetched } = await res.json();
      setShipments(fetched);
      const defaults: Record<string, ShippingSelection> = {};
      for (const s of fetched) {
        defaults[s.sellerId] = { sellerId: s.sellerId, tier: "standard", rate: s.standard };
      }
      setSelections(defaults);
      setStep(2);
    } catch {
      toast.error("Failed to calculate shipping rates. Please try again.");
    } finally {
      setFetchingRates(false);
    }
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const shippingSelections = Object.values(selections).map((s) => ({
        sellerId: s.sellerId,
        easypostRateId: s.rate.easypostRateId,
        carrier: s.rate.carrier,
        service: s.rate.service,
        rateCents: s.rate.rateCents,
        totalCents: s.rate.totalCents,
        deliveryDays: s.rate.deliveryDays,
      }));

      const res = await fetch("/api/stripe/create-checkout-session", {
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
            sellerName: item.product.seller?.storeName,
          })),
          shippingSelections,
        }),
      });

      if (!res.ok) throw new Error("Failed to create checkout session");
      const { url } = await res.json();
      await completeStep("place-order", "buyer");
      window.location.href = url;
    } catch {
      toast.error("Failed to process checkout");
      setIsProcessing(false);
    }
  };

  const OrderSummary = () => (
    <Card>
      <CardBody className="gap-4">
        <p className="text-sm font-medium">Order Summary</p>
        <div className="space-y-3 max-h-[260px] overflow-y-auto">
          {cartData.items.map((item: any) => (
            <div key={item.id} className="flex gap-3">
              <div className="relative flex-shrink-0">
                <Image src={item.product.images?.[0] || "/placeholder-product.jpg"} alt={item.product.title} className="w-14 h-14 object-cover rounded-lg" />
                <div className="absolute -top-1.5 -right-1.5 bg-default-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">{item.quantity}</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product.title}</p>
                <p className="text-sm text-default-500">${Number(item.variant?.price || item.product.price).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
        <Divider />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-default-500">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between">
            <span className="text-default-500">Shipping</span>
            <span>{step === 1 ? "Calculated next" : fmt(Object.values(selections).reduce((s, sel) => s + sel.rate.totalCents, 0))}</span>
          </div>
          {marketplaceFee > 0 && <div className="flex justify-between"><span className="text-default-500">Marketplace Fee</span><span>${marketplaceFee.toFixed(2)}</span></div>}
        </div>
        <Divider />
        <div className="flex justify-between font-semibold"><span>Total</span><span>${step === 1 ? (subtotal + marketplaceFee).toFixed(2) : total.toFixed(2)}</span></div>
      </CardBody>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="light" startContent={<Icon icon="solar:arrow-left-linear" />}
          onPress={() => step === 1 ? router.push("/bag") : setStep((s) => (s - 1) as 1 | 2 | 3)}>
          {step === 1 ? "Back to Bag" : "Back"}
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-8 text-sm">
        {(["Delivery", "Shipping", "Review"] as const).map((label, i) => (
          <React.Fragment key={label}>
            <span className={step === i + 1 ? "font-semibold text-primary" : "text-default-400"}>{i + 1}. {label}</span>
            {i < 2 && <Icon icon="solar:arrow-right-linear" className="text-default-300 w-3 h-3" />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {step === 1 && (
            <Card>
              <CardBody className="space-y-4 p-6">
                <h2 className="text-lg font-medium">Delivery Address</h2>
                <Input label="Full Name" isRequired value={address.name} onValueChange={(v) => setAddress((a) => ({ ...a, name: v }))} />
                <Input label="Street Address" isRequired value={address.street} onValueChange={(v) => setAddress((a) => ({ ...a, street: v }))} />
                <Input label="Apt, Suite, Unit (optional)" value={address.apt} onValueChange={(v) => setAddress((a) => ({ ...a, apt: v }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="City" isRequired value={address.city} onValueChange={(v) => setAddress((a) => ({ ...a, city: v }))} />
                  <Input label="State / Province" isRequired value={address.state} onValueChange={(v) => setAddress((a) => ({ ...a, state: v }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Zip / Postal Code" isRequired value={address.zip} onValueChange={(v) => setAddress((a) => ({ ...a, zip: v }))} />
                  <Select label="Country" isRequired selectedKeys={[address.country]} onSelectionChange={(k) => setAddress((a) => ({ ...a, country: Array.from(k)[0] as string }))}>
                    {COUNTRIES.map((c) => <SelectItem key={c.key}>{c.label}</SelectItem>)}
                  </Select>
                </div>
                <Button fullWidth color="primary" size="lg" isDisabled={!addressValid} isLoading={fetchingRates} onPress={handleFetchRates}
                  startContent={!fetchingRates && <Icon icon="solar:box-linear" />}>
                  Continue to Shipping
                </Button>
              </CardBody>
            </Card>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Select Shipping</h2>
              {shipments.map((shipment) => (
                <Card key={shipment.sellerId}>
                  <CardBody className="p-5">
                    <p className="text-sm font-medium mb-3">{shipment.sellerName}</p>
                    {shipment.standard.service === "DDP" ? (
                      <p className="text-sm text-success">Shipping included in price</p>
                    ) : shipment.express === null ? (
                      <div className="flex justify-between text-sm">
                        <span>{shipment.standard.carrier} {shipment.standard.service} {shipment.standard.deliveryDays ? `· ${shipment.standard.deliveryDays} days` : ""}</span>
                        <span className="font-medium">{fmt(shipment.standard.totalCents)}</span>
                      </div>
                    ) : (
                      <RadioGroup
                        value={selections[shipment.sellerId]?.tier ?? "standard"}
                        onValueChange={(v) => setSelections((prev) => ({
                          ...prev,
                          [shipment.sellerId]: { sellerId: shipment.sellerId, tier: v as "standard" | "express", rate: v === "express" ? shipment.express! : shipment.standard },
                        }))}
                      >
                        <Radio value="standard" description={`${shipment.standard.carrier} ${shipment.standard.service}${shipment.standard.deliveryDays ? ` · ${shipment.standard.deliveryDays} days` : ""}`}>
                          <span className="font-medium">{fmt(shipment.standard.totalCents)}</span> <span className="text-default-500 text-xs ml-1">Standard</span>
                        </Radio>
                        <Radio value="express" description={`${shipment.express.carrier} ${shipment.express.service}${shipment.express.deliveryDays ? ` · ${shipment.express.deliveryDays} days` : ""}`}>
                          <span className="font-medium">{fmt(shipment.express.totalCents)}</span> <span className="text-default-500 text-xs ml-1">Express</span>
                        </Radio>
                      </RadioGroup>
                    )}
                  </CardBody>
                </Card>
              ))}
              <Button fullWidth color="primary" size="lg" isDisabled={!allSelected} onPress={() => setStep(3)}
                startContent={<Icon icon="solar:checklist-minimalistic-outline" />}>
                Continue to Review
              </Button>
            </div>
          )}

          {step === 3 && (
            <Card>
              <CardBody className="space-y-5 p-6">
                <h2 className="text-lg font-medium">Review & Pay</h2>

                <div>
                  <p className="text-xs text-default-400 uppercase tracking-wide mb-1">Delivering to</p>
                  <p className="text-sm">{address.name}</p>
                  <p className="text-sm text-default-500">{address.street}{address.apt ? `, ${address.apt}` : ""}, {address.city}, {address.state} {address.zip}</p>
                </div>

                <Divider />

                <div>
                  <p className="text-xs text-default-400 uppercase tracking-wide mb-2">Shipping</p>
                  {shipments.map((s) => {
                    const sel = selections[s.sellerId];
                    if (!sel) return null;
                    return (
                      <div key={s.sellerId} className="flex justify-between text-sm mb-1">
                        <span>{s.sellerName} — {sel.rate.carrier} {sel.rate.service}</span>
                        <span>{fmt(sel.rate.totalCents)}</span>
                      </div>
                    );
                  })}
                </div>

                <Divider />

                <Button fullWidth color="primary" size="lg" isLoading={isProcessing} onPress={handleCheckout}
                  startContent={!isProcessing && <Icon icon="solar:lock-keyhole-bold" />}>
                  {isProcessing ? "Redirecting to Stripe..." : `Pay $${total.toFixed(2)}`}
                </Button>
                <p className="text-xs text-center text-default-400 flex items-center justify-center gap-1">
                  <Icon icon="solar:shield-check-linear" /> Secure checkout powered by Stripe
                </p>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <OrderSummary />
        </div>
      </div>
    </div>
  );
}
