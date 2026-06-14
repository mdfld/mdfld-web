export type ProductVerificationStatus =
  | "UNVERIFIED"
  | "VERIFIED_AUTHENTIC"
  | "VERIFIED_REPLICA";

export type VerificationBadgeInfo = {
  label: string;
  icon: string;
  textClassName: string;
  chipClassNames: { base: string; content: string };
};

// Storefront badge metadata for every verification status, including UNVERIFIED ("Fan-Made").
export const VERIFICATION_BADGES: Record<
  ProductVerificationStatus,
  VerificationBadgeInfo
> = {
  UNVERIFIED: {
    label: "Fan-Made",
    icon: "solar:question-circle-linear",
    textClassName: "text-default-400",
    chipClassNames: { base: "bg-default-400/20", content: "text-default-400" },
  },
  VERIFIED_AUTHENTIC: {
    label: "Verified Authentic",
    icon: "solar:verified-check-bold",
    textClassName: "text-[#44cfcf]",
    chipClassNames: { base: "bg-[#44cfcf]/20", content: "text-[#44cfcf]" },
  },
  VERIFIED_REPLICA: {
    label: "Verified Replica",
    icon: "solar:copy-bold",
    textClassName: "text-primary",
    chipClassNames: { base: "bg-primary/20", content: "text-primary" },
  },
};

export function getVerificationBadge(
  status?: string | null,
): VerificationBadgeInfo | undefined {
  if (!status) return undefined;
  return VERIFICATION_BADGES[status as ProductVerificationStatus];
}

// Admin table dropdown/label options, including UNVERIFIED.
export type VerificationStatusOption = {
  value: ProductVerificationStatus;
  label: string;
  color: string;
};

export const VERIFICATION_STATUS_OPTIONS: VerificationStatusOption[] = [
  { value: "UNVERIFIED", label: "Unverified", color: "#999999" },
  { value: "VERIFIED_AUTHENTIC", label: "Verified Authentic", color: "#10b981" },
  { value: "VERIFIED_REPLICA", label: "Verified Replica", color: "#0066ff" },
];

export function getVerificationStatusOption(
  status?: string | null,
): VerificationStatusOption {
  return (
    VERIFICATION_STATUS_OPTIONS.find((opt) => opt.value === status) ??
    VERIFICATION_STATUS_OPTIONS[0]
  );
}
