"use client";

import { useSession } from "@/lib/auth-client";
import { Spinner, Card, CardBody, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SidebarWrapper from "@/components/sidebar/dashboard/app";
import { trpc } from "@/lib/trpc-client";
import { useOrganizationStore } from "@/lib/stores/organization";
import { Icon } from "@iconify/react";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

export default function StripeConnect() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const activeOrganization = useOrganizationStore(
    (state) => state.activeOrganization,
  );

  const { data: stripeStatus, isLoading: stripeLoading } =
    trpc.stripe.getAccountStatus.useQuery(
      { organizationId: activeOrganization?.id },
      { enabled: !!activeOrganization?.id && !!session },
    );

  const createConnectAccount = trpc.stripe.createConnectAccount.useMutation({
    onSuccess: (data) => {
      if (data.accountLink) {
        window.location.href = data.accountLink;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create Stripe account");
    },
  });

  const createAccountLink = trpc.stripe.createAccountLink.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create account link");
    },
  });

  useEffect(() => {
    if (!sessionPending && !session) {
      router.push("/auth/login");
    }
  }, [session, sessionPending, router]);

  useEffect(() => {
    if (!activeOrganization && !sessionPending && session) {
      router.push("/dashboard");
    }
  }, [activeOrganization, sessionPending, session, router]);

  if (typeof window === "undefined" || sessionPending || stripeLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (!activeOrganization) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">Please select an organization first</p>
        </div>
      </div>
    );
  }

  const handleSetupStripe = () => {
    if (!session.user.email) {
      toast.error("Email is required for Stripe setup");
      return;
    }

    createConnectAccount.mutate({
      organizationId: activeOrganization.id,
      email: session.user.email,
    });
  };

  const handleContinueOnboarding = () => {
    createAccountLink.mutate({
      organizationId: activeOrganization.id,
    });
  };

  return (
    <div className="flex h-screen">
      <SidebarWrapper>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-medium mb-2">Stripe Connect</h1>
              <p className="text-default-500">
                Set up your payment processing to start accepting payments
              </p>
            </div>

            <Card>
              <CardBody className="p-8">
                {!stripeStatus?.hasAccount ? (
                  <div className="text-center">
                    <Icon
                      icon="solar:card-2-linear"
                      className="w-16 h-16 mx-auto mb-4 text-default-400"
                    />
                    <h3 className="text-lg font-medium mb-2">
                      Set up Stripe Connect
                    </h3>
                    <p className="text-default-500 mb-6 max-w-md mx-auto">
                      Connect your Stripe account to start accepting payments
                      from customers. This enables secure payment processing and
                      automatic payouts.
                    </p>
                    <Button
                      color="primary"
                      size="lg"
                      isLoading={createConnectAccount.isPending}
                      onPress={handleSetupStripe}
                      startContent={
                        <Icon icon="solar:card-linear" className="w-5 h-5" />
                      }
                    >
                      Set up Stripe
                    </Button>
                  </div>
                ) : !stripeStatus.onboardingComplete ? (
                  <div className="text-center">
                    <Icon
                      icon="solar:clock-circle-linear"
                      className="w-16 h-16 mx-auto mb-4 text-warning"
                    />
                    <h3 className="text-lg font-medium mb-2">
                      Complete Your Setup
                    </h3>
                    <p className="text-default-500 mb-6 max-w-md mx-auto">
                      Your Stripe account setup is incomplete. Please continue
                      the onboarding process to start accepting payments.
                    </p>
                    <Button
                      color="warning"
                      variant="flat"
                      size="lg"
                      isLoading={createAccountLink.isPending}
                      onPress={handleContinueOnboarding}
                      startContent={
                        <Icon
                          icon="solar:arrow-right-linear"
                          className="w-5 h-5"
                        />
                      }
                    >
                      Continue Setup
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-success/10 p-3 rounded-lg">
                          <Icon
                            icon="solar:check-circle-bold"
                            className="w-6 h-6 text-success"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium">
                            Stripe Connected
                          </h3>
                          <p className="text-sm text-default-500">
                            Your account is active and ready to accept payments
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-default-50 p-4 rounded-lg">
                        <p className="text-sm text-default-500 mb-1">
                          Charges Enabled
                        </p>
                        <div className="flex items-center gap-2">
                          <Icon
                            icon={
                              stripeStatus.chargesEnabled
                                ? "solar:check-circle-bold"
                                : "solar:close-circle-bold"
                            }
                            className={`w-5 h-5 ${
                              stripeStatus.chargesEnabled
                                ? "text-success"
                                : "text-danger"
                            }`}
                          />
                          <span className="font-medium">
                            {stripeStatus.chargesEnabled ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>

                      <div className="bg-default-50 p-4 rounded-lg">
                        <p className="text-sm text-default-500 mb-1">
                          Payouts Enabled
                        </p>
                        <div className="flex items-center gap-2">
                          <Icon
                            icon={
                              stripeStatus.payoutsEnabled
                                ? "solar:check-circle-bold"
                                : "solar:close-circle-bold"
                            }
                            className={`w-5 h-5 ${
                              stripeStatus.payoutsEnabled
                                ? "text-success"
                                : "text-danger"
                            }`}
                          />
                          <span className="font-medium">
                            {stripeStatus.payoutsEnabled ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {stripeStatus.requirements &&
                      stripeStatus.requirements.currently_due &&
                      stripeStatus.requirements.currently_due.length > 0 && (
                        <div className="border border-warning/20 bg-warning/5 p-4 rounded-lg mb-6">
                          <p className="text-sm font-medium text-warning mb-2">
                            Action Required
                          </p>
                          <p className="text-sm text-default-600 mb-3">
                            Please complete the following requirements:
                          </p>
                          <ul className="list-disc list-inside text-sm text-default-500 space-y-1">
                            {stripeStatus.requirements.currently_due.map(
                              (req: string) => (
                                <li key={req}>{req.replace(/_/g, " ")}</li>
                              ),
                            )}
                          </ul>
                          <Button
                            color="warning"
                            variant="flat"
                            size="sm"
                            className="mt-4"
                            isLoading={createAccountLink.isPending}
                            onPress={handleContinueOnboarding}
                          >
                            Complete Requirements
                          </Button>
                        </div>
                      )}

                    <div className="flex gap-3">
                      <Button
                        as="a"
                        href="https://dashboard.stripe.com"
                        target="_blank"
                        variant="flat"
                        startContent={
                          <Icon
                            icon="solar:square-arrow-right-up-linear"
                            className="w-4 h-4"
                          />
                        }
                      >
                        Open Stripe Dashboard
                      </Button>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </SidebarWrapper>
    </div>
  );
}
