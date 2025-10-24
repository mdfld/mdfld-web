"use client";

import type { InputProps, SelectProps } from "@heroui/react";
import React, { useEffect } from "react";
import { Input, Select, SelectItem } from "@heroui/react";
import { cn } from "@heroui/react";
import type { OrganizationFormData } from "./organization-onboarding";
import states from "./states";
import countries from "./countries";

export type OrganizationAddressFormProps = {
  data: Partial<OrganizationFormData>;
  onUpdate: (data: Partial<OrganizationFormData>) => void;
} & React.HTMLAttributes<HTMLFormElement>;

const OrganizationAddressForm = React.forwardRef<
  HTMLFormElement,
  OrganizationAddressFormProps
>(({ className, data, onUpdate, ...props }, ref) => {
  const [street, setStreet] = React.useState(data.address?.street || "");
  const [city, setCity] = React.useState(data.address?.city || "");
  const [state, setState] = React.useState(data.address?.state || "");
  const [postalCode, setPostalCode] = React.useState(
    data.address?.postalCode || "",
  );
  const [country, setCountry] = React.useState(data.address?.country || "US");

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
    if (street || city || state || postalCode || country) {
      onUpdate({
        address: {
          street,
          city,
          state,
          postalCode,
          country,
        },
      });
    }
  }, [street, city, state, postalCode, country]);

  return (
    <>
      <div className="text-default-foreground text-2xl leading-8 font-medium text-left">
        Business Address
      </div>
      <div className="text-sm text-default-500 py-1 text-left">
        Your organization's official location
      </div>
      <div className="text-default-500 py-4">
        Where is your organization located? (Optional)
      </div>
      <form
        ref={ref}
        className={cn("flex grid grid-cols-12 flex-col gap-4 py-8", className)}
        {...props}
      >
        <Input
          className="col-span-12"
          label="Street Address"
          name="street"
          placeholder="123 Main Street, Suite 100"
          value={street}
          onValueChange={setStreet}
          {...inputProps}
        />

        <Input
          className="col-span-12 md:col-span-6"
          label="City"
          name="city"
          placeholder="San Francisco"
          value={city}
          onValueChange={setCity}
          {...inputProps}
        />

        <Select
          className="col-span-12 md:col-span-6"
          items={states}
          label="State/Province"
          name="state"
          placeholder="Select state"
          selectedKeys={state ? [state] : []}
          onSelectionChange={(keys) => setState(Array.from(keys)[0] as string)}
          {...selectProps}
        >
          {(state) => <SelectItem key={state.value}>{state.title}</SelectItem>}
        </Select>

        <Input
          className="col-span-12 md:col-span-6"
          label="Postal Code"
          name="postal-code"
          placeholder="94102"
          value={postalCode}
          onValueChange={setPostalCode}
          {...inputProps}
        />

        <Select
          className="col-span-12 md:col-span-6"
          items={countries}
          label="Country"
          name="country"
          placeholder="Select country"
          selectedKeys={country ? [country] : []}
          onSelectionChange={(keys) =>
            setCountry(Array.from(keys)[0] as string)
          }
          {...selectProps}
        >
          {(country) => (
            <SelectItem key={country.code}>{country.name}</SelectItem>
          )}
        </Select>
      </form>
    </>
  );
});

OrganizationAddressForm.displayName = "OrganizationAddressForm";

export default OrganizationAddressForm;
