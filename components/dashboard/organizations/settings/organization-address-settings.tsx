"use client";

import React, { useState, useEffect } from "react";
import { Input, Button, Spacer, Select, SelectItem } from "@heroui/react";
import { trpc } from "@/lib/trpc-client";

const countries = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "MX", label: "Mexico" },
  { value: "GB", label: "United Kingdom" },
  { value: "FR", label: "France" },
  { value: "DE", label: "Germany" },
  { value: "JP", label: "Japan" },
  { value: "AU", label: "Australia" },
  { value: "BR", label: "Brazil" },
  { value: "IN", label: "India" },
  { value: "CN", label: "China" },
  { value: "KR", label: "South Korea" },
];

export default function OrganizationAddressSettings({
  organizationSlug,
}: {
  organizationSlug: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    addressCountry: "",
  });

  // Fetch organization data
  const { data, refetch } = trpc.organization.get.useQuery(
    { slug: organizationSlug },
    { enabled: !!organizationSlug },
  );
  const organization = data as any;

  // Update mutation
  const updateOrganization = trpc.organization.update.useMutation({
    onSuccess: () => {
      setSuccessMessage("Address updated successfully!");
      refetch();
    },
    onError: (error: any) => {
      setUpdateError(error.message || "Failed to update address");
    },
  });

  // Load organization data into form
  useEffect(() => {
    if (organization) {
      setFormData({
        addressStreet: organization.addressStreet || "",
        addressCity: organization.addressCity || "",
        addressState: organization.addressState || "",
        addressZip: organization.addressZip || "",
        addressCountry: organization.addressCountry || "",
      });
    }
  }, [organization]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (updateError) {
      const timer = setTimeout(() => setUpdateError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [updateError]);

  const handleUpdateAddress = async () => {
    if (!organization?.id) return;

    setIsLoading(true);
    setUpdateError(null);
    try {
      await updateOrganization.mutateAsync({
        organizationId: organization.id,
        ...formData,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleSelectChange = (field: string) => (keys: any) => {
    const selected = Array.from(keys)[0] as string;
    setFormData((prev) => ({
      ...prev,
      [field]: selected,
    }));
  };

  return (
    <div className="p-2">
      {/* Street Address */}
      <div>
        <p className="text-default-700 text-base font-medium">Street Address</p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          Your organization's street address.
        </p>
        <Input
          className="mt-2"
          placeholder="123 Main Street"
          value={formData.addressStreet}
          onChange={handleInputChange("addressStreet")}
        />
      </div>

      <Spacer y={4} />

      {/* City & State */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-default-700 text-base font-medium">City</p>
          <p className="text-default-400 mt-1 text-sm font-normal">
            City name.
          </p>
          <Input
            className="mt-2"
            placeholder="San Francisco"
            value={formData.addressCity}
            onChange={handleInputChange("addressCity")}
          />
        </div>

        <div>
          <p className="text-default-700 text-base font-medium">
            State/Province
          </p>
          <p className="text-default-400 mt-1 text-sm font-normal">
            State or province.
          </p>
          <Input
            className="mt-2"
            placeholder="CA"
            value={formData.addressState}
            onChange={handleInputChange("addressState")}
          />
        </div>
      </div>

      <Spacer y={4} />

      {/* ZIP & Country */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-default-700 text-base font-medium">
            ZIP/Postal Code
          </p>
          <p className="text-default-400 mt-1 text-sm font-normal">
            Postal code.
          </p>
          <Input
            className="mt-2"
            placeholder="94103"
            value={formData.addressZip}
            onChange={handleInputChange("addressZip")}
          />
        </div>

        <div>
          <p className="text-default-700 text-base font-medium">Country</p>
          <p className="text-default-400 mt-1 text-sm font-normal">
            Select your country.
          </p>
          <Select
            className="mt-2"
            placeholder="Select country"
            selectedKeys={
              formData.addressCountry ? [formData.addressCountry] : []
            }
            onSelectionChange={handleSelectChange("addressCountry")}
          >
            {countries.map((country) => (
              <SelectItem key={country.value}>{country.label}</SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <Button
        onPress={handleUpdateAddress}
        className="bg-default-foreground text-background mt-4"
        size="sm"
        isLoading={isLoading}
        disabled={
          isLoading ||
          !organization ||
          (organization.role !== "owner" && organization.role !== "admin")
        }
      >
        Update Address
      </Button>
      {updateError && (
        <p className="text-danger-500 text-sm mt-2" role="alert">
          {updateError}
        </p>
      )}
      {successMessage && (
        <p className="text-success-500 text-sm mt-2" role="status">
          {successMessage}
        </p>
      )}
    </div>
  );
}
