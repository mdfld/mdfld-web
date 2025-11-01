"use client";

import * as React from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Spacer,
  Card,
  CardBody,
  Spinner,
  Chip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

interface BillingSettingCardProps {
  className?: string;
}

const BillingSetting = React.forwardRef<
  HTMLDivElement,
  BillingSettingCardProps
>(({ className, ...props }, ref) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [billingAddress, setBillingAddress] = React.useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
  });

  // Get current user data from auth
  const { data: session } = authClient.useSession();

  // Check if we're loading
  const userLoading = !session && session !== null;

  // Get or create Stripe customer
  const createCustomer = trpc.stripe.getOrCreateCustomer.useMutation();

  // Get payment methods from Stripe
  const [paymentMethods, setPaymentMethods] = React.useState<any[]>([]);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = React.useState<
    string | null
  >(null);
  const [stripeCustomerId, setStripeCustomerId] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    const fetchCustomerData = async () => {
      if (session?.user && !stripeCustomerId) {
        // Get or create customer
        try {
          const result = await createCustomer.mutateAsync();
          setStripeCustomerId(result.customerId);
          fetchPaymentMethods(result.customerId);
        } catch (error) {
          // Failed to get customer ID
        }
      } else if (stripeCustomerId) {
        fetchPaymentMethods(stripeCustomerId);
      }
    };

    fetchCustomerData();
  }, [session?.user, stripeCustomerId]);

  const fetchPaymentMethods = async (customerId: string) => {
    try {
      const response = await fetch(
        `/api/stripe/payment-methods?customerId=${customerId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
        setDefaultPaymentMethod(data.defaultPaymentMethod);
      }
    } catch (error) {
      // Failed to fetch payment methods
    }
  };

  const handleAddPaymentMethod = async () => {
    setIsLoading(true);
    try {
      // Ensure user has a Stripe customer ID
      let customerId = stripeCustomerId;
      if (!customerId) {
        const result = await createCustomer.mutateAsync();
        customerId = result.customerId;
        setStripeCustomerId(customerId);
      }

      // Create a Stripe Checkout session for adding a payment method
      const response = await fetch("/api/stripe/create-setup-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          returnUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create setup session");
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      toast.error("Failed to add payment method");
      // Error adding payment method
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    try {
      const response = await fetch(
        `/api/stripe/payment-methods/${paymentMethodId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        toast.success("Payment method removed");
        if (stripeCustomerId) {
          fetchPaymentMethods(stripeCustomerId);
        }
      } else {
        throw new Error("Failed to remove payment method");
      }
    } catch (error) {
      toast.error("Failed to remove payment method");
      // Error removing payment method
    }
  };

  const handleSaveBillingAddress = async () => {
    if (!stripeCustomerId) {
      toast.error("Please add a payment method first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/update-billing-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: stripeCustomerId,
          address: billingAddress,
        }),
      });

      if (response.ok) {
        toast.success("Billing address updated");
      } else {
        throw new Error("Failed to update billing address");
      }
    } catch (error) {
      toast.error("Failed to update billing address");
      // Error updating billing address
    } finally {
      setIsLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("p-2", className)} {...props}>
      {/* Payment Methods */}
      <div>
        <p className="text-default-700 text-base font-medium mb-4">
          Payment Methods
        </p>

        {paymentMethods.length === 0 ? (
          <Card className="mb-4">
            <CardBody className="text-center py-8">
              <Icon
                icon="solar:card-outline"
                className="text-default-400 w-12 h-12 mx-auto mb-4"
              />
              <p className="text-default-500 mb-4">
                No payment methods added yet
              </p>
              <Button
                color="primary"
                size="sm"
                onPress={handleAddPaymentMethod}
                isLoading={isLoading}
              >
                Add Payment Method
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <Card key={method.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon
                      className="text-default-500 h-6 w-6"
                      icon={
                        method.card.brand === "visa"
                          ? "mdi:credit-card-outline"
                          : method.card.brand === "mastercard"
                            ? "mdi:credit-card-outline"
                            : "mdi:credit-card-outline"
                      }
                    />
                    <div>
                      <p className="text-default-600 text-sm font-medium">
                        {method.card.brand.charAt(0).toUpperCase() +
                          method.card.brand.slice(1)}{" "}
                        •••• {method.card.last4}
                      </p>
                      <p className="text-default-400 text-xs">
                        Expires {method.card.exp_month}/{method.card.exp_year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {defaultPaymentMethod === method.id && (
                      <Chip size="sm" color="primary" variant="flat">
                        Default
                      </Chip>
                    )}
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleRemovePaymentMethod(method.id)}
                    >
                      <Icon icon="solar:trash-bin-2-linear" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            <Button
              variant="flat"
              size="sm"
              onPress={handleAddPaymentMethod}
              isLoading={isLoading}
              className="w-full"
            >
              Add New Payment Method
            </Button>
          </div>
        )}
      </div>

      <Spacer y={6} />

      {/* Billing Address */}
      <div>
        <div className="mb-4">
          <p className="text-default-700 text-base font-medium">
            Billing Address
          </p>
          <p className="text-default-400 mt-1 text-sm font-normal">
            This address will be used for all your purchases
          </p>
        </div>

        <div className="space-y-3">
          <Input
            label="Address Line 1"
            placeholder="123 Main St"
            value={billingAddress.line1}
            onChange={(e) =>
              setBillingAddress({ ...billingAddress, line1: e.target.value })
            }
          />
          <Input
            label="Address Line 2"
            placeholder="Apt 4B"
            value={billingAddress.line2}
            onChange={(e) =>
              setBillingAddress({ ...billingAddress, line2: e.target.value })
            }
          />
          <Input
            label="City"
            placeholder="New York"
            value={billingAddress.city}
            onChange={(e) =>
              setBillingAddress({ ...billingAddress, city: e.target.value })
            }
          />
          <div className="flex gap-3">
            <Input
              label="State"
              placeholder="NY"
              value={billingAddress.state}
              onChange={(e) =>
                setBillingAddress({ ...billingAddress, state: e.target.value })
              }
            />
            <Input
              label="Postal Code"
              placeholder="10001"
              value={billingAddress.postal_code}
              onChange={(e) =>
                setBillingAddress({
                  ...billingAddress,
                  postal_code: e.target.value,
                })
              }
            />
          </div>
          <Select
            label="Country"
            selectedKeys={[billingAddress.country]}
            onChange={(e) =>
              setBillingAddress({ ...billingAddress, country: e.target.value })
            }
          >
            <SelectItem key="US">United States</SelectItem>
            <SelectItem key="CA">Canada</SelectItem>
            <SelectItem key="GB">United Kingdom</SelectItem>
            <SelectItem key="AU">Australia</SelectItem>
          </Select>
        </div>

        <Button
          className="mt-4"
          color="primary"
          size="sm"
          onPress={handleSaveBillingAddress}
          isLoading={isLoading}
          isDisabled={
            !billingAddress.line1 ||
            !billingAddress.city ||
            !billingAddress.postal_code
          }
        >
          Save Billing Address
        </Button>
      </div>
    </div>
  );
});

BillingSetting.displayName = "BillingSetting";

export default BillingSetting;
