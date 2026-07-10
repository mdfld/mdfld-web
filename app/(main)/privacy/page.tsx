import { LegalPage } from "@/components/legal/legal-page";
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "@/lib/legal-content";

export const metadata = {
  title: "Privacy Policy | MDFLD",
  description:
    "How MDFLD collects, uses, and protects your information across the marketplace.",
};

export default function PrivacyRoute() {
  return <LegalPage doc={PRIVACY_POLICY} otherDoc={TERMS_OF_SERVICE} />;
}
