import { describe, it, expect } from "vitest";
import {
  TERMS_OF_SERVICE,
  PRIVACY_POLICY,
  getLegalDoc,
  type LegalDoc,
  type LegalBlock,
} from "@/lib/legal-content";

function allText(doc: LegalDoc): string {
  return doc.sections
    .map((s) =>
      [
        s.title,
        ...s.blocks.map((b: LegalBlock) =>
          b.kind === "p" ? b.text : b.items.join(" "),
        ),
      ].join(" "),
    )
    .join(" ");
}

describe.each([
  ["TERMS_OF_SERVICE", TERMS_OF_SERVICE],
  ["PRIVACY_POLICY", PRIVACY_POLICY],
] as const)("%s structure", (_name, doc) => {
  it("has a title, slug, and effective date", () => {
    expect(doc.title.length).toBeGreaterThan(0);
    expect(doc.slug.length).toBeGreaterThan(0);
    expect(doc.effectiveDate).toBe("July 9, 2026");
  });

  it("has at least 10 sections", () => {
    expect(doc.sections.length).toBeGreaterThanOrEqual(10);
  });

  it("section ids are unique", () => {
    const ids = doc.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every section has a title and at least one block", () => {
    for (const section of doc.sections) {
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.blocks.length).toBeGreaterThan(0);
    }
  });

  it("every block has non-empty content", () => {
    for (const section of doc.sections) {
      for (const block of section.blocks) {
        if (block.kind === "p") {
          expect(block.text.trim().length).toBeGreaterThan(0);
        } else {
          expect(block.items.length).toBeGreaterThan(0);
          for (const item of block.items) {
            expect(item.trim().length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("contains no em dashes", () => {
    expect(allText(doc)).not.toContain("—");
  });

  it("lists a contact email", () => {
    expect(allText(doc)).toContain("support@mdfld.co");
  });
});

describe("TERMS_OF_SERVICE content", () => {
  const text = allText(TERMS_OF_SERVICE);

  it("grants MDFLD a license to use uploaded content for machine learning training", () => {
    expect(text).toMatch(/machine learning/i);
    expect(text).toMatch(/train/i);
    expect(text).toMatch(/authenticity/i);
  });

  it("makes the training license survive account termination", () => {
    const licenseSection = TERMS_OF_SERVICE.sections.find(
      (s) => s.id === "user-content",
    );
    expect(licenseSection).toBeDefined();
    expect(allText({ ...TERMS_OF_SERVICE, sections: [licenseSection!] })).toMatch(
      /surviv/i,
    );
  });

  it("prohibits counterfeit items", () => {
    expect(text).toMatch(/counterfeit/i);
  });

  it("prohibits scraping and attempts to manipulate automated verification systems", () => {
    expect(text).toMatch(/scrap/i);
    expect(text).toMatch(/manipulate|circumvent|deceive/i);
  });

  it("specifies Georgia governing law", () => {
    expect(text).toMatch(/State of Georgia/);
  });

  it("appoints MDFLD as limited payment collection agent for sellers", () => {
    expect(text).toMatch(/collection agent/i);
  });
});

describe("PRIVACY_POLICY content", () => {
  const text = allText(PRIVACY_POLICY);

  it("discloses model training on listing images and metadata", () => {
    expect(text).toMatch(/machine learning/i);
    expect(text).toMatch(/train/i);
  });

  it("names the payment, shipping, upload, and email processors", () => {
    for (const processor of ["Stripe", "EasyPost", "UploadThing", "Resend"]) {
      expect(text).toContain(processor);
    }
  });

  it("covers cookies, retention, security, and user rights", () => {
    expect(text).toMatch(/cookie/i);
    expect(text).toMatch(/retain|retention/i);
    expect(text).toMatch(/encrypt/i);
    expect(text).toMatch(/delete/i);
  });

  it("addresses children and age requirements", () => {
    expect(text).toMatch(/18/);
  });
});

describe("getLegalDoc", () => {
  it("returns the terms doc for 'terms'", () => {
    expect(getLegalDoc("terms")).toBe(TERMS_OF_SERVICE);
  });

  it("returns the privacy doc for 'privacy'", () => {
    expect(getLegalDoc("privacy")).toBe(PRIVACY_POLICY);
  });
});
