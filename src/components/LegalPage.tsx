import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

/** One titled section of a legal page. */
export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

interface LegalPageProps {
  title: string;
  intro: ReactNode;
  updated: string;
  sections: readonly LegalSection[];
  /** The sibling document, linked at the bottom. */
  related: { href: string; label: string };
}

/** Shared reading layout for the Privacy Policy and Terms of Service. */
export default function LegalPage({ title, intro, updated, sections, related }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[#020817] pb-24 pt-6 text-slate-100 lg:pb-16">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        <Link
          href="/"
          className="-ml-2 inline-flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-slate-400 transition-colors duration-150 hover:bg-white/[0.06] hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          CineBlock
        </Link>

        <header className="mt-8 border-b border-white/10 pb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-slate-500">Last updated {updated}</p>
          <div className="mt-6 text-[15px] leading-relaxed text-slate-300">{intro}</div>
        </header>

        <nav aria-label="On this page" className="mt-8">
          <ol className="grid gap-1 text-sm sm:grid-cols-2">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-slate-400 transition-colors duration-150 hover:bg-white/[0.06] hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
                >
                  <span className="w-5 text-right tabular-nums text-slate-600">{index + 1}</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-12">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-8">
              <h2 className="flex items-baseline gap-3 text-xl font-semibold text-white">
                <span className="text-sm tabular-nums text-[#60A5FA]">{index + 1}</span>
                {section.title}
              </h2>
              <div className="legal-body mt-4 space-y-4 text-[15px] leading-relaxed text-slate-300">{section.body}</div>
            </section>
          ))}
        </div>

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-slate-400">
          <span>CineBlock</span>
          <Link
            href={related.href}
            className="rounded-lg px-2 py-2 font-medium text-[#60A5FA] transition-colors duration-150 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
          >
            {related.label}
          </Link>
        </footer>
      </div>
    </main>
  );
}
