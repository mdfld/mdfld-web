"use client";

import type { InputProps, SelectProps } from "@heroui/react";
import React, { useEffect } from "react";
import { Input, Select, SelectItem } from "@heroui/react";
import { cn } from "@heroui/react";
import type { OrganizationFormData } from "./organization-onboarding";
import companyTypes from "./company-types";
import companyIndustries from "./company-industries";

export type OrganizationDetailsFormProps = {
  data: Partial<OrganizationFormData>;
  onUpdate: (data: Partial<OrganizationFormData>) => void;
} & React.HTMLAttributes<HTMLFormElement>;

const OrganizationDetailsForm = React.forwardRef<
  HTMLFormElement,
  OrganizationDetailsFormProps
>(({ className, data, onUpdate, ...props }, ref) => {
  const [industry, setIndustry] = React.useState(data.industry || "");
  const [businessType, setBusinessType] = React.useState(
    data.businessType || "",
  );
  const [website, setWebsite] = React.useState(data.website || "");

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
    onUpdate({ industry, businessType, website });
  }, [industry, businessType, website]);

  return (
    <>
      <div className="text-default-foreground text-2xl leading-8 font-medium text-left">
        Store Details
      </div>
      <div className="text-sm text-default-500 py-1 text-left">
        All fields on this step are optional
      </div>
      <form
        ref={ref}
        className={cn("flex grid grid-cols-12 flex-col gap-4 py-8", className)}
        {...props}
      >
        <Select
          className="col-span-12 md:col-span-6"
          items={companyTypes}
          label="Seller Type"
          name="business-type"
          placeholder="Select seller type"
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
          items={companyIndustries}
          label="Category Focus"
          name="industry"
          placeholder="Select a category"
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

        <div className="col-span-12 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3">
          <p className="text-xs font-medium text-zinc-400">
            Tax ID and business license are not required to start selling.
            You only need to provide them once your sales exceed $500 in a calendar year.
            You can add them anytime in your store settings.
          </p>
        </div>
      </form>
    </>
  );
});

OrganizationDetailsForm.displayName = "OrganizationDetailsForm";

export default OrganizationDetailsForm;
