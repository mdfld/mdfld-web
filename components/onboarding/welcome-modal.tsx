"use client";

import React, { useState } from "react";
import { Button, Modal, ModalContent, ModalBody, Textarea } from "@heroui/react";
import { useOnboarding } from "@/contexts/onboarding-context";
import { PROFILE_TEMPLATES } from "@/lib/profile-templates";
import { authClient } from "@/lib/auth-client";
import { cn } from "@heroui/react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INTRO_SLIDES = [
  {
    title: "Welcome to MDFLD.",
    body: "Every boot on this platform is verified authentic — no counterfeits, no guesswork.",
  },
  {
    title: "Buy, track, and sell.",
    body: "Browse authenticated boots, track your orders, or set up a store and start selling.",
  },
  {
    title: "Let's get you started.",
    body: "Your dashboard has everything you need. Complete a few steps to unlock the full experience.",
  },
];

const TOTAL_SLIDES = 5;

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [slide, setSlide] = useState(0);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>("");
  const [bio, setBio] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Set<"buyer" | "seller">>(
    new Set(["buyer"])
  );
  const [isSaving, setIsSaving] = useState(false);
  const { markTourSeen, setSellerOptIn } = useOnboarding();

  const toggleRole = (role: "buyer" | "seller") => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  };

  const handleNext = async () => {
    if (slide === 3) {
      if (selectedAvatarUrl || bio.trim()) {
        try {
          const update: Record<string, string> = {};
          if (selectedAvatarUrl) update.image = selectedAvatarUrl;
          if (bio.trim()) update.bio = bio.trim();
          await authClient.updateUser(update);
        } catch {
          // non-blocking — user can update profile later
        }
      }
    }
    setSlide((s) => s + 1);
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      if (selectedRoles.has("seller")) {
        await setSellerOptIn();
      }
      await markTourSeen("signup");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    await markTourSeen("signup");
    onClose();
  };

  const canFinish = selectedRoles.size > 0;

  return (
    <Modal isOpen={isOpen} onClose={handleSkip} size="sm" hideCloseButton>
      <ModalContent>
        <ModalBody className="py-8 px-6">
          <p className="text-xs text-default-400 mb-4 text-center">
            {slide + 1} / {TOTAL_SLIDES}
          </p>

          {/* Slides 0–2: intro */}
          {slide <= 2 && (
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">{INTRO_SLIDES[slide].title}</h2>
              <p className="text-default-600 text-sm mb-6">{INTRO_SLIDES[slide].body}</p>
              <div className="flex justify-center gap-1.5 mb-6">
                {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${i === slide ? "bg-primary" : "bg-default-200"}`}
                  />
                ))}
              </div>
              <div className="flex justify-between items-center">
                <Button size="sm" variant="light" onPress={handleSkip}>
                  Skip
                </Button>
                <Button size="sm" color="primary" onPress={handleNext}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Slide 3: profile setup */}
          {slide === 3 && (
            <div>
              <h2 className="text-lg font-bold mb-1 text-center">Set up your profile</h2>
              <p className="text-xs text-default-500 mb-4 text-center">
                Pick an icon or upload your own in Settings later.
              </p>
              <div className="grid grid-cols-6 gap-2 mb-4">
                {PROFILE_TEMPLATES.map((url) => (
                  <button
                    key={url}
                    onClick={() => setSelectedAvatarUrl(url)}
                    className={cn(
                      "rounded-full overflow-hidden border-2 transition-all aspect-square",
                      selectedAvatarUrl === url
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-default-300",
                    )}
                  >
                    <img src={url} alt="avatar" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Short bio (optional)"
                value={bio}
                onValueChange={setBio}
                minRows={2}
                classNames={{ input: "text-sm" }}
                className="mb-4"
              />
              <div className="flex justify-between items-center">
                <Button size="sm" variant="light" onPress={() => setSlide((s) => s + 1)}>
                  Skip
                </Button>
                <Button size="sm" color="primary" onPress={handleNext}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Slide 4: role selection */}
          {slide === 4 && (
            <div>
              <h2 className="text-lg font-bold mb-1 text-center">What brings you here?</h2>
              <p className="text-xs text-default-500 mb-4 text-center">Select all that apply</p>
              <div className="space-y-3 mb-6">
                {(["buyer", "seller"] as const).map((role) => {
                  const selected = selectedRoles.has(role);
                  return (
                    <button
                      key={role}
                      onClick={() => toggleRole(role)}
                      className={cn(
                        "w-full text-left rounded-xl border-2 p-3 transition-all",
                        selected ? "border-primary bg-primary-50" : "border-divider",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">
                            {role === "buyer" ? "🛒 I'm here to buy" : "🏪 I also want to sell"}
                          </p>
                          <p className="text-xs text-default-500">
                            {role === "buyer"
                              ? "Browse & buy verified authentic gear"
                              : "Set up a store & list your boots"}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                            selected ? "bg-primary border-primary" : "border-default-300",
                          )}
                        >
                          {selected && <span className="text-white text-xs">✓</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between items-center">
                <Button size="sm" variant="light" onPress={() => setSlide((s) => s - 1)}>
                  Back
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  onPress={handleFinish}
                  isDisabled={!canFinish}
                  isLoading={isSaving}
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
