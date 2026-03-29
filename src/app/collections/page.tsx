"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Info, Box, ExternalLink, Trophy, Filter, ChevronLeft } from "lucide-react";
import CollectionCard from "@/components/CollectionCard";
import CollectionModal from "@/components/CollectionModal";
import MovieModal from "@/components/MovieModal";
import { TMDBMovie, TMDBCollection } from "@/lib/types";
import { useMovieLists } from "@/hooks/useMovieLists";

// Curated top-tier franchises for the landing page (Dynamics handles collage)
const CURATED_COLLECTIONS: (Partial<TMDBCollection> & { id: number; name: string; movieCount?: number; themeColor?: string })[] = [
  // ── Superheroes ──────────────────────────────────────────────────────────────
  { id: 9999999, name: "Marvel Cinematic Universe", movieCount: 35, themeColor: "#5c0a0a" },
  { id: 9999998, name: "Spider-Man Collection", movieCount: 10, themeColor: "#2d0505" },
  { id: 263, name: "The Dark Knight Trilogy", themeColor: "#000510" },
  { id: 748, name: "X-Men Collection", themeColor: "#000b2d" },
  { id: 115, name: "Superman Collection", themeColor: "#0a1a3b" },
  { id: 468552, name: "Wonder Woman Collection", themeColor: "#3b0a0a" },
  { id: 573693, name: "Aquaman Collection", themeColor: "#001a3b" },
  { id: 736244, name: "Shazam! Collection", themeColor: "#1a001a" },
  { id: 131295, name: "Captain America Collection", themeColor: "#000a2d" },
  { id: 131292, name: "Iron Man Collection", themeColor: "#2d0a00" },
  { id: 131298, name: "Thor Collection", themeColor: "#0a0a2d" },
  { id: 284433, name: "Guardians of the Galaxy Collection", themeColor: "#1a0a2d" },
  { id: 422834, name: "Ant-Man Collection", themeColor: "#1a1a00" },
  { id: 529892, name: "Black Panther Collection", themeColor: "#0a1a1a" },
  { id: 448150, name: "Deadpool Collection", themeColor: "#2d0000" },
  { id: 2669, name: "Batman Collection", themeColor: "#050505" },
  { id: 391860, name: "Kingsman Collection", themeColor: "#0a0a1a" },

  // ── Sci-Fi & Space ───────────────────────────────────────────────────────────
  { id: 10, name: "Star Wars Collection", themeColor: "#000b1e" },
  { id: 87096, name: "Avatar Collection", themeColor: "#001a2d" },
  { id: 111818, name: "Star Trek Kelvin Collection", themeColor: "#001a3b" },
  { id: 2344, name: "The Matrix Collection", themeColor: "#001a00" },
  { id: 728879, name: "Dune Collection", themeColor: "#2d1a00" },
  { id: 8091, name: "Alien Collection", themeColor: "#0a0f0a" },
  { id: 106, name: "Predator Collection", themeColor: "#0a1a0a" },
  { id: 117251, name: "Alien vs. Predator Collection", themeColor: "#0f0a0f" },
  { id: 8945, name: "Mad Max Collection", themeColor: "#2d1500" },
  { id: 528, name: "Terminator Collection", themeColor: "#111111" },
  { id: 264, name: "Back to the Future Collection", themeColor: "#001a2d" },
  { id: 531330, name: "MonsterVerse Collection", themeColor: "#1a0f0a" },

  // ── Fantasy & Adventure ──────────────────────────────────────────────────────
  { id: 119, name: "The Lord of the Rings Collection", themeColor: "#1c2a1c" },
  { id: 119566, name: "The Hobbit Collection", themeColor: "#1a1a00" },
  { id: 1241, name: "Harry Potter Collection", themeColor: "#1a1a2e" },
  { id: 435259, name: "Fantastic Beasts Collection", themeColor: "#2a1a0a" },
  { id: 84, name: "Indiana Jones Collection", themeColor: "#2d1a0a" },
  { id: 420, name: "The Chronicles of Narnia Collection", themeColor: "#2d2000" },
  { id: 645, name: "James Bond Collection", themeColor: "#0a0a0a" },
  { id: 295, name: "Pirates of the Caribbean Collection", themeColor: "#001a1a" },
  { id: 87359, name: "Mission: Impossible Collection", themeColor: "#1a1a1a" },
  { id: 31562, name: "Bourne Collection", themeColor: "#0a0a0a" },
  { id: 40339, name: "Sherlock Holmes Collection", themeColor: "#1a150a" },
  { id: 22559, name: "Percy Jackson Collection", themeColor: "#001a2d" },

  // ── Action & Thriller ────────────────────────────────────────────────────────
  { id: 9485, name: "The Fast and the Furious Collection", themeColor: "#1c1c1c" },
  { id: 404609, name: "John Wick Collection", themeColor: "#050505" },
  { id: 1570, name: "Die Hard Collection", themeColor: "#1a0a0a" },
  { id: 1575, name: "Rocky Collection", themeColor: "#2d0a0a" },
  { id: 5039, name: "Rambo Collection", themeColor: "#2d0a00" },
  { id: 7551, name: "Lethal Weapon Collection", themeColor: "#1a0a00" },
  { id: 126125, name: "The Expendables Collection", themeColor: "#1a1000" },
  { id: 495371, name: "Creed Collection", themeColor: "#2d0a0a" },
  { id: 509865, name: "Taken Collection", themeColor: "#1a1a0a" },
  { id: 577302, name: "The Equalizer Collection", themeColor: "#0a0a0a" },
  { id: 304528, name: "Ocean's Collection", themeColor: "#0a0a1a" },
  { id: 282118, name: "Now You See Me Collection", themeColor: "#1a0a2d" },
  { id: 131836, name: "National Treasure Collection", themeColor: "#2d1a00" },
  { id: 390326, name: "Ip Man Collection", themeColor: "#0a0a0a" },

  // ── Horror ────────────────────────────────────────────────────────────────────
  { id: 504068, name: "The Conjuring Universe", themeColor: "#0a0a0a" },
  { id: 290298, name: "Insidious Collection", themeColor: "#0a0a0a" },
  { id: 282507, name: "The Purge Collection", themeColor: "#1a0000" },
  { id: 97084, name: "Paranormal Activity Collection", themeColor: "#050505" },
  { id: 91361, name: "Halloween Collection", themeColor: "#2d1300" },
  { id: 4246, name: "Scream Collection", themeColor: "#0a0a0a" },
  { id: 6468, name: "A Nightmare on Elm Street Collection", themeColor: "#1a0500" },
  { id: 9735, name: "Friday the 13th Collection", themeColor: "#0a0a00" },
  { id: 656, name: "Saw Collection", themeColor: "#1a1300" },
  { id: 8957, name: "Final Destination Collection", themeColor: "#0a0a0a" },
  { id: 10158, name: "Child's Play Collection", themeColor: "#2d0000" },
  { id: 17255, name: "Resident Evil Collection", themeColor: "#0a0a00" },
  { id: 2326, name: "Underworld Collection", themeColor: "#000a1a" },
  { id: 398816, name: "Evil Dead Collection", themeColor: "#1a0a00" },

  // ── Dinosaurs, Monsters & Action-Adventure ────────────────────────────────────
  { id: 328, name: "Jurassic Park Collection", themeColor: "#0a2d0a" },
  { id: 173710, name: "Planet of the Apes Collection", themeColor: "#0f1a0f" },
  { id: 1733, name: "The Mummy Collection", themeColor: "#2d1a00" },
  { id: 8650, name: "Transformers Collection", themeColor: "#0a0a2d" },
  { id: 433256, name: "Jumanji Collection", themeColor: "#0a1a0a" },

  // ── Animation ─────────────────────────────────────────────────────────────────
  { id: 10194, name: "Toy Story Collection", themeColor: "#001a3b" },
  { id: 86066, name: "Despicable Me Collection", themeColor: "#131a26" },
  { id: 2150, name: "Shrek Collection", themeColor: "#111a00" },
  { id: 8354, name: "Ice Age Collection", themeColor: "#0a1a2d" },
  { id: 77816, name: "Kung Fu Panda Collection", themeColor: "#2d2600" },
  { id: 14740, name: "Madagascar Collection", themeColor: "#2d260a" },
  { id: 89137, name: "How to Train Your Dragon Collection", themeColor: "#0a132d" },
  { id: 386382, name: "Frozen Collection", themeColor: "#0a1a3b" },
  { id: 15302, name: "The Lion King Collection", themeColor: "#2d1e00" },
  { id: 255535, name: "Finding Nemo Collection", themeColor: "#001a2d" },
  { id: 468222, name: "The Incredibles Collection", themeColor: "#2d0a0a" },
  { id: 87118, name: "Cars Collection", themeColor: "#2d0a0a" },
  { id: 137696, name: "Monsters, Inc. Collection", themeColor: "#0a0a2d" },
  { id: 717080, name: "Inside Out Collection", themeColor: "#0a1a2d" },
  { id: 404368, name: "Ralph Breaks the Internet Collection", themeColor: "#0a001a" },
  { id: 174614, name: "Hotel Transylvania Collection", themeColor: "#0a0a1a" },
  { id: 621023, name: "The Croods Collection", themeColor: "#2d1a00" },
  { id: 134095, name: "Rio Collection", themeColor: "#001a00" },
  { id: 357376, name: "The Angry Birds Collection", themeColor: "#2d0a00" },
  { id: 385055, name: "The Boss Baby Collection", themeColor: "#001a2d" },
  { id: 444697, name: "Trolls Collection", themeColor: "#2d002d" },

  // ── Drama & Young Adult ───────────────────────────────────────────────────────
  { id: 131635, name: "The Hunger Games Collection", themeColor: "#2d1300" },
  { id: 33514, name: "The Twilight Saga", themeColor: "#0a1a1a" },
  { id: 283579, name: "Divergent Collection", themeColor: "#1a1a2d" },
  { id: 295130, name: "Maze Runner Collection", themeColor: "#1a0a0a" },

  // ── Comedy ────────────────────────────────────────────────────────────────────
  { id: 2980, name: "Ghostbusters Collection", themeColor: "#0a1a0a" },
  { id: 86055, name: "Men in Black Collection", themeColor: "#0a0a13" },
  { id: 86029, name: "The Hangover Collection", themeColor: "#2d1500" },
  { id: 11619, name: "Austin Powers Collection", themeColor: "#1a2d00" },
  { id: 2806, name: "American Pie Collection", themeColor: "#2d1a00" },
  { id: 174349, name: "Scary Movie Collection", themeColor: "#0a1a00" },
  { id: 289108, name: "Pitch Perfect Collection", themeColor: "#001a2d" },
  { id: 255459, name: "Ted Collection", themeColor: "#1a1a00" },
  { id: 223025, name: "Jump Street Collection", themeColor: "#001a1a" },
  { id: 85943, name: "Night at the Museum Collection", themeColor: "#0a0a1a" },

  // ── Family ────────────────────────────────────────────────────────────────────
  { id: 430544, name: "Paddington Collection", themeColor: "#2d1a00" },
  { id: 256322, name: "The Muppets Collection", themeColor: "#2d1a2d" },
];



export default function CollectionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  
  const { watched } = useMovieLists();

  // Handle Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/movies?action=search-collection&query=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Curated collections with real progress
  const curatedWithProgress = useMemo(() => {
      return CURATED_COLLECTIONS.map(c => {
          // Note: In a real app we'd fetch the parts to get accurate IDs, 
          // but for curated ones we can approximate or use a simple heuristic 
          // (or just rely on the Detail Modal to show the real bar while keeping the preview clean)
          return {
              ...c,
              progress: { watched: 0, total: c.movieCount || 1 }
          };
      });
  }, []);

  return (
    <main className="min-h-screen bg-bg text-brutal-white flex flex-col pt-24 pb-16 lg:pb-0">
      {/* Background patterns */}
      {/* 4. The Back Button UI */}
      <div className="fixed top-6 left-6 z-50">
        <button 
          onClick={() => router.back()}
          className="brutal-btn flex items-center gap-2 px-4 py-2 bg-bg hover:!bg-brutal-violet hover:!text-black transition-all active:translate-y-1 active:shadow-none"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-mono font-black text-sm uppercase">Back</span>
        </button>
      </div>
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0 overflow-hidden hidden sm:block">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] border-[50px] border-brutal-border rounded-full -mr-24 -mt-24" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[radial-gradient(circle,var(--brutal-violet)_0%,transparent_70%)] opacity-30" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 max-w-[1400px] mx-auto w-full px-6 py-12 flex flex-col items-center text-center gap-6">
        <div className="flex flex-col items-center gap-2">
            <div className="brutal-chip bg-brutal-violet text-black px-4 py-1 text-xs font-black uppercase tracking-[0.3em] shadow-brutal-sm">
                COLLECTOR MODE
            </div>
            <h1 className="text-4xl sm:text-7xl font-display font-black uppercase leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
                FRANCHISE <span className="text-brutal-violet">VAULT</span>
            </h1>
            <p className="max-w-xl text-brutal-muted text-sm sm:text-lg font-mono font-bold mt-4 uppercase leading-relaxed">
                Track your progress through history's greatest cinematic empires. Complete the sagas. Earn your badges.
            </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl mt-8">
            <div className="relative group">
                <div className="absolute inset-0 bg-brutal-violet translate-x-2 translate-y-2 group-focus-within:translate-x-3 group-focus-within:translate-y-3 transition-transform duration-200" />
                <div className="relative flex items-center bg-bg border-4 border-brutal-border p-1">
                    <Search className="w-6 h-6 ml-4 text-brutal-dim" />
                    <input 
                        type="text"
                        placeholder="SEARCH FOR A FRANCHISE (E.G. 'AVENGERS' OR 'BOND')..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent px-4 py-3 outline-none font-mono font-black text-xs sm:text-sm uppercase placeholder:text-brutal-dim/50"
                    />
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="brutal-btn bg-brutal-violet text-black border-none px-6 py-3 font-mono font-black text-sm hover:scale-105 active:scale-95 transition-all"
                    >
                        {isLoading ? "LOADING..." : "FETCH"}
                    </button>
                </div>
            </div>
        </form>
      </section>

      {/* Main Content Area */}
      <section className="relative z-10 max-w-[1400px] mx-auto w-full px-6 py-16 flex flex-col gap-12">
        
        {searchResults.length > 0 ? (
          <div>
            <div className="flex items-center gap-4 mb-8">
                <Box className="w-6 h-6 text-brutal-cyan" />
                <h2 className="text-xl font-display font-black uppercase tracking-widest">SEARCH RESULTS</h2>
                <button onClick={() => setSearchResults([])} className="ml-auto text-xs font-mono font-bold text-brutal-dim hover:text-white uppercase">CLEAR RESULTS</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
              {searchResults.map((collection) => (
                <CollectionCard 
                    key={collection.id} 
                    collection={collection} 
                    onClick={() => setSelectedCollectionId(collection.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Curated Section */}
            <div>
                <div className="flex items-center gap-4 mb-8">
                    <Trophy className="w-6 h-6 text-brutal-yellow animate-pulse" />
                    <h2 className="text-xl font-display font-black uppercase tracking-widest">LEGENDARY FRANCHISES</h2>
                    <div className="h-[2px] flex-1 bg-brutal-border" />
                    <div className="brutal-chip border-brutal-border text-xs px-2 py-1">{CURATED_COLLECTIONS.length} FRANCHISES</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10">
                {CURATED_COLLECTIONS.map((c) => (
                    <CollectionCard 
                        key={c.id} 
                        collection={c as any} 
                        onClick={() => setSelectedCollectionId(c.id)}
                    />
                ))}
                </div>
            </div>

            {/* How it works info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 py-12 border-t-3 border-brutal-border border-dashed">
                <div className="flex flex-col gap-4 p-6 bg-surface-2 border-3 border-brutal-border shadow-brutal">
                    <div className="w-12 h-12 flex items-center justify-center bg-brutal-cyan text-black border-2 border-black font-black">01</div>
                    <h3 className="font-display font-black uppercase text-lg">OPEN THE VAULT</h3>
                    <p className="text-xs font-mono text-brutal-muted leading-relaxed uppercase font-bold">Search and find any movie series. We index thousands of franchises from MCU to cult classics.</p>
                </div>
                <div className="flex flex-col gap-4 p-6 bg-surface-2 border-3 border-brutal-border shadow-brutal">
                    <div className="w-12 h-12 flex items-center justify-center bg-brutal-violet text-black border-2 border-black font-black">02</div>
                    <h3 className="font-display font-black uppercase text-lg">TRACK PROGRESS</h3>
                    <p className="text-xs font-mono text-brutal-muted leading-relaxed uppercase font-bold">Mark movies as watched. Our tracker automatically updates your franchise completion bars.</p>
                </div>
                <div className="flex flex-col gap-4 p-6 bg-surface-2 border-3 border-brutal-border shadow-brutal">
                    <div className="w-12 h-12 flex items-center justify-center bg-brutal-yellow text-black border-2 border-black font-black">03</div>
                    <h3 className="font-display font-black uppercase text-lg">BE A CINEPHILE</h3>
                    <p className="text-xs font-mono text-brutal-muted leading-relaxed uppercase font-bold">Close the gaps in your knowledge. The franchise vault is for those who finish what they start.</p>
                </div>
            </div>
          </>
        )}
      </section>

      {/* Footer Branding */}
      <footer className="mt-auto px-6 py-12 border-t-4 border-brutal-border bg-black/40 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 font-display font-black italic text-2xl uppercase tracking-tighter">
              CINEBLOCK <span className="text-brutal-violet">COLLECTIONS</span>
          </div>
          <div className="text-[10px] font-mono text-brutal-dim tracking-[0.5em] uppercase">Built for Completionists</div>
      </footer>

      {/* Popups */}
      <div className={selectedMovie ? "hidden" : ""}>
        <CollectionModal 
          collectionId={selectedCollectionId}
          onClose={() => setSelectedCollectionId(null)}
          onMovieClick={setSelectedMovie}
        />
      </div>

      <MovieModal 
        movie={selectedMovie}
        onBack={() => setSelectedMovie(null)}
        onClose={() => { setSelectedMovie(null); setSelectedCollectionId(null); }}
      />
    </main>
  );
}
