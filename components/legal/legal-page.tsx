import Link from "next/link";
import type { LegalBlock, LegalDoc } from "@/lib/legal-content";

function Block({ block }: { block: LegalBlock }) {
  if (block.kind === "p") {
    return <p className="text-sm leading-relaxed text-default-600 mb-4">{block.text}</p>;
  }
  return (
    <ul className="list-disc pl-5 mb-4 space-y-2">
      {block.items.map((item, idx) => (
        <li key={idx} className="text-sm leading-relaxed text-default-600">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function LegalPage({ doc, otherDoc }: { doc: LegalDoc; otherDoc: LegalDoc }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
          Legal
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">{doc.title}</h1>
        <p className="text-sm text-default-400 mb-6">Effective date: {doc.effectiveDate}</p>
        <p className="text-sm leading-relaxed text-default-600 max-w-3xl">{doc.intro}</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-10">
        <nav className="lg:w-64 shrink-0" aria-label="Table of contents">
          <div className="lg:sticky lg:top-24 rounded-xl border border-divider bg-content1 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-default-400 mb-3">
              On this page
            </p>
            <ul className="space-y-2">
              {doc.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-sm text-default-500 hover:text-primary transition-colors"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-divider">
              <Link href={`/${otherDoc.slug}`} className="text-sm text-primary hover:underline">
                {otherDoc.title}
              </Link>
            </div>
          </div>
        </nav>

        <article className="min-w-0 flex-1 max-w-3xl">
          {doc.sections.map((section) => (
            <section key={section.id} id={section.id} className="mb-10 scroll-mt-24">
              <h2 className="text-lg sm:text-xl font-semibold mb-3">{section.title}</h2>
              {section.blocks.map((block, idx) => (
                <Block key={idx} block={block} />
              ))}
            </section>
          ))}
          <p className="text-sm text-default-400 border-t border-divider pt-6">
            Questions? Contact us at{" "}
            <a href="mailto:support@mdfld.co" className="text-primary hover:underline">
              support@mdfld.co
            </a>
            .
          </p>
        </article>
      </div>
    </div>
  );
}
