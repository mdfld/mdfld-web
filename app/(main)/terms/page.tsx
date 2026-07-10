import { LegalPage } from "@/components/legal/legal-page";
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "@/lib/legal-content";

export const metadata = {
  title: "Terms of Service | MDFLD",
  description:
    "The terms that govern buying, selling, and trading football gear on MDFLD.",
};

export default function TermsRoute() {
  return <LegalPage doc={TERMS_OF_SERVICE} otherDoc={PRIVACY_POLICY} />;
}
