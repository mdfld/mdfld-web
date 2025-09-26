"use client";

import React from "react";
import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import type { OrganizationFormData } from "./organization-onboarding";

export type OrganizationReviewFormProps = {
  data: Partial<OrganizationFormData>;
} & React.HTMLAttributes<HTMLDivElement>;

const OrganizationReviewForm = React.forwardRef<
  HTMLDivElement,
  OrganizationReviewFormProps
>(({ className, data, ...props }, ref) => {
  const hasAddress =
    data.address &&
    (data.address.street ||
      data.address.city ||
      data.address.state ||
      data.address.postalCode);

  return (
    <div ref={ref} {...props} className={className}>
      <div className="text-default-foreground text-3xl leading-9 font-bold">
        Review Your Organization
      </div>
      <div className="text-default-500 py-4">
        Please review the information before creating your organization
      </div>

      <div className="space-y-4 py-8">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-lg font-semibold">Basic Information</h3>
          </CardHeader>
          <CardBody className="space-y-2">
            <div>
              <span className="text-small text-default-500">
                Organization Name:
              </span>
              <p className="font-medium">{data.name || "Not provided"}</p>
            </div>
            <div>
              <span className="text-small text-default-500">
                Organization Slug:
              </span>
              <p className="font-medium">{data.slug || "Not provided"}</p>
            </div>
            {data.description && (
              <div>
                <span className="text-small text-default-500">
                  Description:
                </span>
                <p className="font-medium">{data.description}</p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-lg font-semibold">Organization Details</h3>
          </CardHeader>
          <CardBody className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {data.businessType && (
                <Chip size="sm" variant="flat">
                  Business Type: {data.businessType}
                </Chip>
              )}
              {data.size && (
                <Chip size="sm" variant="flat">
                  Size: {data.size}
                </Chip>
              )}
              {data.industry && (
                <Chip size="sm" variant="flat">
                  Industry: {data.industry}
                </Chip>
              )}
            </div>
            {data.website && (
              <div>
                <span className="text-small text-default-500">Website:</span>
                <p className="font-medium">{data.website}</p>
              </div>
            )}
            {data.taxId && (
              <div>
                <span className="text-small text-default-500">Tax ID:</span>
                <p className="font-medium">{data.taxId}</p>
              </div>
            )}
            {data.businessLicense && (
              <div>
                <span className="text-small text-default-500">
                  Business License:
                </span>
                <p className="font-medium">{data.businessLicense}</p>
              </div>
            )}
          </CardBody>
        </Card>

        {hasAddress && (
          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-lg font-semibold">Business Address</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-1">
                {data.address?.street && <p>{data.address.street}</p>}
                {(data.address?.city ||
                  data.address?.state ||
                  data.address?.postalCode) && (
                  <p>
                    {data.address?.city}
                    {data.address?.city && data.address?.state && ", "}
                    {data.address?.state} {data.address?.postalCode}
                  </p>
                )}
                {data.address?.country && <p>{data.address.country}</p>}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
});

OrganizationReviewForm.displayName = "OrganizationReviewForm";

export default OrganizationReviewForm;
