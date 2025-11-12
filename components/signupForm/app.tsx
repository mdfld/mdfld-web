"use client";
import React from "react";
import { Button, Input, Checkbox, Link, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";
import { signUp, signIn } from "@/lib/auth-client"; // Import your Better Auth client
import { useRouter } from "next/navigation";

export default function SignUpFormFrameless() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = React.useState(false);
  const [agreeToTerms, setAgreeToTerms] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const router = useRouter();

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const username = (formData.get("username") as string).trim();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Client-side validation
    const validationErrors: Record<string, string> = {};

    if (!name.trim()) {
      validationErrors.name = "Full name is required";
    }

    if (!username) {
      validationErrors.username = "Username is required";
    } else if (username.length < 3) {
      validationErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      validationErrors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    if (!email.trim()) {
      validationErrors.email = "Email is required";
    }

    if (!password) {
      validationErrors.password = "Password is required";
    } else if (password.length < 8) {
      validationErrors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      validationErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      validationErrors.confirmPassword = "Passwords do not match";
    }

    if (!agreeToTerms) {
      validationErrors.terms = "You must agree to the Terms and Privacy Policy";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    // Better Auth sign up
    try {
      const { error } = await signUp.email(
        {
          name: name,
          email: email,
          password: password,
          username: username,
        },
        {
          onSuccess: () => {
            // Show success message for email verification
            setErrors({
              general:
                "Account created successfully! Please check your email to verify your account before signing in.",
            });
            // Don't redirect immediately - user needs to verify email
            setTimeout(() => {
              router.push("/auth/login");
            }, 3000);
          },
          onError: (ctx) => {
            const errorMessage =
              ctx.error.message || "An error occurred during sign up";

            // Provide clear error messages for common cases
            if (
              errorMessage.toLowerCase().includes("email") &&
              errorMessage.toLowerCase().includes("already")
            ) {
              setErrors({
                email:
                  "This email is already registered. Please log in instead.",
              });
            } else if (
              errorMessage.toLowerCase().includes("username") &&
              errorMessage.toLowerCase().includes("already")
            ) {
              setErrors({
                username:
                  "This username is already taken. Please choose another.",
              });
            } else if (errorMessage.toLowerCase().includes("email")) {
              setErrors({ email: errorMessage });
            } else if (errorMessage.toLowerCase().includes("password")) {
              setErrors({ password: errorMessage });
            } else {
              setErrors({ general: errorMessage });
            }
          },
        },
      );

      if (error && !errors.general) {
        setErrors({
          general: error.message || "An error occurred during sign up",
        });
      }
    } catch (error) {
      setErrors({ general: "An unexpected error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (error) {
      setErrors({ general: "Google sign up failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-large flex w-full max-w-sm flex-col gap-4">
        <div className="flex flex-col items-center pb-6">
          <p className="text-xl font-medium">Welcome</p>
          <p className="text-small text-default-500">
            Create an account to get started
          </p>
        </div>

        {errors.general && (
          <div
            className={`text-sm text-center p-3 rounded-lg ${
              errors.general.includes("successfully")
                ? "text-success bg-success-50"
                : "text-danger bg-danger-50"
            }`}
          >
            {errors.general}
          </div>
        )}

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <Input
              isRequired
              classNames={{
                base: "-mb-[2px]",
                inputWrapper:
                  "rounded-b-none data-[hover=true]:z-10 group-data-[focus-visible=true]:z-10",
              }}
              label="Full Name"
              name="name"
              placeholder="Enter your full name"
              type="text"
              variant="bordered"
              isInvalid={!!errors.name}
              errorMessage={errors.name}
            />
            <Input
              isRequired
              classNames={{
                base: "-mb-[2px]",
                inputWrapper:
                  "rounded-none data-[hover=true]:z-10 group-data-[focus-visible=true]:z-10",
              }}
              label="Username"
              name="username"
              placeholder="Choose a username"
              type="text"
              variant="bordered"
              isInvalid={!!errors.username}
              errorMessage={errors.username}
            />
            <Input
              isRequired
              classNames={{
                base: "-mb-[2px]",
                inputWrapper:
                  "rounded-none data-[hover=true]:z-10 group-data-[focus-visible=true]:z-10",
              }}
              label="Email"
              name="email"
              placeholder="Enter your email"
              type="email"
              variant="bordered"
              isInvalid={!!errors.email}
              errorMessage={errors.email}
            />
            <Input
              isRequired
              classNames={{
                base: "-mb-[2px]",
                inputWrapper:
                  "rounded-none data-[hover=true]:z-10 group-data-[focus-visible=true]:z-10",
              }}
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
              type={isVisible ? "text" : "password"}
              variant="bordered"
              isInvalid={!!errors.password}
              errorMessage={errors.password}
            />
            <Input
              isRequired
              classNames={{
                inputWrapper: "rounded-t-none",
              }}
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
              label="Confirm Password"
              name="confirmPassword"
              placeholder="Confirm your password"
              type={isConfirmVisible ? "text" : "password"}
              variant="bordered"
              isInvalid={!!errors.confirmPassword}
              errorMessage={errors.confirmPassword}
            />
          </div>
          <Checkbox
            isRequired
            className="py-4"
            size="sm"
            name="agreeToTerms"
            isSelected={agreeToTerms}
            onValueChange={setAgreeToTerms}
            isInvalid={!!errors.terms}
          >
            {" "}
            I agree with the&nbsp;
            <Link className="relative z-1" href="/terms" size="sm">
              Terms
            </Link>
            &nbsp; and&nbsp;
            <Link className="relative z-1" href="/privacy" size="sm">
              Privacy Policy
            </Link>
          </Checkbox>

          {errors.terms && (
            <p className="text-danger text-sm -mt-2">{errors.terms}</p>
          )}

          <Button
            color="primary"
            type="submit"
            isLoading={isLoading}
            isDisabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </Button>
        </form>

        <div className="flex items-center gap-4 py-2">
          <Divider className="flex-1" />
          <p className="text-tiny text-default-500 shrink-0">OR</p>
          <Divider className="flex-1" />
        </div>

        <div className="flex flex-col gap-2">
          <Button
            startContent={<Icon icon="flat-color-icons:google" width={24} />}
            variant="bordered"
            onPress={handleGoogleSignUp}
            isDisabled={isLoading}
          >
            Sign Up with Google
          </Button>
        </div>

        <p className="text-small text-center">
          Already have an account?&nbsp;
          <Link href="/auth/login" size="sm">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
