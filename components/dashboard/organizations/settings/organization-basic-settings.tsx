"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Input,
  Textarea,
  Select,
  SelectItem,
  Button,
  Spacer,
  Card,
  CardBody,
  Avatar,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { trpc } from "@/lib/trpc-client";
import { cn } from "@heroui/react";
import { useUploadThing } from "@/lib/uploadclient";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Retail",
  "Manufacturing",
  "Education",
  "Real Estate",
  "Hospitality",
  "Transportation",
  "Other",
];

const organizationSizes = [
  { value: "STARTUP", label: "Startup (1-10 employees)" },
  { value: "SMALL", label: "Small (11-50 employees)" },
  { value: "MEDIUM", label: "Medium (51-200 employees)" },
  { value: "LARGE", label: "Large (201-1000 employees)" },
  { value: "ENTERPRISE", label: "Enterprise (1000+ employees)" },
];

const businessTypes = [
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "SMALL_BUSINESS", label: "Small Business" },
  { value: "CORPORATION", label: "Corporation" },
  { value: "NON_PROFIT", label: "Non-Profit" },
];

export default function OrganizationBasicSettings({
  organizationSlug,
}: {
  organizationSlug: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | undefined>(undefined);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const { startUpload: startBannerUpload, isUploading: isBannerUploading } =
    useUploadThing("bannerUploader");
  const { startUpload: startLogoUpload, isUploading: isLogoUploading } =
    useUploadThing("avatarUploader");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    industry: "",
    size: "",
    businessType: "",
    taxId: "",
    businessLicense: "",
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
      setSuccessMessage("Organization updated successfully!");
      refetch();
    },
    onError: (error: any) => {
      setUpdateError(error.message || "Failed to update organization");
    },
  });

  // Delete organization mutation
  const deleteOrganization = trpc.organization.delete.useMutation({
    onSuccess: () => {
      toast.success("Organization deleted successfully");
      router.push("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete organization");
    },
  });

  // Load organization data into form
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || "",
        description: organization.description || "",
        website: organization.website || "",
        industry: organization.industry || "",
        size: organization.size || "",
        businessType: organization.businessType || "",
        taxId: organization.taxId || "",
        businessLicense: organization.businessLicense || "",
      });
      if (organization.banner) {
        setBannerUrl(`${organization.banner}?v=${Date.now()}`);
      } else {
        setBannerUrl(undefined);
      }
      if (organization.logo) {
        setLogoUrl(`${organization.logo}?v=${Date.now()}`);
      } else {
        setLogoUrl(undefined);
      }
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

  const handleUpdateOrganization = async () => {
    if (!organization?.id) return;

    setIsLoading(true);
    setUpdateError(null);
    try {
      await updateOrganization.mutateAsync({
        organizationId: organization.id,
        name: formData.name,
        description: formData.description,
        website: formData.website,
        industry: formData.industry,
        size: formData.size as any,
        businessType: formData.businessType as any,
        taxId: formData.taxId,
        businessLicense: formData.businessLicense,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError("Banner image size must be less than 8MB");
      return;
    }

    try {
      const res = await startBannerUpload([file]);
      if (res && res.length > 0 && res[0]) {
        // @ts-ignore - url property works fine despite deprecation warning
        const newUrl = res[0].url;
        setBannerUrl(`${newUrl}?v=${Date.now()}`);

        if (organization?.id) {
          await updateOrganization.mutateAsync({
            organizationId: organization.id,
            banner: newUrl,
          });
          refetch();
          setSuccessMessage("Banner updated successfully!");
        }
      }
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload banner",
      );
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setUploadError("Logo image size must be less than 4MB");
      return;
    }

    try {
      const res = await startLogoUpload([file]);
      if (res && res.length > 0 && res[0]) {
        // @ts-ignore - url property works fine despite deprecation warning
        const newUrl = res[0].url;
        setLogoUrl(`${newUrl}?v=${Date.now()}`);

        if (organization?.id) {
          await updateOrganization.mutateAsync({
            organizationId: organization.id,
            logo: newUrl,
          });
          refetch();
          setSuccessMessage("Logo updated successfully!");
        }
      }
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload logo",
      );
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const handleDeleteOrganization = () => {
    if (!organization?.id) return;

    deleteOrganization.mutate({ id: organization.id });
  };

  const isConfirmTextCorrect = confirmText === organization?.name;

  return (
    <div className="p-2">
      {/* Organization Profile */}
      <div>
        <p className="text-default-700 text-base font-medium">
          Organization Profile
        </p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          This displays your organization's public profile.
        </p>
        <Card className="bg-default-100 mt-4" shadow="none">
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar
                  className="h-16 w-16"
                  name={organization?.name || "Organization"}
                  src={logoUrl}
                  color="primary"
                />
                <Button
                  isIconOnly
                  className="absolute -bottom-1 -right-1 bg-background/80 text-default-500 h-6 w-6 min-w-6"
                  radius="full"
                  size="sm"
                  variant="bordered"
                  disabled={isLogoUploading}
                  onPress={() => logoInputRef.current?.click()}
                >
                  <Icon icon="solar:pen-linear" width={12} />
                </Button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: "none" }}
                  disabled={isLogoUploading}
                />
              </div>
              <div>
                <p className="text-default-600 text-sm font-medium">
                  {organization?.name || "Organization"}
                </p>
                <p className="text-default-400 text-xs">
                  @{organization?.slug || "slug"}
                </p>
                {isLogoUploading && (
                  <p className="text-default-500 text-xs mt-1">
                    Uploading logo...
                  </p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Spacer y={4} />

      {/* Banner */}
      <div>
        <p className="text-default-700 text-base font-medium">Banner</p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          Upload a banner image to personalize your organization's profile.
        </p>
        <Card className="bg-default-100 mt-4" shadow="none">
          <CardBody>
            <div className="flex flex-col gap-4">
              <div className="relative w-full h-32 bg-default-200 rounded-lg overflow-hidden">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="Organization Banner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-default-400">
                    <Icon icon="solar:image-outline" width={48} />
                  </div>
                )}
                <Button
                  isIconOnly
                  className="absolute top-2 right-2 bg-background/80 text-default-500"
                  radius="full"
                  size="sm"
                  variant="bordered"
                  disabled={isBannerUploading}
                  onPress={() => bannerInputRef.current?.click()}
                >
                  <Icon icon="solar:pen-linear" width={16} />
                </Button>
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                style={{ display: "none" }}
                disabled={isBannerUploading}
              />
              {isBannerUploading && (
                <p className="text-default-500 text-sm">Uploading banner...</p>
              )}
            </div>
          </CardBody>
        </Card>
        {uploadError && (
          <p className="text-danger-500 text-sm mt-2" role="alert">
            {uploadError}
          </p>
        )}
      </div>

      <Spacer y={4} />

      {/* Basic Information */}
      <div>
        <p className="text-default-700 text-base font-medium">
          Organization Name
        </p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          Your organization's display name.
        </p>
        <Input
          className="mt-2"
          placeholder="Enter organization name"
          value={formData.name}
          onChange={handleInputChange("name")}
        />
      </div>

      <Spacer y={4} />

      {/* Description */}
      <div>
        <p className="text-default-700 text-base font-medium">Description</p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          Tell us about your organization.
        </p>
        <Textarea
          className="mt-2"
          classNames={{
            input: cn("min-h-[115px]"),
          }}
          placeholder="e.g., 'We are a tech startup focused on building innovative solutions...'"
          value={formData.description}
          onChange={handleInputChange("description")}
        />
      </div>

      <Spacer y={4} />

      {/* Website */}
      <div>
        <p className="text-default-700 text-base font-medium">Website</p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          Your organization's website URL.
        </p>
        <Input
          className="mt-2"
          placeholder="e.g https://yourcompany.com"
          type="url"
          value={formData.website}
          onChange={handleInputChange("website")}
          startContent={
            <Icon
              className="text-default-400 pointer-events-none flex-shrink-0"
              icon="solar:link-outline"
              width={18}
            />
          }
        />
      </div>

      <Spacer y={4} />

      {/* Industry */}
      <div>
        <p className="text-default-700 text-base font-medium">Industry</p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          Select your organization's industry.
        </p>
        <Select
          className="mt-2"
          placeholder="Select your industry"
          selectedKeys={formData.industry ? [formData.industry] : []}
          onSelectionChange={handleSelectChange("industry")}
        >
          {industries.map((industry) => (
            <SelectItem key={industry}>{industry}</SelectItem>
          ))}
        </Select>
      </div>

      <Spacer y={4} />

      {/* Organization Size */}
      <div>
        <p className="text-default-700 text-base font-medium">
          Organization Size
        </p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          How many employees does your organization have?
        </p>
        <Select
          className="mt-2"
          placeholder="Select organization size"
          selectedKeys={formData.size ? [formData.size] : []}
          onSelectionChange={handleSelectChange("size")}
        >
          {organizationSizes.map((size) => (
            <SelectItem key={size.value}>{size.label}</SelectItem>
          ))}
        </Select>
      </div>

      <Spacer y={4} />

      {/* Business Type */}
      <div>
        <p className="text-default-700 text-base font-medium">Business Type</p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          What type of business entity is your organization?
        </p>
        <Select
          className="mt-2"
          placeholder="Select business type"
          selectedKeys={formData.businessType ? [formData.businessType] : []}
          onSelectionChange={handleSelectChange("businessType")}
        >
          {businessTypes.map((type) => (
            <SelectItem key={type.value}>{type.label}</SelectItem>
          ))}
        </Select>
      </div>

      <Spacer y={4} />

      {/* Tax ID */}
      <div>
        <p className="text-default-700 text-base font-medium">Tax ID</p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          Your organization's tax identification number.
        </p>
        <Input
          className="mt-2"
          placeholder="e.g., 12-3456789"
          value={formData.taxId}
          onChange={handleInputChange("taxId")}
        />
      </div>

      <Spacer y={4} />

      {/* Business License */}
      <div>
        <p className="text-default-700 text-base font-medium">
          Business License
        </p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          Your organization's business license number.
        </p>
        <Input
          className="mt-2"
          placeholder="e.g., BL-123456"
          value={formData.businessLicense}
          onChange={handleInputChange("businessLicense")}
        />
      </div>

      <Button
        onPress={handleUpdateOrganization}
        className="bg-default-foreground text-background mt-4"
        size="sm"
        isLoading={isLoading}
        disabled={
          isLoading ||
          !organization ||
          (organization.role !== "owner" && organization.role !== "admin")
        }
      >
        Update Organization
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

      <Spacer y={8} />

      {/* Danger Zone - Delete Organization */}
      {organization?.role === "owner" && (
        <>
          <div>
            <p className="text-danger text-base font-medium">Danger Zone</p>
            <p className="text-default-400 mt-1 text-sm font-normal">
              Irreversible and destructive actions
            </p>

            <div className="rounded-large border border-danger/20 bg-danger/5 mt-4 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-danger/10 rounded-medium mt-1">
                    <Icon
                      className="text-danger h-5 w-5"
                      icon="solar:trash-bin-trash-bold-duotone"
                    />
                  </div>
                  <div>
                    <p className="text-default-700 text-sm font-medium">
                      Delete Organization
                    </p>
                    <p className="text-default-500 text-xs mt-1">
                      Permanently delete this organization and all of its data.
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
                <Button
                  color="danger"
                  variant="flat"
                  size="sm"
                  onPress={() => setIsDeleteModalOpen(true)}
                  className="shrink-0"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>

          <Spacer y={6} />

          {/* Warning */}
          <div className="rounded-large bg-warning/10 border border-warning/20 p-4">
            <div className="flex items-start gap-3">
              <Icon
                className="text-warning mt-1"
                icon="solar:danger-triangle-bold"
                width={20}
              />
              <div className="text-sm">
                <p className="text-default-700 font-medium">Warning</p>
                <p className="text-default-500 mt-1">
                  Deleting an organization will:
                </p>
                <ul className="text-default-500 mt-2 ml-4 list-disc">
                  <li>Remove all organization data</li>
                  <li>Delete all products and listings</li>
                  <li>Cancel all active subscriptions</li>
                  <li>Remove all member access</li>
                </ul>
                <p className="text-default-500 mt-2">
                  This action is permanent and cannot be reversed.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        size="md"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Delete Organization</h3>
                <p className="text-sm text-default-500 font-normal">
                  This action cannot be undone
                </p>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div className="rounded-medium bg-danger/10 border border-danger/20 p-3">
                    <p className="text-sm text-danger">
                      You are about to permanently delete{" "}
                      <strong>{organization?.name}</strong> and all of its data.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-default-600 mb-2">
                      To confirm, type <strong>{organization?.name}</strong>{" "}
                      below:
                    </p>
                    <Input
                      placeholder="Type organization name"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      variant="bordered"
                      classNames={{
                        input: "text-sm",
                      }}
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose} size="sm">
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={() => {
                    handleDeleteOrganization();
                    onClose();
                  }}
                  isDisabled={!isConfirmTextCorrect}
                  isLoading={deleteOrganization.isPending}
                  size="sm"
                >
                  Delete Organization
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
