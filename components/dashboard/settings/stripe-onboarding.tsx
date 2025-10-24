"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";

interface StripeOnboardingProps {
  organizationId?: string;
}

export function StripeOnboarding({ organizationId }: StripeOnboardingProps) {
  const [error, setError] = useState<string | null>(null);

  // Get account status
  const {
    data: accountStatus,
    isLoading: statusLoading,
    refetch,
  } = trpc.stripe.getAccountStatus.useQuery({ organizationId });

  // Create connect account mutation
  const createAccount = trpc.stripe.createConnectAccount.useMutation({
    onSuccess: (data) => {
      if (data.accountLink) {
        // Redirect to Stripe onboarding
        window.location.href = data.accountLink;
      } else {
        refetch();
      }
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  // Create account link mutation
  const createAccountLink = trpc.stripe.createAccountLink.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleStartOnboarding = async () => {
    setError(null);
    const user = await fetch("/api/auth/user").then((r) => r.json());
    createAccount.mutate({
      organizationId,
      email: user.email,
      country: "US",
      businessType: organizationId ? "company" : "individual",
    });
  };

  const handleContinueOnboarding = () => {
    setError(null);
    createAccountLink.mutate({ organizationId });
  };

  if (statusLoading) {
    return (
      <Card className="w-full">
        <CardBody className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-2 px-6 pb-0 pt-6">
        <h3 className="text-xl font-semibold">Stripe Connect Setup</h3>
        <p className="text-sm text-default-500">
          Set up your Stripe account to start accepting payments
        </p>
      </CardHeader>
      <CardBody className="space-y-4 px-6 py-6">
        {error && (
          <div className="flex items-start gap-2 rounded-medium bg-danger-50 p-3 text-danger">
            <Icon
              icon="solar:danger-circle-bold"
              className="mt-0.5"
              width={20}
            />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!accountStatus?.hasAccount ? (
          <>
            <div className="space-y-3">
              <p className="text-sm text-default-600">
                To sell products on MDFLD, you'll need to connect a Stripe
                account. This allows us to securely process payments and
                transfer funds to you.
              </p>
              <ul className="space-y-2 text-sm text-default-600">
                <li className="flex items-start gap-2">
                  <Icon
                    icon="solar:check-circle-bold"
                    className="mt-0.5 text-success"
                    width={16}
                  />
                  <span>
                    No monthly fees - we only charge a 10% commission on sales
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    icon="solar:check-circle-bold"
                    className="mt-0.5 text-success"
                    width={16}
                  />
                  <span>Secure payment processing powered by Stripe</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    icon="solar:check-circle-bold"
                    className="mt-0.5 text-success"
                    width={16}
                  />
                  <span>Daily automatic payouts to your bank account</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    icon="solar:check-circle-bold"
                    className="mt-0.5 text-success"
                    width={16}
                  />
                  <span>Full transaction history and reporting</span>
                </li>
              </ul>
            </div>
            <Button
              color="primary"
              onPress={handleStartOnboarding}
              isLoading={createAccount.isPending}
              className="w-full"
              startContent={
                !createAccount.isPending && (
                  <Icon icon="solar:card-bold" width={20} />
                )
              }
            >
              Start Stripe Setup
            </Button>
          </>
        ) : accountStatus.onboardingComplete ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon
                icon="solar:check-circle-bold"
                className="text-success"
                width={24}
              />
              <span className="font-medium text-success">
                Stripe account connected!
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-default-500">Charges Enabled</p>
                <Chip
                  size="sm"
                  variant="flat"
                  color={accountStatus.chargesEnabled ? "success" : "warning"}
                >
                  {accountStatus.chargesEnabled ? "Active" : "Inactive"}
                </Chip>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-default-500">Payouts Enabled</p>
                <Chip
                  size="sm"
                  variant="flat"
                  color={accountStatus.payoutsEnabled ? "success" : "warning"}
                >
                  {accountStatus.payoutsEnabled ? "Active" : "Inactive"}
                </Chip>
              </div>
            </div>
            {(!accountStatus.chargesEnabled ||
              !accountStatus.payoutsEnabled) && (
              <Button
                color="default"
                variant="bordered"
                onPress={handleContinueOnboarding}
                isLoading={createAccountLink.isPending}
                className="w-full"
                startContent={
                  !createAccountLink.isPending && (
                    <Icon icon="solar:settings-bold" width={20} />
                  )
                }
              >
                Update Stripe Account
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-medium bg-warning-50 p-3">
              <Icon
                icon="solar:info-circle-bold"
                className="mt-0.5 text-warning"
                width={20}
              />
              <p className="text-sm text-warning-700">
                Your Stripe account setup is incomplete. Please continue the
                onboarding process.
              </p>
            </div>
            {accountStatus.requirements &&
              accountStatus.requirements.currently_due &&
              accountStatus.requirements.currently_due.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Required information:</p>
                  <ul className="space-y-1">
                    {accountStatus.requirements.currently_due.map(
                      (req: string) => (
                        <li
                          key={req}
                          className="flex items-start gap-2 text-sm text-default-600"
                        >
                          <Icon
                            icon="solar:record-circle-outline"
                            className="mt-0.5"
                            width={16}
                          />
                          <span>{req.replace(/_/g, " ")}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            <Button
              color="primary"
              onPress={handleContinueOnboarding}
              isLoading={createAccountLink.isPending}
              className="w-full"
              startContent={
                !createAccountLink.isPending && (
                  <Icon icon="solar:arrow-right-bold" width={20} />
                )
              }
            >
              Continue Stripe Setup
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
