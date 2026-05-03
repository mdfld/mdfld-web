"use client";

import { useState } from "react";
import SignUpFormFrameless from "@/components/signupForm/app";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";

export default function SignupPage() {
  const [showWelcome, setShowWelcome] = useState(false);

  return (
    <>
      <SignUpFormFrameless onSuccess={() => setShowWelcome(true)} />
      {showWelcome && (
        <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
      )}
    </>
  );
}
