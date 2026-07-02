"use client";

import type { InputProps } from "@heroui/react";
import React, { useEffect } from "react";
import { Input } from "@heroui/react";
import { cn } from "@heroui/react";
import type { OrganizationFormData } from "./organization-onboarding";

export type OrganizationDetailsFormProps = {
  data: Partial<OrganizationFormData>;
  onUpdate: (data: Partial<OrganizationFormData>) => void;
} & React.HTMLAttributes<HTMLFormElement>;

const OrganizationDetailsForm = React.forwardRef<
  HTMLFormElement,
  OrganizationDetailsFormProps
>(({ className, data, onUpdate, ...props }, ref) => {
  const [website, setWebsite] = React.useState(data.website || "");

  const inputProps: Pick<InputProps, "labelPlacement" | "classNames"> = {
    labelPlacement: "outside",
    classNames: {
      label:
        "text-small font-medium text-default-700 group-data-[filled-within=true]:text-default-700",
    },
  };

  useEffect(() => {
    onUpdate({ website });
  }, [website]);

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
