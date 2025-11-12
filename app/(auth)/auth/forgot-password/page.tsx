"use client";

import { useState } from "react";
import React from "react";
import { Icon } from "@iconify/react";
import { Card, CardBody, Input, Button, Form, Link } from "@heroui/react";
import { requestPasswordReset } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function ForgotPasswordFormFrameless() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.trim();
    if (!email) {
      setErrors({ general: "Please enter your email address." });
      setIsLoading(false);
      return;
    }

    try {
      await requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      setSuccess(true);
    } catch (err: any) {
      setErrors({
        general:
          err?.message || "Failed to send reset email. Please try again.",
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
              icon="solar:mail-bold"
              width={48}
              className="mx-auto mb-4 text-green-600"
            />
            <p className="text-lg font-medium mb-2">Check your inbox</p>
            <p className="text-sm text-default-500 mb-4">
              We've sent a password reset link to the email you provided.
            </p>
            <Button onPress={() => router.push("/auth/login")} color="primary">
              Back to login
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
          <p className="text-xl font-medium">Reset your password</p>
          <p className="text-small text-default-500">
            Enter your email address and we'll send you a link to reset it
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
            label="Email"
            name="email"
            placeholder="you@example.com"
            labelPlacement="outside"
            type="email"
            variant="faded"
            radius="sm"
            classNames={{ label: "font-normal tracking-wider after:hidden" }}
            disabled={isLoading}
          />

          <Button
            className="w-full"
            color="primary"
            type="submit"
            isLoading={isLoading}
            isDisabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send reset email"}
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
