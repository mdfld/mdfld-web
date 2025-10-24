"use client";

import React from "react";
import { Tabs, Tab } from "@heroui/react";
import OrganizationBasicSettings from "./organization-basic-settings";
import OrganizationAddressSettings from "./organization-address-settings";
import OrganizationBillingSettings from "./organization-billing-settings";

export default function OrganizationSettingsLayout({
  organizationSlug,
}: {
  organizationSlug: string;
}) {
  return (
    <div className="flex h-dvh w-full gap-4">
      <div className="w-full max-w-2xl flex-1 p-4">
        {/* Title */}
        <div className="flex items-center gap-x-3">
          <h1 className="text-default-foreground text-3xl leading-9 font-bold">
            Organization Settings
          </h1>
        </div>
        <h2 className="text-small text-default-500 mt-2">
          Manage your organization's profile, members, and billing preferences.
        </h2>
        {/* Tabs */}
        <Tabs
          fullWidth
          classNames={{
            base: "mt-6",
            cursor: "bg-content1 dark:bg-content1",
            panel: "w-full p-0 pt-4",
          }}
        >
          <Tab key="profile" title="Profile">
            <OrganizationBasicSettings organizationSlug={organizationSlug} />
          </Tab>
          <Tab key="address" title="Address">
            <OrganizationAddressSettings organizationSlug={organizationSlug} />
          </Tab>
          <Tab key="billing" title="Billing">
            <OrganizationBillingSettings organizationSlug={organizationSlug} />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
