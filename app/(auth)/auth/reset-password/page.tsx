"use client";

import { Suspense } from "react";
import ResetPasswordForm from "./reset-password-form";
import { Spinner } from "@heroui/react";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
