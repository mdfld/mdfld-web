export interface OnboardingState {
  buyer: string[];   // completed buyer step IDs
  seller: string[];  // completed seller step IDs
  tours: string[];   // seen tour page IDs
}

export type BuyerStepId =
  | 'verify-email'
  | 'complete-profile'
  | 'browse-shop'
  | 'first-wishlist'
  | 'understand-auth'
  | 'place-order';

export type SellerStepId =
  | 'org-name-bio'
  | 'org-logo'
  | 'payout-method'
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
  | 'org-profile';

export interface ChecklistStep {
  id: BuyerStepId | SellerStepId;
  label: string;
  optional?: boolean;
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
  { id: 'verify-email',     label: 'Verify Email' },
  { id: 'complete-profile', label: 'Complete Your Profile' },
  { id: 'browse-shop',      label: 'Browse the Shop' },
  { id: 'first-wishlist',   label: 'Save a Boot to Wishlist' },
  { id: 'understand-auth',  label: 'Learn How Authentication Works' },
  { id: 'place-order',      label: 'Place Your First Order', optional: true },
];

export const SELLER_CHECKLIST: ChecklistStep[] = [
  { id: 'org-name-bio',   label: 'Add Store Name & Bio' },
  { id: 'org-logo',       label: 'Upload Logo / Banner', optional: true },
  { id: 'payout-method',  label: 'Set Up Payout Method' },
  { id: 'return-policy',  label: 'Set Return Policy' },
  { id: 'list-product',   label: 'List Your First Product' },
];

export const EMPTY_ONBOARDING_STATE: OnboardingState = {
  buyer: [],
  seller: [],
  tours: [],
};
