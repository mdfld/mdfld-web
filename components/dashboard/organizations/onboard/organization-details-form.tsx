"use client";

import type { InputProps, SelectProps } from "@heroui/react";
import React, { useEffect } from "react";
import { Input, Select, SelectItem } from "@heroui/react";
import { cn } from "@heroui/react";
import type { OrganizationFormData } from "./organization-onboarding";
import companyTypes from "./company-types";
import companyIndustries from "./company-industries";

const companySizes = [
  { value: "STARTUP", title: "Startup (1-10 employees)" },
  { value: "SMALL", title: "Small (11-50 employees)" },
  { value: "MEDIUM", title: "Medium (51-200 employees)" },
  { value: "LARGE", title: "Large (201-1000 employees)" },
  { value: "ENTERPRISE", title: "Enterprise (1000+ employees)" },
];

export type OrganizationDetailsFormProps = {
  data: Partial<OrganizationFormData>;
  onUpdate: (data: Partial<OrganizationFormData>) => void;
} & React.HTMLAttributes<HTMLFormElement>;

const OrganizationDetailsForm = React.forwardRef<
  HTMLFormElement,
  OrganizationDetailsFormProps
>(({ className, data, onUpdate, ...props }, ref) => {
  const [industry, setIndustry] = React.useState(data.industry || "");
  const [size, setSize] = React.useState(data.size || "");
  const [businessType, setBusinessType] = React.useState(
    data.businessType || "",
  );
  const [website, setWebsite] = React.useState(data.website || "");
  const [taxId, setTaxId] = React.useState(data.taxId || "");
  const [businessLicense, setBusinessLicense] = React.useState(
    data.businessLicense || "",
  );

  const inputProps: Pick<InputProps, "labelPlacement" | "classNames"> = {
    labelPlacement: "outside",
    classNames: {
      label:
        "text-small font-medium text-default-700 group-data-[filled-within=true]:text-default-700",
    },
  };

  const selectProps: Pick<SelectProps, "labelPlacement" | "classNames"> = {
    labelPlacement: "outside",
    classNames: {
      label:
        "text-small font-medium text-default-700 group-data-[filled=true]:text-default-700",
    },
  };

  useEffect(() => {
    onUpdate({
      industry,
      size,
      businessType,
      website,
      taxId,
      businessLicense,
    });
  }, [industry, size, businessType, website, taxId, businessLicense]);

  return (
    <>
      <div className="text-default-foreground text-2xl leading-8 font-medium text-left">
        Company Details
      </div>
      <div className="text-sm text-default-500 py-1 text-left">
        Business type and industry information
      </div>
      <form
        ref={ref}
        className={cn("flex grid grid-cols-12 flex-col gap-4 py-8", className)}
        {...props}
      >
        <Select
          className="col-span-12 md:col-span-6"
          items={companyTypes}
          label="Business Type"
          name="business-type"
          placeholder="Select business type"
          selectedKeys={businessType ? [businessType] : []}
          onSelectionChange={(keys) =>
            setBusinessType(Array.from(keys)[0] as string)
          }
          {...selectProps}
        >
          {(companyType) => (
            <SelectItem key={companyType.value}>{companyType.title}</SelectItem>
          )}
        </Select>

        <Select
          className="col-span-12 md:col-span-6"
          items={companySizes}
          label="Company Size"
          name="company-size"
          placeholder="Select company size"
          selectedKeys={size ? [size] : []}
          onSelectionChange={(keys) => setSize(Array.from(keys)[0] as string)}
          {...selectProps}
        >
          {(companySize) => (
            <SelectItem key={companySize.value}>{companySize.title}</SelectItem>
          )}
        </Select>

        <Select
          className="col-span-12"
          items={companyIndustries}
          label="Industry"
          name="industry"
          placeholder="Select your industry"
          selectedKeys={industry ? [industry] : []}
          onSelectionChange={(keys) =>
            setIndustry(Array.from(keys)[0] as string)
          }
          {...selectProps}
        >
          {(companyIndustry) => (
            <SelectItem key={companyIndustry.value}>
              {companyIndustry.title}
            </SelectItem>
          )}
        </Select>

        <Input
          className="col-span-12"
          label="Website"
          name="website"
          placeholder="https://example.com"
          type="url"
          value={website}
          onValueChange={setWebsite}
          {...inputProps}
        />

        <Input
          className="col-span-12 md:col-span-6"
          label="Tax ID / EIN"
          name="tax-id"
          placeholder="12-3456789"
          value={taxId}
          onValueChange={setTaxId}
          {...inputProps}
        />

        <Input
          className="col-span-12 md:col-span-6"
          label="Business License Number"
          name="business-license"
          placeholder="Optional"
          value={businessLicense}
          onValueChange={setBusinessLicense}
          {...inputProps}
        />
      </form>
    </>
  );
});

OrganizationDetailsForm.displayName = "OrganizationDetailsForm";

export default OrganizationDetailsForm;
