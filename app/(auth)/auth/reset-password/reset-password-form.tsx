"use client";

import { useState, useEffect } from "react";
import React from "react";
import { Icon } from "@iconify/react";
import { Card, CardBody, Input, Button, Form, Link } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/auth-client";

export default function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [isVisible, setIsVisible] = React.useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = React.useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setErrors({
        general: "Invalid reset link. Please request a new password reset.",
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrors({ general: "Passwords do not match." });
      return;
    }

    if (password.length < 8) {
      setErrors({ general: "Password must be at least 8 characters long." });
      return;
    }

    if (!token) {
      setErrors({ general: "Invalid reset token." });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await resetPassword({
        newPassword: password,
        token,
      });
      setSuccess(true);
    } catch (err: any) {
      setErrors({
        general:
          err?.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardBody className="text-center">
            <Icon
              icon="solar:check-circle-bold"
              width={48}
              className="mx-auto mb-4 text-green-600"
            />
            <p className="text-lg font-medium mb-2">
              Password reset successful!
            </p>
            <p className="text-sm text-default-500 mb-4">
              You can now sign in with your new password.
            </p>
            <Button onPress={() => router.push("/auth/login")} color="primary">
              Go to login
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center pb-6">
          <p className="text-xl font-medium">Set new password</p>
          <p className="text-small text-default-500">
            Enter your new password below
          </p>
        </div>
        <Form
          className="flex flex-col gap-4"
          validationBehavior="native"
          onSubmit={handleSubmit}
          validationErrors={errors}
        >
          {errors.general && (
            <div className="text-danger text-sm text-center">
              {errors.general}
            </div>
          )}

          <Input
            isRequired
            label="New Password"
            name="password"
            placeholder="Enter new password"
            labelPlacement="outside"
            type={isVisible ? "text" : "password"}
            variant="faded"
            radius="sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            endContent={
              <button type="button" onClick={toggleVisibility}>
                {isVisible ? (
                  <Icon
                    className="text-default-400 pointer-events-none text-2xl"
                    icon="solar:eye-closed-linear"
                  />
                ) : (
                  <Icon
                    className="text-default-400 pointer-events-none text-2xl"
                    icon="solar:eye-bold"
                  />
                )}
              </button>
            }
            classNames={{ label: "font-normal tracking-wider after:hidden" }}
            disabled={isLoading || !token}
          />

          <Input
            isRequired
            label="Confirm Password"
            name="confirmPassword"
            placeholder="Confirm new password"
            labelPlacement="outside"
            type={isConfirmVisible ? "text" : "password"}
            variant="faded"
            radius="sm"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            endContent={
              <button type="button" onClick={toggleConfirmVisibility}>
                {isConfirmVisible ? (
                  <Icon
                    className="text-default-400 pointer-events-none text-2xl"
                    icon="solar:eye-closed-linear"
                  />
                ) : (
                  <Icon
                    className="text-default-400 pointer-events-none text-2xl"
                    icon="solar:eye-bold"
                  />
                )}
              </button>
            }
            classNames={{ label: "font-normal tracking-wider after:hidden" }}
            disabled={isLoading || !token}
          />

          <Button
            className="w-full"
            color="primary"
            type="submit"
            isLoading={isLoading}
            isDisabled={isLoading || !token}
          >
            {isLoading ? "Resetting..." : "Reset password"}
          </Button>

          <div className="text-center pt-2">
            <Link href="/auth/login" className="text-default-500" size="sm">
              Back to login
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
