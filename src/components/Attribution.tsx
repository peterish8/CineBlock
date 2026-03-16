export default function Attribution() {
  return (
    <footer className="w-full border-t border-brutal-border bg-surface">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <p className="text-[9px] font-mono text-brutal-dim uppercase tracking-wider">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
        <a
          href="https://www.themoviedb.org"
          target="_blank"
          rel="noopener noreferrer"
          className="brutal-chip text-brutal-yellow border-brutal-yellow hover:bg-brutal-yellow hover:text-black transition-colors shrink-0 text-[9px]"
        >
          POWERED BY TMDB →
        </a>
      </div>
    </footer>
  );
}
