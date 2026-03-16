export default function Attribution() {
  return (
    <footer className="w-full border-t-3 border-brutal-border bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-[10px] font-mono font-bold text-brutal-dim uppercase tracking-wider">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
        <a
          href="https://www.themoviedb.org"
          target="_blank"
          rel="noopener noreferrer"
          className="brutal-chip text-brutal-yellow border-brutal-yellow hover:bg-brutal-yellow hover:text-black transition-colors"
        >
          POWERED BY TMDB →
        </a>
      </div>
    </footer>
  );
}
