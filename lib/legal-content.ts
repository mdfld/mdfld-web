export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] };

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  slug: string;
  title: string;
  effectiveDate: string;
  intro: string;
  sections: LegalSection[];
}

const p = (text: string): LegalBlock => ({ kind: "p", text });
const list = (...items: string[]): LegalBlock => ({ kind: "list", items });

export const TERMS_OF_SERVICE: LegalDoc = {
  slug: "terms",
  title: "Terms of Service",
  effectiveDate: "July 9, 2026",
  intro:
    "These Terms of Service (the \"Terms\") govern your access to and use of the MDFLD website, applications, and services (collectively, the \"Services\") operated by MDFLD LLC (\"MDFLD\", \"we\", \"us\", or \"our\"). By creating an account, accessing, or using the Services, you agree to be bound by these Terms and by our Privacy Policy. If you do not agree, do not use the Services.",
  sections: [
    {
      id: "eligibility",
      title: "1. Eligibility and Accounts",
      blocks: [
        p(
          "You must be at least 18 years old and able to form a legally binding contract to create an account or transact on MDFLD. By using the Services you represent that you meet these requirements.",
        ),
        p(
          "You agree to provide accurate, current, and complete information when registering and to keep it up to date. You are responsible for all activity that occurs under your account and for keeping your credentials secure. We strongly recommend enabling two-factor authentication or a passkey. Notify us immediately at support@mdfld.co if you suspect unauthorized use of your account.",
        ),
        p(
          "We may require identity verification (KYC) before you can sell, receive payouts, or access certain features. We may refuse, suspend, or terminate accounts that fail verification or that we reasonably believe present a fraud risk.",
        ),
      ],
    },
    {
      id: "marketplace-role",
      title: "2. Our Role as a Marketplace",
      blocks: [
        p(
          "MDFLD is a marketplace that connects buyers and sellers of football gear, including boots, jerseys, stickers, and related items. Unless an item is listed by MDFLD directly, the seller of record is the individual or organization that created the listing. Except as expressly stated in these Terms or required by law, MDFLD is not a party to the sales contract between buyer and seller.",
        ),
        p(
          "For payment purposes, MDFLD acts as the commerce facilitator for transactions on the platform. Each seller appoints MDFLD as its limited payment collection agent solely to collect payments from buyers on the seller's behalf. Payment made by a buyer to MDFLD is considered payment made directly to the seller, and the seller must fulfill the order as if it had received the funds directly.",
        ),
        p(
          "Where required by marketplace facilitator laws, MDFLD calculates, collects, and remits applicable sales taxes on transactions made through the Services.",
        ),
      ],
    },
    {
      id: "buying",
      title: "3. Buying on MDFLD",
      blocks: [
        p(
          "When you place an order you make a binding offer to purchase the item at the listed price plus any shipping costs, taxes, and fees shown at checkout. Payments are processed by our payment provider, Stripe. MDFLD does not store your full card details.",
        ),
        p(
          "Item availability, condition, and descriptions are provided by sellers. Review listing details, photos, and the seller's shipping and return policies before purchasing. Returns, refunds, and disputes are handled under our Refund, Return, and Dispute Resolution Policy, which is incorporated into these Terms.",
        ),
      ],
    },
    {
      id: "selling",
      title: "4. Selling on MDFLD",
      blocks: [
        p("If you list items for sale on MDFLD, you agree that:"),
        list(
          "You own the items you list or are authorized to sell them, and your listings are accurate, complete, and not misleading, including item condition, authenticity, and provenance.",
          "You will only list authentic items. Counterfeit, replica-sold-as-authentic, stolen, or otherwise infringing items are strictly prohibited and will result in listing removal, forfeiture of related proceeds where permitted by law, and account termination.",
          "You will ship sold items promptly, use accurate tracking, and honor the shipping and return policies stated on your listings.",
          "You will complete any identity, business, or payout verification we or our payment providers require, which may include providing your legal name, date of birth, address, tax identification number, and bank or PayPal payout details.",
          "You authorize MDFLD to deduct commissions, payment processing costs, and other fees disclosed to you before they apply, from the proceeds of your sales.",
        ),
        p(
          "Payouts are made through Stripe or PayPal to the payout method you configure. We may delay, withhold, or lock payouts and balances while an order, dispute, chargeback, or fraud review is pending, or as required by law.",
        ),
      ],
    },
    {
      id: "authenticity",
      title: "5. Authenticity Verification Program",
      blocks: [
        p(
          "MDFLD operates an authenticity verification program under which certain listings may display badges such as \"Verified Authentic\", \"Replica\", or \"Fan-Made\". Verification outcomes are based on the information available to us at the time, which may include seller-provided photos, item details, automated analysis, and manual review.",
        ),
        p(
          "A verification badge reflects our good-faith assessment and is provided for informational purposes. It is not a warranty or guarantee of authenticity, and it does not replace the buyer protections in our Refund, Return, and Dispute Resolution Policy. We may add, change, or remove a badge at any time as new information becomes available.",
        ),
        p(
          "You agree not to misrepresent the verification status of any item, to alter or fabricate badges, or to use MDFLD verification language off-platform in a misleading way.",
        ),
      ],
    },
    {
      id: "user-content",
      title: "6. Your Content and License to MDFLD",
      blocks: [
        p(
          "\"User Content\" means anything you upload, post, or transmit through the Services, including product photographs, listing titles and descriptions, item details, profile information, reviews, and messages. You retain ownership of your User Content.",
        ),
        p(
          "By submitting User Content, you grant MDFLD a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to host, store, reproduce, adapt, modify, create derivative works of, publish, publicly display, and distribute that content for the purposes of operating, marketing, and improving the Services.",
        ),
        p(
          "This license expressly includes the right to use your User Content, together with associated listing metadata and transaction outcomes, to develop, train, evaluate, and improve machine learning models, algorithms, and automated systems, including MDFLD's authenticity verification, counterfeit detection, fraud prevention, search, and recommendation technology. Where practical, we de-identify data used for these purposes.",
        ),
        p(
          "If you delete User Content or close your account, this license ends for future public display of that content, but it survives termination with respect to: (a) content and derived data already incorporated into trained models, aggregated datasets, or de-identified datasets; (b) content other users have re-shared or that appears in completed transaction records; and (c) copies we retain for backup, legal, or compliance purposes.",
        ),
        p(
          "You represent that you have all rights necessary to grant this license and that your User Content does not infringe the rights of any third party.",
        ),
      ],
    },
    {
      id: "trades-messaging",
      title: "7. Trades, Offers, and Messaging",
      blocks: [
        p(
          "The Services may allow you to message other users, negotiate offers, and propose trades or swaps. You are solely responsible for the trades you agree to. Describe traded items accurately and ship them as agreed.",
        ),
        p(
          "Keep transactions on MDFLD. Attempting to move payment or completion of a transaction off-platform to avoid fees or protections is prohibited. Do not use messaging to harass, spam, defraud, or solicit other users, or to share unlawful content.",
        ),
      ],
    },
    {
      id: "imports",
      title: "8. Importing Listings from Other Platforms",
      blocks: [
        p(
          "If you connect a third-party account such as Shopify or eBay to import listings, you represent that you are authorized to connect that account and to import the associated content. You authorize MDFLD to access, retrieve, and store the listing data, images, and tokens needed to provide the import feature. Your use of those platforms remains subject to their own terms.",
        ),
      ],
    },
    {
      id: "prohibited",
      title: "9. Prohibited Conduct",
      blocks: [
        p("You agree not to, and not to attempt to:"),
        list(
          "List, sell, or trade counterfeit, stolen, recalled, or unlawful items, or misrepresent an item's authenticity, condition, or origin.",
          "Engage in fraud of any kind, including payment fraud, chargeback abuse, review manipulation, shill bidding, or creating multiple or fake accounts.",
          "Access or use the Services with bots, scrapers, crawlers, or other automated means, or harvest data about users or listings, without our prior written permission.",
          "Circumvent, overload, or abuse rate limits, security controls, or fraud controls, or probe, scan, or test the vulnerability of our systems without authorization.",
          "Submit inputs designed to manipulate, deceive, poison, evade, or reverse engineer our automated verification, moderation, or fraud detection systems, including adversarial images or crafted text intended to alter automated decisions.",
          "Interfere with the proper working of the Services, introduce malware, or attempt to access accounts, data, or systems you are not authorized to access.",
          "Use the Services to violate any law, infringe intellectual property, or violate the privacy or publicity rights of others.",
          "Copy, resell, frame, or mirror any part of the Services, or use MDFLD data to build a competing dataset or service.",
        ),
        p(
          "We may investigate violations and take any action we deem appropriate, including removing content, limiting features, applying rate limits, withholding funds connected to fraud, suspending or terminating accounts, and reporting to law enforcement.",
        ),
      ],
    },
    {
      id: "fees",
      title: "10. Fees and Payments",
      blocks: [
        p(
          "Creating an account and browsing MDFLD is free. We charge sellers a commission on completed sales and may charge other fees such as payment processing or optional service fees. All applicable fees are disclosed before they apply, and we will give notice of fee changes before they take effect for future transactions.",
        ),
        p(
          "You are responsible for any taxes arising from your own sales or purchases except for taxes that MDFLD is required to collect and remit as a marketplace facilitator.",
        ),
      ],
    },
    {
      id: "ip",
      title: "11. Intellectual Property",
      blocks: [
        p(
          "The Services, including the MDFLD name, logo, design, software, and all content we create, are owned by MDFLD or its licensors and are protected by intellectual property laws. Except for the limited right to use the Services as intended, no rights are granted to you.",
        ),
        p(
          "Team names, club crests, league marks, and player names that appear in listings belong to their respective owners. Their appearance on MDFLD does not imply affiliation with or endorsement by those owners.",
        ),
        p(
          "If you believe content on MDFLD infringes your intellectual property, contact support@mdfld.co with sufficient detail for us to evaluate the claim. We will remove infringing content where appropriate and may terminate repeat infringers.",
        ),
      ],
    },
    {
      id: "third-party",
      title: "12. Third-Party Services",
      blocks: [
        p(
          "The Services rely on third-party providers, including Stripe and PayPal for payments and payouts, EasyPost and shipping carriers for labels and delivery, AfterShip for tracking, UploadThing for image hosting, Resend for email, and Google for optional sign-in. Your use of those services may be subject to their own terms and privacy policies. We are not responsible for third-party services we do not control.",
        ),
      ],
    },
    {
      id: "disclaimers",
      title: "13. Disclaimers",
      blocks: [
        p(
          "THE SERVICES ARE PROVIDED \"AS IS\" AND \"AS AVAILABLE\" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, THAT LISTINGS ARE ACCURATE, OR THAT ANY ITEM IS AUTHENTIC, NOTWITHSTANDING ANY VERIFICATION BADGE.",
        ),
        p(
          "Some jurisdictions do not allow the exclusion of certain warranties, so some of the above exclusions may not apply to you.",
        ),
      ],
    },
    {
      id: "liability",
      title: "14. Limitation of Liability",
      blocks: [
        p(
          "TO THE MAXIMUM EXTENT PERMITTED BY LAW, MDFLD AND ITS OFFICERS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, REVENUE, DATA, OR GOODWILL, ARISING FROM OR RELATED TO YOUR USE OF THE SERVICES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.",
        ),
        p(
          "TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICES WILL NOT EXCEED THE GREATER OF (A) THE FEES YOU PAID TO MDFLD IN THE TWELVE MONTHS BEFORE THE CLAIM AROSE, OR (B) ONE HUNDRED US DOLLARS ($100).",
        ),
      ],
    },
    {
      id: "indemnification",
      title: "15. Indemnification",
      blocks: [
        p(
          "You agree to defend, indemnify, and hold harmless MDFLD from and against any claims, damages, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from your User Content, your listings and sales, your use of the Services, or your violation of these Terms or of any law or third-party right.",
        ),
      ],
    },
    {
      id: "governing-law",
      title: "16. Governing Law and Disputes",
      blocks: [
        p(
          "These Terms are governed by the laws of the State of Georgia, USA, without regard to conflict of law principles. Before filing a claim, you agree to contact us at support@mdfld.co and attempt in good faith to resolve the dispute informally for at least 30 days.",
        ),
        p(
          "Any dispute that cannot be resolved informally will be brought exclusively in the state or federal courts located in Georgia, and you consent to their jurisdiction, except that either party may bring qualifying claims in small claims court or seek injunctive relief for intellectual property misuse in any court of competent jurisdiction. TO THE EXTENT PERMITTED BY LAW, YOU AND MDFLD EACH WAIVE THE RIGHT TO A JURY TRIAL AND TO PARTICIPATE IN A CLASS ACTION.",
        ),
      ],
    },
    {
      id: "termination",
      title: "17. Suspension and Termination",
      blocks: [
        p(
          "You may close your account at any time from your account settings or by contacting support@mdfld.co. We may suspend or terminate your access to the Services at any time, with or without notice, if we reasonably believe you have violated these Terms, created risk or legal exposure for MDFLD or other users, or as required by law.",
        ),
        p(
          "Sections that by their nature should survive termination will survive, including Sections 6 (license), 13 through 16, and any payment obligations accrued before termination.",
        ),
      ],
    },
    {
      id: "changes",
      title: "18. Changes to These Terms",
      blocks: [
        p(
          "We may update these Terms from time to time. If we make material changes, we will notify you by email or through the Services before the changes take effect. Your continued use of the Services after the effective date of updated Terms constitutes acceptance. If you do not agree to the updated Terms, stop using the Services and close your account.",
        ),
      ],
    },
    {
      id: "contact",
      title: "19. Contact",
      blocks: [
        p(
          "Questions about these Terms can be sent to support@mdfld.co. MDFLD LLC, Atlanta, Georgia, USA.",
        ),
      ],
    },
  ],
};

export const PRIVACY_POLICY: LegalDoc = {
  slug: "privacy",
  title: "Privacy Policy",
  effectiveDate: "July 9, 2026",
  intro:
    "This Privacy Policy explains how MDFLD LLC (\"MDFLD\", \"we\", \"us\", or \"our\") collects, uses, shares, and protects information about you when you use the MDFLD website, applications, and services (the \"Services\"). By using the Services, you agree to the practices described here.",
  sections: [
    {
      id: "information-we-collect",
      title: "1. Information We Collect",
      blocks: [
        p("Information you provide to us:"),
        list(
          "Account information: name, email address, username, password (stored as a salted hash, never in plain text), and optional profile details such as your photo, banner, bio, website, and location.",
          "Identity and verification information: phone number, date of birth, address, and, for sellers, business details such as store name, business email and phone, and tax identification number, collected to meet know-your-customer (KYC), tax, and anti-fraud obligations.",
          "Payout information: your PayPal email or bank account details. Bank details are collected and stored by Stripe; we retain only limited references such as the last four digits.",
          "Listings and content: product photos, titles, descriptions, condition details, size charts, reviews, and any other content you upload.",
          "Messages: conversations with other users and trade offers. Message content is encrypted at rest on our servers.",
          "Transaction information: items bought and sold, order details, shipping addresses, prices, and payment status. Card numbers are processed and stored by Stripe, not by MDFLD.",
          "Imported data: if you connect a Shopify or eBay account, the listing data, images, and access tokens needed to run the import.",
          "Communications: messages you send to support and your responses to surveys or promotions.",
        ),
        p("Information we collect automatically:"),
        list(
          "Usage and device data: IP address, browser and device type, pages viewed, actions taken, and timestamps, collected through server logs.",
          "Cookies and similar technologies: session cookies required to keep you signed in and to secure the Services. See Section 5.",
          "Trust and risk signals: activity patterns we compute to detect fraud, such as trust scores, risk scores, chargeback and return rates, and audit logs of significant account actions.",
        ),
      ],
    },
    {
      id: "how-we-use",
      title: "2. How We Use Your Information",
      blocks: [
        p("We use the information we collect to:"),
        list(
          "Provide and operate the Services, including creating your account, displaying your listings and profile, processing orders and payouts, generating shipping labels, and enabling messaging and trades.",
          "Verify identities, screen for fraud, enforce our Terms of Service, and keep the marketplace safe, including computing trust and risk scores and maintaining audit logs.",
          "Assess the authenticity of listed items through manual review and automated analysis.",
          "Send transactional communications such as order confirmations, shipping updates, security alerts, and account notices, and, with your consent where required, marketing communications you can opt out of at any time.",
          "Understand how the Services are used so we can improve them, develop new features, and fix problems.",
          "Comply with legal obligations, including tax reporting, sanctions screening, and responding to lawful requests.",
        ),
      ],
    },
    {
      id: "model-training",
      title: "3. Machine Learning and Model Training",
      blocks: [
        p(
          "MDFLD builds machine learning technology to detect counterfeit items and fraudulent activity. We use product photographs, listing titles, descriptions, and metadata, verification outcomes, and fraud signals collected on the platform to develop, train, evaluate, and improve these models, as well as models that power search, recommendations, and marketplace safety.",
        ),
        p(
          "Where practical, we de-identify or aggregate data before using it for training, and we design our training pipelines so that trained models do not expose your personal information. We do not use the content of your private messages to train models used for any purpose other than the safety and security of the Services.",
        ),
        p(
          "Data that has been incorporated into trained models or de-identified datasets may be retained after you delete content or close your account, as described in Section 7. The license you grant us to use uploaded content for these purposes is described in Section 6 of our Terms of Service.",
        ),
      ],
    },
    {
      id: "how-we-share",
      title: "4. How We Share Information",
      blocks: [
        p("We do not sell your personal information. We share information only as described below:"),
        list(
          "With other users: your username, profile, listings, reviews, and follower activity are visible to others. When a sale or trade completes, we share the information needed to fulfill it, such as a shipping address with the seller or shipping provider.",
          "Payment providers: Stripe processes payments and seller onboarding (including KYC), and PayPal processes payouts you direct to PayPal.",
          "Shipping providers: EasyPost and the carriers it connects receive names and addresses to generate labels and deliver packages; AfterShip receives tracking numbers to provide tracking updates.",
          "Infrastructure providers: UploadThing hosts uploaded images, Resend delivers our transactional emails, and our servers and databases are hosted on cloud infrastructure providers.",
          "Sign-in providers: if you choose to sign in with Google, Google shares your name, email, and profile photo with us, and knows you use MDFLD.",
          "Connected platforms: if you connect Shopify or eBay for imports, those platforms know about the connection and we exchange the data needed to import your listings.",
          "Legal and safety: we may disclose information to comply with law, enforce our Terms, protect the rights, property, or safety of MDFLD, our users, or the public, or in connection with fraud investigations.",
          "Business transfers: if MDFLD is involved in a merger, acquisition, financing, or sale of assets, information may be transferred as part of that transaction, subject to this policy.",
        ),
      ],
    },
    {
      id: "cookies",
      title: "5. Cookies",
      blocks: [
        p(
          "We use cookies that are strictly necessary to operate the Services, primarily secure session cookies that keep you signed in and protect your account. These cannot be disabled without breaking sign-in. We do not currently use third-party advertising cookies. If we introduce analytics or advertising cookies in the future, we will update this policy and provide any consent controls required by law.",
        ),
      ],
    },
    {
      id: "security",
      title: "6. Security",
      blocks: [
        p(
          "We take security seriously and use technical and organizational measures appropriate to the risk, including encryption of data in transit (HTTPS), encryption of private message content at rest, passwords stored with a modern memory-hard hashing algorithm, optional two-factor authentication and passkeys, role-based access controls, audit logging of sensitive actions, and rate limiting on authentication and other sensitive endpoints.",
        ),
        p(
          "No method of transmission or storage is completely secure, so we cannot guarantee absolute security. If we learn of a breach affecting your personal information, we will notify you and the relevant authorities as required by law. Please use a strong, unique password and enable two-factor authentication.",
        ),
      ],
    },
    {
      id: "retention",
      title: "7. Data Retention",
      blocks: [
        p(
          "We retain personal information for as long as your account is active and as needed to provide the Services. After you close your account, we delete or de-identify personal information within a reasonable period, except that we retain:",
        ),
        list(
          "Transaction, tax, and payout records for as long as required by tax, accounting, and anti-money-laundering laws.",
          "Information needed to resolve disputes, enforce our agreements, prevent fraud, or comply with legal obligations, including relevant audit logs and fraud signals.",
          "De-identified or aggregated data, and data already incorporated into trained machine learning models, which no longer identifies you.",
        ),
      ],
    },
    {
      id: "your-rights",
      title: "8. Your Rights and Choices",
      blocks: [
        p("Depending on where you live, you may have rights to:"),
        list(
          "Access the personal information we hold about you and receive a copy in a portable format.",
          "Correct inaccurate information. Most account and profile information can be edited directly in your settings.",
          "Delete your personal information, subject to the retention exceptions in Section 7.",
          "Object to or restrict certain processing, and withdraw consent where processing is based on consent.",
          "Opt out of marketing emails using the unsubscribe link in any marketing message. Transactional emails, such as order confirmations and security notices, will still be sent.",
          "Complain to your local data protection authority if you believe we have processed your information unlawfully.",
        ),
        p(
          "To exercise any of these rights, email support@mdfld.co from the address associated with your account. We will verify your identity before acting on a request and respond within the time required by applicable law. We do not discriminate against you for exercising your rights.",
        ),
      ],
    },
    {
      id: "children",
      title: "9. Children",
      blocks: [
        p(
          "The Services are intended for users 18 and older. We do not knowingly collect personal information from anyone under 18, and we do not knowingly allow them to transact. If you believe a minor has provided us personal information, contact support@mdfld.co and we will delete it.",
        ),
      ],
    },
    {
      id: "international",
      title: "10. International Users",
      blocks: [
        p(
          "MDFLD is operated from the United States, and information we collect is processed and stored in the United States, where privacy laws may differ from those in your country. If you use the Services from outside the United States, you understand that your information will be transferred to and processed in the United States. Where required, we rely on appropriate safeguards for international transfers, such as standard contractual clauses.",
        ),
      ],
    },
    {
      id: "state-privacy",
      title: "11. Additional Disclosures for US State Privacy Laws",
      blocks: [
        p(
          "Residents of states with comprehensive privacy laws (such as California, Colorado, Connecticut, Texas, and Virginia) have the rights described in Section 8. For those laws: we collect the categories of information described in Section 1; we use them for the purposes in Sections 2 and 3; we disclose them to the service providers and recipients in Section 4; we do not sell personal information and do not share it for cross-context behavioral advertising; and we do not use or disclose sensitive personal information for purposes other than providing the Services and meeting legal obligations.",
        ),
      ],
    },
    {
      id: "changes",
      title: "12. Changes to This Policy",
      blocks: [
        p(
          "We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email or through the Services before the changes take effect, and we will update the effective date above. Your continued use of the Services after the effective date constitutes acceptance of the updated policy.",
        ),
      ],
    },
    {
      id: "contact",
      title: "13. Contact Us",
      blocks: [
        p(
          "If you have questions about this Privacy Policy or how we handle your information, email support@mdfld.co. MDFLD LLC, Atlanta, Georgia, USA.",
        ),
      ],
    },
  ],
};

export function getLegalDoc(slug: "terms" | "privacy"): LegalDoc {
  return slug === "terms" ? TERMS_OF_SERVICE : PRIVACY_POLICY;
}
