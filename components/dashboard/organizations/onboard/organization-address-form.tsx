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
  const [shipsFromCountry, setShipsFromCountry] = React.useState(
    data.shipsFromCountry || "",
  );
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
    const update: Partial<OrganizationFormData> = {
      shipsFromCountry: shipsFromCountry || undefined,
    };
    if (street || city || state || postalCode || country) {
      update.address = { street, city, state, postalCode, country };
    }
    onUpdate(update);
  }, [shipsFromCountry, street, city, state, postalCode, country]);

  return (
    <>
      <div className="text-default-foreground text-2xl leading-8 font-medium text-left">
        Location & Shipping
      </div>
      <div className="text-sm text-default-500 py-1 text-left">
        All fields on this step are optional
      </div>

      <form
        ref={ref}
        className={cn("flex grid grid-cols-12 flex-col gap-4 py-8", className)}
        {...props}
      >
        {/* Ships From */}
        <div className="col-span-12">
          <p className="text-small font-medium text-default-700 mb-1">
            Where do you ship from?
          </p>
          <p className="text-xs text-default-400 mb-2">
            This is shown to buyers so they know where their order ships from.
            You can update this anytime in your store settings.
          </p>
          <Select
            items={countries}
            label=""
            aria-label="Ships from country"
            name="ships-from-country"
            placeholder="Select country"
            selectedKeys={shipsFromCountry ? [shipsFromCountry] : []}
            onSelectionChange={(keys) =>
              setShipsFromCountry(Array.from(keys)[0] as string)
            }
            labelPlacement="outside"
            classNames={{
              label:
                "text-small font-medium text-default-700 group-data-[filled=true]:text-default-700",
            }}
          >
            {(country) => (
              <SelectItem key={country.code}>{country.name}</SelectItem>
            )}
          </Select>
        </div>

        {/* Divider */}
        <div className="col-span-12 border-t border-zinc-700 pt-4">
          <p className="text-small font-medium text-default-600 mb-1">
            Business Address
          </p>
          <p className="text-xs text-default-400 mb-4">
            Your official business location for legal and tax purposes.
          </p>
        </div>

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
