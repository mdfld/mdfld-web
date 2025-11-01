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

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const bannerInputRef = React.useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = React.useState({
    location: "",
    bio: "",
    website: "",
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
        website: session.user.website || "",
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
      if (formData.website !== session?.user?.website) {
        updateData.website = formData.website || null;
      }

      if (Object.keys(updateData).length === 0) {
        setSuccessMessage("No changes to save");
        return;
      }

      await authClient.updateUser(updateData);
      refetchSession();
      setSuccessMessage("Profile updated successfully!");
    } catch (error) {
      // Failed to update profile
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
        <p className="text-default-700 text-base font-medium">Location</p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          Set your current location.
        </p>
        <Input
          className="mt-2"
          placeholder="e.g Buenos Aires, Argentina"
          value={formData.location}
          onChange={handleInputChange("location")}
        />
      </div>

      <Spacer y={4} />

      {/* Website */}
      <div>
        <p className="text-default-700 text-base font-medium">Website</p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          Add your personal website or portfolio URL.
        </p>
        <Input
          className="mt-2"
          placeholder="e.g https://yourwebsite.com"
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

      {/* Biography */}
      <div>
        <p className="text-default-700 text-base font-medium">Biography</p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          Tell us a bit about yourself.
        </p>
        <Textarea
          className="mt-2"
          classNames={{
            input: cn("min-h-[115px]"),
          }}
          placeholder="e.g., 'Kate Moore - Acme.com Support Specialist. Passionate about solving tech issues, loves hiking and volunteering.'"
          value={formData.bio}
          onChange={handleInputChange("bio")}
        />
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
