"use client";

import { Suspense } from "react";
import VerifyEmailForm from "./verify-email-form";
import { Spinner } from "@heroui/react";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
