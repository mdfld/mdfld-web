"use client";

import * as React from "react";
import { Icon } from "@iconify/react";
import {
  Avatar,
  Button,
  Badge,
  Card,
  CardBody,
  cn,
  Input,
  Spacer,
  Textarea,
} from "@heroui/react";
import { useSession, authClient } from "@/lib/auth-client";
import { useUploadThing } from "@/lib/uploadclient";
import { PROFILE_TEMPLATES } from "@/lib/profile-templates";
import { ProfileCompletenessBar } from "@/components/dashboard/settings/profile-completeness-bar";
import { useOnboarding } from "@/contexts/onboarding-context";

interface ProfileSettingCardProps {
  className?: string;
}

const ProfileSetting = React.forwardRef<
  HTMLDivElement,
  ProfileSettingCardProps
>(({ className, ...props }, ref) => {
  const { data: session, refetch: refetchSession } = useSession();
  const { startUpload: startAvatarUpload, isUploading: isAvatarUploading } =
    useUploadThing("avatarUploader");
  const { startUpload: startBannerUpload, isUploading: isBannerUploading } =
    useUploadThing("bannerUploader");
  const { completeStep } = useOnboarding();

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const bannerInputRef = React.useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = React.useState({
    location: "",
    bio: "",
  });
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(
    undefined,
  );
  const [bannerUrl, setBannerUrl] = React.useState<string | undefined>(
    undefined,
  );
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [updateError, setUpdateError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (session?.user) {
      setFormData({
        location: session.user.location || "",
        bio: session.user.bio || "",
      });
      if (session.user.image) {
        setAvatarUrl(`${session.user.image}?v=${Date.now()}`);
      } else {
        setAvatarUrl(undefined);
      }
      if (session.user.banner) {
        setBannerUrl(`${session.user.banner}?v=${Date.now()}`);
      } else {
        setBannerUrl(undefined);
      }
    }
  }, [session]);

  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  React.useEffect(() => {
    if (updateError || uploadError) {
      const timer = setTimeout(() => {
        setUpdateError(null);
        setUploadError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [updateError, uploadError]);

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      setUpdateError(null);

      const updateData: any = {};
      if (formData.bio !== session?.user?.bio) {
        updateData.bio = formData.bio || null;
      }
      if (formData.location !== session?.user?.location) {
        updateData.location = formData.location || null;
      }

      if (Object.keys(updateData).length === 0) {
        setSuccessMessage("No changes to save");
        return;
      }

      await authClient.updateUser(updateData);
      refetchSession();
      setSuccessMessage("Profile updated successfully!");

      if (formData.bio && formData.location) {
        await completeStep("complete-profile", "buyer");
      }
    } catch (error) {
      setUpdateError(
        error instanceof Error
          ? error.message
          : "Failed to update profile. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be less than 5MB");
      return;
    }

    try {
      const res = await startAvatarUpload([file]);
      if (res && res.length > 0 && res[0]) {
        // @ts-ignore - url property works fine despite deprecation warning
        const newUrl = res[0].url;
        setAvatarUrl(`${newUrl}?v=${Date.now()}`);

        await authClient.updateUser({ image: newUrl });
        refetchSession();
        setSuccessMessage("Avatar updated successfully!");
      }
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload avatar",
      );
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const handleButtonPress = () => {
    fileInputRef.current?.click();
  };

  const handleTemplateSelect = async (url: string) => {
    try {
      setUploadError(null);
      setAvatarUrl(`${url}?v=${Date.now()}`);
      await authClient.updateUser({ image: url });
      refetchSession();
      setSuccessMessage("Avatar updated successfully!");
    } catch {
      setUploadError("Failed to apply template");
    }
  };

  const handleBannerButtonPress = () => {
    bannerInputRef.current?.click();
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

        await authClient.updateUser({ banner: newUrl });
        refetchSession();
        setSuccessMessage("Banner updated successfully!");
      }
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload banner",
      );
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  return (
    <div ref={ref} className={cn("p-2", className)} {...props}>
      <ProfileCompletenessBar
        imageUrl={avatarUrl}
        bio={formData.bio}
        location={formData.location}
        bannerUrl={bannerUrl}
      />

      {/* Profile */}
      <div>
        <p className="text-default-700 text-base font-medium">Profile</p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          This displays your public profile on the site.
        </p>
        <Card className="bg-default-100 mt-4" shadow="none">
          <CardBody>
            <div className="flex items-center gap-4">
              <Badge
                showOutline
                classNames={{
                  badge: "w-5 h-5",
                }}
                content={
                  <Button
                    isIconOnly
                    className="bg-background text-default-500 h-5 w-5 min-w-5 p-0"
                    radius="full"
                    size="sm"
                    variant="bordered"
                    disabled={isAvatarUploading}
                    tabIndex={-1}
                    onPress={handleButtonPress}
                  >
                    <Icon className="h-[9px] w-[9px]" icon="solar:pen-linear" />
                  </Button>
                }
                placement="bottom-right"
                shape="circle"
              >
                <Avatar
                  className="h-16 w-16"
                  src={avatarUrl}
                  name={session?.user?.name || "User"}
                  imgProps={{ referrerPolicy: "no-referrer" }}
                  classNames={{
                    img: "opacity-100 transition-opacity duration-300",
                  }}
                />
              </Badge>
              <input
                ref={fileInputRef}
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
                disabled={isAvatarUploading}
              />
              <div>
                <p className="text-default-600 text-sm font-medium">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-default-400 text-xs">
                  {session?.user?.email || "Not set"}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        {uploadError && (
          <p className="text-danger-500 text-sm mt-2" role="alert">
            {uploadError}
          </p>
        )}
        {successMessage && (
          <p className="text-success-500 text-sm mt-2" role="status">
            {successMessage}
          </p>
        )}
      </div>

      <Spacer y={4} />

      {/* Template picker */}
      <div>
        <p className="text-default-700 text-base font-medium">Choose a Template</p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          Select one of the MDFLD icons, or upload your own above.
        </p>
        <div className="mt-3 grid grid-cols-6 gap-2">
          {PROFILE_TEMPLATES.map((url) => {
            const isSelected = avatarUrl?.startsWith(url);
            return (
              <button
                key={url}
                onClick={() => handleTemplateSelect(url)}
                className={cn(
                  "rounded-full overflow-hidden border-2 transition-all",
                  isSelected
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-transparent hover:border-default-300",
                )}
                style={{ aspectRatio: "1" }}
                title={`Template ${url.split("/").pop()?.replace(".png", "")}`}
              >
                <img src={url} alt="template" className="w-full h-full object-cover" />
              </button>
            );
          })}
        </div>
      </div>

      <Spacer y={4} />

      {/* Banner */}
      <div>
        <p className="text-default-700 text-base font-medium">Banner</p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          Upload a banner image to personalize your profile.
        </p>
        <Card className="bg-default-100 mt-4" shadow="none">
          <CardBody>
            <div className="flex flex-col gap-4">
              <div className="relative w-full h-32 bg-default-200 rounded-lg overflow-hidden">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="Profile Banner"
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
                  onPress={handleBannerButtonPress}
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
      </div>

      <Spacer y={4} />

      {/* Location */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-default-700 text-base font-medium">Location</p>
          {!formData.location && (
            <span className="text-xs bg-warning text-white px-2 py-0.5 rounded-full">recommended</span>
          )}
        </div>
        <p className="text-default-400 mt-0 text-sm font-normal">
          Set your current location.
        </p>
        <Input
          className="mt-2"
          placeholder="e.g Buenos Aires, Argentina"
          value={formData.location}
          onChange={handleInputChange("location")}
          classNames={{
            inputWrapper: !formData.location ? "border-warning border-dashed" : "",
          }}
        />
        {!formData.location && (
          <p className="text-xs text-default-400 mt-1">Helps buyers know where their order ships from.</p>
        )}
      </div>

      <Spacer y={4} />

      {/* Biography */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-default-700 text-base font-medium">Biography</p>
          {!formData.bio && (
            <span className="text-xs bg-warning text-white px-2 py-0.5 rounded-full">recommended</span>
          )}
        </div>
        <p className="text-default-400 mt-0 text-sm font-normal">
          Tell us a bit about yourself.
        </p>
        <Textarea
          className="mt-2"
          classNames={{
            input: cn("min-h-[115px]"),
            inputWrapper: !formData.bio ? "border-warning border-dashed" : "",
          }}
          placeholder="e.g., Boot collector based in Atlanta. Specialising in Nike CTR360 and adidas Predator."
          value={formData.bio}
          onChange={handleInputChange("bio")}
        />
        {!formData.bio && (
          <p className="text-xs text-default-400 mt-1">Profiles with a bio get more trust from buyers.</p>
        )}
      </div>

      <Button
        onPress={handleUpdateProfile}
        className="bg-default-foreground text-background mt-4"
        size="sm"
        isLoading={isLoading}
        disabled={isLoading}
      >
        Update Profile
      </Button>
      {updateError && (
        <p className="text-danger-500 text-sm mt-2" role="alert">
          {updateError}
        </p>
      )}
    </div>
  );
});

ProfileSetting.displayName = "ProfileSetting";

export default ProfileSetting;
