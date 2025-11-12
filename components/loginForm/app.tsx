"use client";

import { useState } from "react";
import React from "react";
import { Icon } from "@iconify/react";
import { Input, Button, Form, Link, Divider } from "@heroui/react";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LoginFormFrameless() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const [isVisible, setIsVisible] = React.useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await signIn.email(
        {
          email,
          password,
        },
        {
          onSuccess: () => {
            router.push("/dashboard");
          },
          onError: (ctx) => {
            const errorMessage = ctx.error.message || "Login failed";

            // Provide clear error messages for common cases
            if (
              errorMessage.toLowerCase().includes("invalid") ||
              errorMessage.toLowerCase().includes("credentials")
            ) {
              setErrors({
                general: "Invalid email or password. Please try again.",
              });
            } else if (
              errorMessage.toLowerCase().includes("not found") ||
              errorMessage.toLowerCase().includes("no user")
            ) {
              setErrors({
                general:
                  "No account found with this email. Please sign up first.",
              });
            } else if (
              errorMessage.toLowerCase().includes("verify") ||
              errorMessage.toLowerCase().includes("verification")
            ) {
              setErrors({
                general:
                  "Please verify your email before logging in. Check your inbox for the verification link.",
              });
            } else {
              setErrors({ general: errorMessage });
            }
          },
        },
      );
    } catch (err) {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-large flex w-full max-w-sm flex-col gap-4">
        <div className="flex flex-col items-center pb-6">
          <p className="text-xl font-medium">Welcome Back</p>
          <p className="text-small text-default-500">
            Log in to your account to continue
          </p>
        </div>
        <Form
          className="flex flex-col gap-3"
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
            placeholder="Enter your email"
            labelPlacement="outside"
            type="email"
            variant="faded"
            radius="sm"
            classNames={{ label: "font-normal tracking-wider after:hidden" }}
          />
          <Input
            isRequired
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
            label="Password"
            name="password"
            placeholder="Enter your password"
            labelPlacement="outside"
            type={isVisible ? "text" : "password"}
            variant="faded"
            radius="sm"
            classNames={{ label: "font-normal tracking-wider after:hidden" }}
          />
          <div className="flex w-full items-center justify-end px-1 py-2">
            <Link
              className="text-default-500"
              href="/auth/forgot-password"
              size="sm"
            >
              Forgot password?
            </Link>
          </div>
          <Button
            className="w-full"
            color="primary"
            type="submit"
            isLoading={isLoading}
            isDisabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </Form>
        <div className="flex items-center gap-4 py-2">
          <Divider className="flex-1" />
          <p className="text-tiny text-default-500 shrink-0">OR</p>
          <Divider className="flex-1" />
        </div>
        <div className="flex flex-col gap-2">
          <Button
            startContent={<Icon icon="flat-color-icons:google" width={24} />}
            variant="bordered"
            onPress={async () => {
              try {
                await signIn.social({
                  provider: "google",
                  callbackURL: "/dashboard",
                });
              } catch (error) {
                setErrors({
                  general: "Google sign-in failed. Please try again.",
                });
              }
            }}
            isDisabled={isLoading}
          >
            Continue with Google
          </Button>
        </div>
        <p className="text-small text-center">
          Need to create an account?&nbsp;
          <Link href="/auth/login" size="sm">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
