export interface HelpQuestion {
  q: string;
  a: string;
}

export interface HelpSection {
  id: string;
  label: string;
  questions: HelpQuestion[];
}

export interface HelpSearchResult extends HelpQuestion {
  sectionLabel: string;
}

export const HELP_CONTENT: HelpSection[] = [
  {
    id: "buying",
    label: "Buying",
    questions: [
      {
        q: "How do I find items on MDFLD?",
        a: "Use the search bar at the top of any page to search by brand, model, size, or condition. You can also browse by category or use the filters to narrow results by price, size, and condition.",
      },
      {
        q: "What does 'Verified Authentic' mean?",
        a: "Verified Authentic means the item has been reviewed against MDFLD's authentication criteria and confirmed as genuine. Only items that pass our verification process receive the Verified Authentic badge.",
      },
      {
        q: "How does checkout work?",
        a: "Add items to your cart, proceed to checkout, enter your shipping address, and complete payment. You will receive an order confirmation email and tracking information once the seller ships your item.",
      },
      {
        q: "What payment methods are accepted?",
        a: "MDFLD accepts all major credit and debit cards (Visa, Mastercard, American Express), as well as Apple Pay and Google Pay where supported.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes. All payments are processed through our secure payment provider and your card details are never stored on MDFLD servers. Transactions are encrypted end-to-end.",
      },
    ],
  },
  {
    id: "selling",
    label: "Selling",
    questions: [
      {
        q: "How do I create a store on MDFLD?",
        a: "Go to your account settings and select 'Create Store'. Fill in your store name, description, and payout details. Once approved, you can start listing items immediately.",
      },
      {
        q: "How do I list an item for sale?",
        a: "From your store dashboard, click 'New Listing', add photos, a title, description, condition, size, and price, then publish. Your listing will go live after a brief review.",
      },
      {
        q: "What fees does MDFLD charge sellers?",
        a: "MDFLD charges a 10% commission on each completed sale. There are no listing fees, so you only pay when you sell.",
      },
      {
        q: "When and how do I get paid?",
        a: "Payouts are processed within 3 business days after the buyer confirms receipt or the return window closes. Funds are sent to the bank account or payment method on file in your store settings.",
      },
      {
        q: "What happens after my item sells?",
        a: "You will receive a notification with the buyer's shipping address. Package and ship the item within 3 business days using the provided shipping label, then mark it as shipped in your dashboard.",
      },
    ],
  },
  {
    id: "authentication",
    label: "Authentication",
    questions: [
      {
        q: "What does 'Verified Authentic' mean on MDFLD?",
        a: "The Verified Authentic badge indicates the item has been assessed against brand-specific authentication criteria and confirmed as a genuine product, not a replica or counterfeit.",
      },
      {
        q: "How does the verification process work?",
        a: "Sellers submit detailed photos and item information. Our authentication team reviews stitching, materials, tags, serial numbers, and other brand markers against known authentic examples before granting the badge.",
      },
      {
        q: "What types of items can be verified?",
        a: "Currently MDFLD verifies football boots, match jerseys, training kits, and goalkeeper gloves from major brands. We are expanding authentication coverage to additional gear categories.",
      },
      {
        q: "What if I dispute the authenticity of an item I received?",
        a: "Open a dispute within 48 hours of delivery through your order page. Provide clear photos of the item and the issue. Our team will review your case and issue a refund if the item is found to be inauthentic.",
      },
    ],
  },
  {
    id: "returns",
    label: "Returns",
    questions: [
      {
        q: "What is the MDFLD return policy?",
        a: "Buyers have 48 hours after delivery to request a return if the item is not as described, inauthentic, or arrives damaged. Items must be returned in the same condition they were received.",
      },
      {
        q: "How do I open a return request?",
        a: "Go to your Orders page, select the relevant order, and click 'Request Return'. Describe the issue and upload supporting photos. The seller and MDFLD support team will review your request.",
      },
      {
        q: "How long does a return take to process?",
        a: "Once we receive the returned item and confirm its condition, refunds are processed within 5 business days back to your original payment method.",
      },
      {
        q: "My item arrived damaged or not as described. What do I do?",
        a: "Open a return request immediately through your Orders page and include clear photos of the damage or discrepancy. Do not use or wear the item, as this may affect your return eligibility.",
      },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    questions: [
      {
        q: "How can I contact MDFLD support?",
        a: "You can reach our support team by emailing support@mdfld.co or using the contact form on the Contact page. For urgent order issues, include your order number in the subject line.",
      },
      {
        q: "What is the typical response time?",
        a: "Our team aims to respond to all inquiries within 24 hours on business days. During peak periods such as major tournaments, response times may extend to 48 hours.",
      },
      {
        q: "How do I open a dispute with a seller?",
        a: "Navigate to the relevant order in your Orders page and select 'Open Dispute'. Describe the issue clearly and attach any relevant photos or evidence. MDFLD will mediate between buyer and seller and issue a resolution within 5 business days.",
      },
    ],
  },
];

export function searchHelp(query: string): HelpSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: HelpSearchResult[] = [];
  for (const section of HELP_CONTENT) {
    for (const item of section.questions) {
      if (item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)) {
        results.push({ ...item, sectionLabel: section.label });
      }
    }
  }
  return results;
}
