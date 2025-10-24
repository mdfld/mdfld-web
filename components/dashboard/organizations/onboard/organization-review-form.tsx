"use client";

import React from "react";
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
      <div className="text-2xl font-medium mb-1">Review & Confirm</div>
      <div className="text-sm text-gray-500 mb-8">Verify your details</div>

      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl font-medium">
            {data.name || "Organization Name"}
          </h1>
          <p className="text-sm text-gray-500">
            @{data.slug || "organization-slug"}
          </p>
          {data.description && (
            <p className="text-sm text-gray-400 mt-2">{data.description}</p>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Business Info */}
          {(data.businessType || data.size || data.industry) && (
            <div className="space-y-2">
              {data.businessType && (
                <div className="text-sm">
                  <span className="text-gray-500">Type:</span>{" "}
                  <span className="text-gray-300">
                    {data.businessType.replace(/_/g, " ")}
                  </span>
                </div>
              )}
              {data.size && (
                <div className="text-sm">
                  <span className="text-gray-500">Size:</span>{" "}
                  <span className="text-gray-300">{data.size}</span>
                </div>
              )}
              {data.industry && (
                <div className="text-sm">
                  <span className="text-gray-500">Industry:</span>{" "}
                  <span className="text-gray-300">{data.industry}</span>
                </div>
              )}
            </div>
          )}

          {/* Legal Info */}
          {(data.taxId || data.businessLicense || data.website) && (
            <div className="space-y-2">
              {data.taxId && (
                <div className="text-sm">
                  <span className="text-gray-500">Tax ID:</span>{" "}
                  <span className="text-gray-300">{data.taxId}</span>
                </div>
              )}
              {data.businessLicense && (
                <div className="text-sm">
                  <span className="text-gray-500">License:</span>{" "}
                  <span className="text-gray-300">{data.businessLicense}</span>
                </div>
              )}
              {data.website && (
                <div className="text-sm">
                  <span className="text-gray-500">Website:</span>{" "}
                  <span className="text-gray-300">{data.website}</span>
                </div>
              )}
            </div>
          )}

          {/* Address */}
          {hasAddress && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500">Address</div>
              <div className="text-sm text-gray-300">
                {data.address?.street && <div>{data.address.street}</div>}
                {(data.address?.city ||
                  data.address?.state ||
                  data.address?.postalCode) && (
                  <div>
                    {data.address?.city}
                    {data.address?.city && data.address?.state && ", "}
                    {data.address?.state} {data.address?.postalCode}
                  </div>
                )}
                {data.address?.country && <div>{data.address.country}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

OrganizationReviewForm.displayName = "OrganizationReviewForm";

export default OrganizationReviewForm;
