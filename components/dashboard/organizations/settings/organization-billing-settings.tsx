"use client";

import React from "react";
import { Button, Spacer, Link } from "@heroui/react";
import { Icon } from "@iconify/react";
import { trpc } from "@/lib/trpc-client";

export default function OrganizationBillingSettings({
  organizationSlug,
}: {
  organizationSlug: string;
}) {
  // Fetch organization data
  const { data } = trpc.organization.get.useQuery(
    { slug: organizationSlug },
    { enabled: !!organizationSlug },
  );
  const organization = data as any;

  const handleOpenStripeDashboard = () => {
    // In production, this would open the Stripe Connect dashboard for the specific account
    window.open("https://dashboard.stripe.com/", "_blank");
  };

  return (
    <div className="p-2">
      {/* Stripe Connect Status */}
      <div>
        <p className="text-default-700 text-base font-medium">
          Stripe Connect Dashboard
        </p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          Manage your payments, payouts, and billing settings directly in
          Stripe.
        </p>
        <div className="rounded-large bg-default-100 mt-4">
          <div className="flex items-center justify-between gap-2 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-medium">
                <Icon
                  className="text-primary h-8 w-8"
                  icon="solar:card-bold-duotone"
                />
              </div>
              <div>
                <p className="text-default-600 text-sm font-medium">
                  Payment Processing
                </p>
                <p className="text-default-400 text-xs">
                  View transactions, manage payouts, and update billing settings
                </p>
              </div>
            </div>
          </div>
          <div className="px-4 pb-4">
            <Button
              className="bg-default-foreground text-background w-full"
              radius="md"
              size="md"
              variant="shadow"
              onPress={handleOpenStripeDashboard}
              startContent={
                <Icon icon="solar:square-arrow-right-up-bold" width={20} />
              }
            >
              Open Stripe Dashboard
            </Button>
          </div>
        </div>
      </div>

      <Spacer y={6} />

      {/* Quick Links */}
      <div>
        <p className="text-default-700 text-base font-medium">Quick Links</p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          Access key features in your Stripe dashboard.
        </p>
        <div className="mt-4 space-y-2">
          <Button
            as={Link}
            href="https://dashboard.stripe.com/payments"
            isExternal
            variant="flat"
            className="w-full justify-start"
            startContent={
              <Icon icon="solar:card-transfer-bold-duotone" width={20} />
            }
          >
            View Payments
          </Button>
          <Button
            as={Link}
            href="https://dashboard.stripe.com/balance"
            isExternal
            variant="flat"
            className="w-full justify-start"
            startContent={<Icon icon="solar:wallet-bold-duotone" width={20} />}
          >
            Check Balance
          </Button>
          <Button
            as={Link}
            href="https://dashboard.stripe.com/payouts"
            isExternal
            variant="flat"
            className="w-full justify-start"
            startContent={
              <Icon icon="solar:money-bag-bold-duotone" width={20} />
            }
          >
            Manage Payouts
          </Button>
          <Button
            as={Link}
            href="https://dashboard.stripe.com/invoices"
            isExternal
            variant="flat"
            className="w-full justify-start"
            startContent={
              <Icon icon="solar:document-text-bold-duotone" width={20} />
            }
          >
            View Invoices
          </Button>
        </div>
      </div>

      <Spacer y={6} />

      {/* Help */}
      <div className="rounded-large bg-default-50 p-4">
        <div className="flex items-start gap-3">
          <Icon
            className="text-default-400 mt-1"
            icon="solar:info-circle-bold"
            width={20}
          />
          <div className="text-sm">
            <p className="text-default-600 font-medium">Need help?</p>
            <p className="text-default-400 mt-1">
              Contact Stripe support directly from your dashboard or visit the{" "}
              <Link
                href="https://stripe.com/docs"
                isExternal
                size="sm"
                className="text-primary"
              >
                Stripe documentation
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
