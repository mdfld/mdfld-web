"use client";

import React, { useState } from "react";
import { Button, Modal, ModalContent, ModalBody } from "@heroui/react";
import { useOnboarding } from "@/contexts/onboarding-context";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SLIDES = [
  {
    title: "Welcome to MDFLD.",
    body: "Every boot on this platform is verified authentic — no counterfeits, no guesswork.",
    cta: undefined as string | undefined,
  },
  {
    title: "Buy, track, and sell.",
    body: "Browse authenticated boots, track your orders, or set up a store and start selling.",
    cta: undefined as string | undefined,
  },
  {
    title: "Let's get you started.",
    body: "Your dashboard has everything you need. Complete a few steps to unlock the full experience.",
    cta: "Go to Dashboard",
  },
];

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [slide, setSlide] = useState(0);
  const { markTourSeen } = useOnboarding();

  const current = SLIDES[slide];

  const handleClose = async () => {
    await markTourSeen("signup");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm" hideCloseButton>
      <ModalContent>
        <ModalBody className="py-8 px-6 text-center">
          <p className="text-xs text-default-400 mb-4">
            {slide + 1} / {SLIDES.length}
          </p>
          <h2 className="text-xl font-bold mb-2">{current.title}</h2>
          <p className="text-default-600 text-sm mb-6">{current.body}</p>

          <div className="flex justify-center gap-1.5 mb-6">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === slide ? "bg-primary" : "bg-default-200"}`}
              />
            ))}
          </div>

          <div className="flex justify-between items-center">
            <Button size="sm" variant="light" onPress={handleClose}>
              Skip
            </Button>
            {slide < SLIDES.length - 1 ? (
              <Button size="sm" color="primary" onPress={() => setSlide((s) => s + 1)}>
                Next
              </Button>
            ) : (
              <Button size="sm" color="primary" onPress={handleClose}>
                {current.cta}
              </Button>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
