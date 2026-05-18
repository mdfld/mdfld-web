import type { TourDefinition } from "@/types/onboarding";

export const TOURS: TourDefinition[] = [
  {
    pageId: 'dashboard',
    steps: [
      {
        selector: '[data-onboarding="dashboard-nav"]',
        title: 'Your hub',
        body: 'Your orders, returns, and wishlist live here.',
      },
      {
        selector: '[data-onboarding="checklist-panel"]',
        title: 'Getting started',
        body: 'Complete these steps to get the most out of MDFLD.',
      },
      {
        selector: '[data-onboarding="dashboard-settings"]',
        title: 'Account settings',
        body: 'Manage your account and notification preferences here.',
      },
    ],
  },
  {
    pageId: 'bag',
    steps: [
      {
        selector: '[data-onboarding="auth-badge"]',
        title: 'Verified Authentic',
        body: 'Every item ships with a verified authentic certificate.',
      },
      {
        selector: '[data-onboarding="buyer-protection"]',
        title: 'Buyer protection',
        body: 'Your purchase is protected — full refund if authentication fails.',
      },
    ],
  },
  {
    pageId: 'checkout',
    steps: [
      {
        selector: '[data-onboarding="auth-badge"]',
        title: 'Verified Authentic',
        body: 'Every item on MDFLD has been verified authentic before sale.',
      },
      {
        selector: '[data-onboarding="buyer-protection"]',
        title: "You're protected",
        body: 'Full refund guaranteed if authentication fails after delivery.',
      },
    ],
  },
  {
    pageId: 'returns',
    steps: [
      {
        selector: '[data-onboarding="returns-policy"]',
        title: 'Return policy',
        body: 'Returns accepted within 3 days of delivery if the item differs from its listing.',
      },
      {
        selector: '[data-onboarding="returns-cta"]',
        title: 'Start a return',
        body: 'Our team reviews every return case within 48 hours.',
      },
    ],
  },
  {
    pageId: 'connect',
    steps: [
      {
        selector: '[data-onboarding="conversation-list"]',
        title: 'Direct messaging',
        body: 'Message sellers directly about listings, sizing, or condition.',
      },
      {
        selector: '[data-onboarding="response-time"]',
        title: 'Response time',
        body: 'Sellers are expected to respond within 24 hours.',
      },
    ],
  },
  {
    pageId: 'org-setup',
    steps: [
      {
        selector: '[data-onboarding="org-checklist"]',
        title: 'Set up your store',
        body: 'Complete these steps to go live on MDFLD.',
      },
      {
        selector: '[data-onboarding="org-name-field"]',
        title: 'Store identity',
        body: 'This is the first thing buyers see — make it count.',
      },
    ],
  },
  {
    pageId: 'org-profile',
    steps: [
      {
        selector: '[data-onboarding="storefront-header"]',
        title: 'Your storefront',
        body: 'This is what buyers see when they visit your store.',
      },
      {
        selector: '[data-onboarding="listings-section"]',
        title: 'Your listings',
        body: 'Active listings appear here — keep them accurate and up to date.',
      },
    ],
  },
];

export function getTour(pageId: string): TourDefinition | undefined {
  return TOURS.find((t) => t.pageId === pageId);
}
