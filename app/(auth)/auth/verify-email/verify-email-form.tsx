"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Card, CardBody, Button, Input } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendVerificationEmail, useSession } from "@/lib/auth-client";

export default function VerifyEmailForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
  }, [session]);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      verifyEmail(token);
    }
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      // BetterAuth handles email verification through the main auth endpoint
      const response = await fetch(
        `/api/auth/email-verification/verify?token=${token}`,
        {
          method: "GET",
        },
      );

      if (response.ok) {
        setSuccess(true);
        // Auto-redirect after verification
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        const data = await response
          .json()
          .catch(() => ({ error: "Verification failed" }));
        setError(
          data.error ||
            "Verification failed. The link may be expired or invalid.",
        );
      }
    } catch (err) {
      console.error("Email verification error:", err);
      setError(
        "An unexpected error occurred. Please try again or request a new verification link.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setEmailSent(false);

    try {
      await sendVerificationEmail({
        email: email,
        callbackURL: "/dashboard",
      });
      setEmailSent(true);
    } catch (err: any) {
      setError(
        err?.message || "Failed to send verification email. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardBody className="text-center">
            <Icon
              icon="solar:refresh-linear"
              width={48}
              className="mx-auto mb-4 text-primary animate-spin"
            />
            <p className="text-lg font-medium">Verifying your email...</p>
            <p className="text-sm text-default-500 mt-2">
              Please wait while we confirm your email address.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

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
            <p className="text-lg font-medium mb-2">Email verified!</p>
            <p className="text-sm text-default-500 mb-4">
              Your email has been successfully verified. Redirecting to
              dashboard...
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardBody>
          <div className="text-center mb-6">
            <Icon
              icon="solar:mail-opened-linear"
              width={48}
              className="mx-auto mb-4 text-primary"
            />
            <h1 className="text-xl font-medium mb-2">Verify your email</h1>
            <p className="text-sm text-default-500">
              {session?.user
                ? "We've sent a verification link to your email address."
                : "Enter your email to receive a verification link."}
            </p>
          </div>

          {error && (
            <div className="text-danger text-sm mb-4 p-3 bg-danger-50 rounded-md">
              {error}
            </div>
          )}

          {emailSent && (
            <div className="text-success text-sm mb-4 p-3 bg-success-50 rounded-md">
              Verification email sent! Please check your inbox.
            </div>
          )}

          <div className="space-y-3">
            {!session?.user && (
              <Input
                type="email"
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="faded"
                radius="sm"
                labelPlacement="outside"
                classNames={{
                  label: "font-normal tracking-wider after:hidden",
                }}
              />
            )}

            <Button
              onPress={handleResendEmail}
              color="primary"
              variant="flat"
              isLoading={isLoading}
              isDisabled={isLoading || (!session?.user && !email)}
              className="w-full"
            >
              {isLoading ? "Sending..." : "Send verification email"}
            </Button>

            <Button
              onPress={() => router.push("/auth/login")}
              variant="light"
              className="w-full"
            >
              Back to login
            </Button>
          </div>

          <div className="mt-6 text-xs text-default-400">
            <p className="font-semibold mb-1">Didn't receive the email?</p>
            <p>
              • Check your spam folder
              <br />• Make sure you entered the correct email
              <br />• Wait a few minutes and try resending
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
