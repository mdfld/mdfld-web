export type ProductVerificationStatus =
  | "UNVERIFIED"
  | "VERIFIED_AUTHENTIC"
  | "VERIFIED_REPLICA";

export type VerificationBadgeInfo = {
  label: string;
  icon: string;
  color: "success" | "primary";
};

// Storefront badge metadata. UNVERIFIED has no entry - no badge is shown.
export const VERIFICATION_BADGES: Partial<
  Record<ProductVerificationStatus, VerificationBadgeInfo>
> = {
  VERIFIED_AUTHENTIC: {
    label: "Verified Authentic",
    icon: "solar:verified-check-bold",
    color: "success",
  },
  VERIFIED_REPLICA: {
    label: "Verified Replica",
    icon: "solar:copy-bold",
    color: "primary",
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
