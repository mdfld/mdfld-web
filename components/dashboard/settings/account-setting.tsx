"use client";

import * as React from "react";
import { Button, Input, Select, SelectItem, Spacer } from "@heroui/react";
import { cn } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { authClient, useSession } from "@/lib/auth-client";
import { JoinDate } from "./join-date";

interface AccountSettingCardProps {
  className?: string;
}

const timeZoneOptions = [
  {
    label: "Coordinated Universal Time (UTC-3)",
    value: "utc-3",
    description: "Coordinated Universal Time (UTC-3)",
  },
  {
    label: "Coordinated Universal Time (UTC-4)",
    value: "utc-4",
    description: "Coordinated Universal Time (UTC-4)",
  },
  {
    label: "Coordinated Universal Time (UTC-5)",
    value: "utc-5",
    description: "Coordinated Universal Time (UTC-5)",
  },
];

const AccountSetting = React.forwardRef<
  HTMLDivElement,
  AccountSettingCardProps
>(({ className, ...props }, ref) => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPasswordChangeLoading, setIsPasswordChangeLoading] =
    React.useState(false);

  // Form states
  const [fullName, setFullName] = React.useState(session?.user?.name || "");
  const [displayUsername, setDisplayUsername] = React.useState(
    session?.user?.displayUsername || "",
  );
  const [username, setUsername] = React.useState(session?.user?.username || "");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  React.useEffect(() => {
    if (session?.user) {
      setFullName(session.user.name || "");
      setDisplayUsername(session.user.displayUsername || "");
      setUsername(session.user.username || "");
    }
  }, [session]);

  const handleUpdateProfile = async () => {
    if (!session?.user) return;

    setIsLoading(true);
    try {
      const { error } = await authClient.updateUser({
        name: fullName,
        displayUsername: displayUsername,
        username: username,
      });

      if (error) {
        addToast({
          title: "Update Failed",
          description: error.message || "Failed to update profile",
          color: "danger",
        });
      } else {
        addToast({
          title: "Success",
          description: "Profile updated successfully",
          color: "success",
        });
      }
    } catch (err: any) {
      addToast({
        title: "Update Failed",
        description: err.message || "Failed to update profile",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast({
        title: "Validation Error",
        description: "Please fill in all password fields",
        color: "warning",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({
        title: "Validation Error",
        description: "New passwords do not match",
        color: "warning",
      });
      return;
    }

    if (newPassword.length < 8) {
      addToast({
        title: "Validation Error",
        description: "Password must be at least 8 characters long",
        color: "warning",
      });
      return;
    }

    setIsPasswordChangeLoading(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });

      if (error) {
        addToast({
          title: "Password Change Failed",
          description: error.message || "Failed to change password",
          color: "danger",
        });
      } else {
        addToast({
          title: "Success",
          description: "Password changed successfully",
          color: "success",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      addToast({
        title: "Password Change Failed",
        description: err.message || "Failed to change password",
        color: "danger",
      });
    } finally {
      setIsPasswordChangeLoading(false);
    }
  };

  return (
    <div ref={ref} className={cn("p-2", className)} {...props}>
      {/* Full name */}
      <div>
        <p className="text-default-700 text-base font-medium">Full name</p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          Name to be used for emails.
        </p>
        <Input
          className="mt-2"
          placeholder="e.g Kate Moore"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <Spacer y={2} />

      {/* Display Username */}
      <div>
        <p className="text-default-700 text-base font-medium">
          Display Username
        </p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          Your display name as shown to other users.
        </p>
        <Input
          className="mt-2"
          placeholder="e.g Kate Moore"
          value={displayUsername}
          onChange={(e) => setDisplayUsername(e.target.value)}
        />
      </div>
      <Spacer y={2} />

      {/* Username */}
      <div>
        <p className="text-default-700 text-base font-medium">Username</p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          Your unique username for login (lowercase, alphanumeric, underscores,
          and dots only).
        </p>
        <Input
          className="mt-2"
          placeholder="kate.moore"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
        />
      </div>
      <Spacer y={2} />

      {/* Email Address - Read Only */}
      <div>
        <p className="text-default-700 text-base font-medium">Email Address</p>
        <p className="text-default-400 mt-1 text-sm font-normal">
          The email address associated with your account (cannot be changed
          here).
        </p>
        <Input
          className="mt-2"
          value={session?.user?.email || ""}
          isReadOnly
          variant="flat"
        />
      </div>
      <Spacer y={2} />

      {/* Join Date */}
      {session?.user?.createdAt && (
        <>
          <JoinDate createdAt={session.user.createdAt} />
          <Spacer y={2} />
        </>
      )}

      {/* Timezone */}
      <section>
        <div>
          <p className="text-default-700 text-base font-medium">Timezone</p>
          <p className="text-default-400 mt-1 text-sm font-normal">
            Set your current timezone.
          </p>
        </div>
        <Select className="mt-2" defaultSelectedKeys={["utc-3"]}>
          {timeZoneOptions.map((timeZoneOption) => (
            <SelectItem key={timeZoneOption.value}>
              {timeZoneOption.label}
            </SelectItem>
          ))}
        </Select>
      </section>
      <Spacer y={2} />

      <Button
        className="bg-default-foreground text-background mt-4"
        size="sm"
        onPress={handleUpdateProfile}
        isLoading={isLoading}
      >
        Update Account
      </Button>

      <Spacer y={4} />

      {/* Password Change Section */}
      <div className="border-t border-default-200 pt-4">
        <h3 className="text-default-700 text-lg font-semibold mb-4">
          Change Password
        </h3>

        <div>
          <p className="text-default-700 text-base font-medium">
            Current Password
          </p>
          <Input
            className="mt-2"
            type="password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <Spacer y={2} />

        <div>
          <p className="text-default-700 text-base font-medium">New Password</p>
          <p className="text-default-400 mt-1 text-sm font-normal">
            Must be at least 8 characters long.
          </p>
          <Input
            className="mt-2"
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <Spacer y={2} />

        <div>
          <p className="text-default-700 text-base font-medium">
            Confirm New Password
          </p>
          <Input
            className="mt-2"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <Spacer y={2} />

        <Button
          className="bg-danger text-white mt-4"
          size="sm"
          onPress={handleChangePassword}
          isLoading={isPasswordChangeLoading}
        >
          Change Password
        </Button>
      </div>
    </div>
  );
});

AccountSetting.displayName = "AccountSetting";

export default AccountSetting;
