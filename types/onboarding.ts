export interface OnboardingState {
  buyer: BuyerStepId[];
  seller: SellerStepId[];
  tours: TourPageId[];
  sellerOptIn: boolean;
}

export type BuyerStepId =
  | 'verify-email'
  | 'complete-profile'
  | 'browse-shop'
  | 'first-wishlist'
  | 'place-order';

export type SellerStepId =
  | 'org-name-bio'
  | 'org-logo'
  | 'payout-details'
  | 'return-policy'
  | 'list-product';

export type TourPageId =
  | 'signup'
  | 'dashboard'
  | 'bag'
  | 'checkout'
  | 'returns'
  | 'connect'
  | 'org-setup'
  | 'org-profile'
  | 'seller-nudge';

export interface ChecklistStep {
  id: BuyerStepId | SellerStepId;
  label: string;
  optional?: boolean;
  href?: string;
}

export interface TourStep {
  selector: string;       // CSS selector for the element to spotlight
  title: string;
  body: string;
}

export interface TourDefinition {
  pageId: TourPageId;
  steps: TourStep[];
}

export const BUYER_CHECKLIST: ChecklistStep[] = [
  { id: 'verify-email',     label: 'Verify Email',         href: '/auth/verify-email' },
  { id: 'complete-profile', label: 'Complete Your Profile', href: '/dashboard/settings?tab=profile' },
  { id: 'browse-shop',      label: 'Browse the Shop',       href: '/shop' },
  { id: 'first-wishlist',   label: 'Save an Item to Wishlist', href: '/shop' },
  { id: 'place-order',      label: 'Place Your First Order', href: '/shop', optional: true },
];

export const SELLER_CHECKLIST: ChecklistStep[] = [
  { id: 'org-name-bio',   label: 'Add Store Name & Bio',      href: '/dashboard/organization/settings' },
  { id: 'org-logo',       label: 'Upload Logo / Banner',      href: '/dashboard/organization/settings', optional: true },
  { id: 'payout-details', label: 'Add Payout Details',        href: '/dashboard/organization/settings?tab=payout' },
  { id: 'return-policy',  label: 'Set Return Policy',         href: '/dashboard/organization/settings?tab=policy' },
  { id: 'list-product',   label: 'List Your First Product',   href: '/dashboard/organization/listings' },
];

export const EMPTY_ONBOARDING_STATE: OnboardingState = {
  buyer: [],
  seller: [],
  tours: [],
  sellerOptIn: false,
};
