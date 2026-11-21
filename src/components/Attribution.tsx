import Link from "next/link";

const FOOTER_LINK =
  "inline-flex min-h-10 items-center rounded-lg px-2 text-slate-400 transition-colors duration-150 hover:bg-white/[0.06] hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]";

/** Site footer: legal links and the TMDB credit TMDB's terms require. */
export default function Attribution() {
  return (
    <footer className="w-full border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Legal" className="-ml-2 flex flex-wrap items-center gap-1">
          <span className="px-2 font-medium text-slate-300">CineBlock</span>
          <Link href="/privacy" className={FOOTER_LINK}>
            Privacy
          </Link>
          <Link href="/terms" className={FOOTER_LINK}>
            Terms
          </Link>
        </nav>
        <p className="leading-relaxed text-slate-500">
          This product uses the TMDB API but is not endorsed or certified by{" "}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline"
          >
            TMDB
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
