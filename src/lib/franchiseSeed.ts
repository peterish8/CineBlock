/**
 * Franchise Vault SEED — used exactly once, to fill an empty `franchises` table in
 * Convex (see `seedIfEmpty` in convex/franchises.ts). After that the database is the
 * source of truth: the weekly discovery cron adds new franchises, the sync cron
 * health-checks and self-heals them, and nothing here is read at runtime.
 *
 * Pure data with relative imports only, so the Convex bundler can include it.
 */
import type { FranchiseSource } from "./franchiseBuilder";

export type FranchiseBadgeTone =
  | "red" | "blue" | "cyan" | "orange" | "yellow" | "slate" | "pink" | "green" | "amber" | "teal";

interface SeedEntry {
  id: number;
  name: string;
  themeColor?: string;
  badge?: { label: string; tone: FranchiseBadgeTone };
}

export interface FranchiseSeedRow {
  key: number;
  name: string;
  overview?: string;
  source: FranchiseSource;
  featuredMovieId?: number;
  themeColor?: string;
  badge?: { label?: string; tone?: string };
  rank: number;
}

/** Keys of the two rule-built franchises (not TMDB collection ids). */
export const MCU_FRANCHISE_ID = 9999999;
export const SPIDER_MAN_FRANCHISE_ID = 9999998;

// Seed order = curated display order and badge priority.
const SEED_ENTRIES: SeedEntry[] = [

  // ── Marvel ───────────────────────────────────────────────────────────────────
  { id: 9999999, name: "Marvel Cinematic Universe", themeColor: "#5c0a0a", badge: { label: "MCU", tone: "red" } },
  { id: 9999998, name: "Spider-Man Collection", themeColor: "#2d0505", badge: { label: "SPIDEY", tone: "pink" } },
  { id: 131292, name: "Iron Man Collection", themeColor: "#2d0a00" },
  { id: 131295, name: "Captain America Collection", themeColor: "#000a2d" },
  { id: 131298, name: "Thor Collection", themeColor: "#0a0a2d" },
  { id: 284433, name: "Guardians of the Galaxy Collection", themeColor: "#1a0a2d" },
  { id: 422834, name: "Ant-Man Collection", themeColor: "#1a1a00" },
  { id: 529892, name: "Black Panther Collection", themeColor: "#0a1a1a" },
  { id: 448150, name: "Deadpool Collection", themeColor: "#2d0000" },
  { id: 86311, name: "Avengers Collection", themeColor: "#1a000a" },
  { id: 618529, name: "Doctor Strange Collection", themeColor: "#1a002d" },
  { id: 391860, name: "Kingsman Collection", themeColor: "#0a0a1a" },

  // ── DC ────────────────────────────────────────────────────────────────────────
  { id: 263, name: "The Dark Knight Trilogy", themeColor: "#000510" },
  { id: 2669, name: "Batman Collection", themeColor: "#050505", badge: { label: "BATMAN", tone: "slate" } },
  { id: 748, name: "X-Men Collection", themeColor: "#000b2d", badge: { label: "X-MEN", tone: "blue" } },
  { id: 115, name: "Superman Collection", themeColor: "#0a1a3b", badge: { label: "SUPERMAN", tone: "blue" } },
  { id: 468552, name: "Wonder Woman Collection", themeColor: "#3b0a0a" },
  { id: 573693, name: "Aquaman Collection", themeColor: "#001a3b" },
  { id: 736244, name: "Shazam! Collection", themeColor: "#1a001a" },
  { id: 531242, name: "Suicide Squad Collection", themeColor: "#0a1a0a" },

  // ── Star Wars & Space ─────────────────────────────────────────────────────────
  { id: 10, name: "Star Wars Collection", themeColor: "#000b1e", badge: { label: "STAR WARS", tone: "yellow" } },
  { id: 87096, name: "Avatar Collection", themeColor: "#001a2d", badge: { label: "AVATAR", tone: "cyan" } },
  { id: 111818, name: "Star Trek Kelvin Collection", themeColor: "#001a3b" },
  { id: 726871, name: "Dune Collection", themeColor: "#2d1a00", badge: { label: "DUNE", tone: "amber" } },
  { id: 2344, name: "The Matrix Collection", themeColor: "#001a00" },
  { id: 8091, name: "Alien Collection", themeColor: "#0a0f0a" },
  { id: 106, name: "Predator Collection", themeColor: "#0a1a0a" },
  { id: 117251, name: "Alien vs. Predator Collection", themeColor: "#0f0a0f" },
  { id: 8945, name: "Mad Max Collection", themeColor: "#2d1500" },
  { id: 528, name: "Terminator Collection", themeColor: "#111111" },
  { id: 264, name: "Back to the Future Collection", themeColor: "#001a2d" },
  { id: 531330, name: "MonsterVerse Collection", themeColor: "#1a0f0a", badge: { label: "MONSTERVERSE", tone: "teal" } },
  { id: 535313, name: "Godzilla Collection", themeColor: "#0a1a0a" },
  { id: 363369, name: "Pacific Rim Collection", themeColor: "#001a2d" },
  { id: 2794, name: "Chronicles of Riddick Collection", themeColor: "#1a0a0a" },
  { id: 63043, name: "TRON Collection", themeColor: "#001a2d" },
  { id: 422837, name: "Blade Runner Collection", themeColor: "#000a1a" },
  { id: 5547, name: "RoboCop Collection", themeColor: "#0a0a1a" },

  // ── Fantasy & Adventure ───────────────────────────────────────────────────────
  { id: 119, name: "The Lord of the Rings Collection", themeColor: "#1c2a1c", badge: { label: "LOTR", tone: "green" } },
  { id: 119566, name: "The Hobbit Collection", themeColor: "#1a1a00" },
  { id: 1241, name: "Harry Potter Collection", themeColor: "#1a1a2e", badge: { label: "HARRY POTTER", tone: "amber" } },
  { id: 435259, name: "Fantastic Beasts Collection", themeColor: "#2a1a0a" },
  { id: 84, name: "Indiana Jones Collection", themeColor: "#2d1a0a" },
  { id: 420, name: "The Chronicles of Narnia Collection", themeColor: "#2d2000" },
  { id: 22559, name: "Percy Jackson Collection", themeColor: "#001a2d" },
  { id: 43055, name: "Conan the Barbarian Collection", themeColor: "#2d1500" },
  { id: 8050, name: "Highlander Collection", themeColor: "#1a1a00" },
  { id: 125570, name: "300 Collection", themeColor: "#2d1000" },
  { id: 86780, name: "Clash of the Titans Collection", themeColor: "#1a1500" },

  // ── Spy & Action-Thriller ─────────────────────────────────────────────────────
  { id: 645, name: "James Bond Collection", themeColor: "#0a0a0a", badge: { label: "BOND", tone: "slate" } },
  { id: 295, name: "Pirates of the Caribbean Collection", themeColor: "#001a1a" },
  { id: 87359, name: "Mission: Impossible Collection", themeColor: "#1a1a1a", badge: { label: "M:I", tone: "slate" } },
  { id: 31562, name: "Bourne Collection", themeColor: "#0a0a0a" },
  { id: 40339, name: "Sherlock Holmes Collection", themeColor: "#1a150a" },
  { id: 192492, name: "Jack Ryan Collection", themeColor: "#001a1a" },
  { id: 386534, name: "Has Fallen Collection", themeColor: "#1a0a00" },
  { id: 9518, name: "Transporter Collection", themeColor: "#0a0a0a" },
  { id: 2467, name: "Tomb Raider Collection", themeColor: "#1a1a00" },
  { id: 135468, name: "G.I. Joe Collection", themeColor: "#0a1a00" },

  // ── Fast Cars, Fights & Pure Action ──────────────────────────────────────────
  { id: 9485, name: "The Fast and the Furious Collection", themeColor: "#1c1c1c", badge: { label: "FAST & FURIOUS", tone: "orange" } },
  { id: 404609, name: "John Wick Collection", themeColor: "#050505", badge: { label: "JOHN WICK", tone: "slate" } },
  { id: 1570, name: "Die Hard Collection", themeColor: "#1a0a0a" },
  { id: 1575, name: "Rocky Collection", themeColor: "#2d0a0a" },
  { id: 5039, name: "Rambo Collection", themeColor: "#2d0a00" },
  { id: 7551, name: "Lethal Weapon Collection", themeColor: "#1a0a00" },
  { id: 126125, name: "The Expendables Collection", themeColor: "#1a1000" },
  { id: 495371, name: "Creed Collection", themeColor: "#2d0a0a" },
  { id: 509865, name: "Taken Collection", themeColor: "#1a1a0a" },
  { id: 577302, name: "The Equalizer Collection", themeColor: "#0a0a0a" },
  { id: 14890, name: "Bad Boys Collection", themeColor: "#1a0a1a" },
  { id: 85861, name: "Beverly Hills Cop Collection", themeColor: "#2d1a00" },
  { id: 90863, name: "Rush Hour Collection", themeColor: "#1a1a00" },
  { id: 390326, name: "Ip Man Collection", themeColor: "#0a0a0a" },
  { id: 257960, name: "The Raid Collection", themeColor: "#1a0a0a" },
  { id: 269098, name: "Police Story Collection", themeColor: "#1a1a00" },
  { id: 471435, name: "Wolf Warrior Collection", themeColor: "#0a1a00" },
  { id: 304528, name: "Ocean's Collection", themeColor: "#0a0a1a" },
  { id: 282118, name: "Now You See Me Collection", themeColor: "#1a0a2d" },
  { id: 131836, name: "National Treasure Collection", themeColor: "#2d1a00" },
  { id: 8650, name: "Transformers Collection", themeColor: "#0a0a2d" },

  // ── Horror ────────────────────────────────────────────────────────────────────
  { id: 504068, name: "The Conjuring Universe", themeColor: "#0a0a0a", badge: { label: "CONJURING", tone: "slate" } },
  { id: 313086, name: "The Conjuring Collection", themeColor: "#050505" },
  { id: 402074, name: "Annabelle Collection", themeColor: "#0a0500" },
  { id: 968052, name: "The Nun Collection", themeColor: "#050505" },
  { id: 477962, name: "IT Collection", themeColor: "#2d0000" },
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
  { id: 8917, name: "Hellraiser Collection", themeColor: "#1a0000" },
  { id: 98580, name: "Candyman Collection", themeColor: "#1a0500" },
  { id: 19285, name: "Leprechaun Collection", themeColor: "#0a1a00" },
  { id: 630386, name: "Ready or Not Collection", themeColor: "#2d0a0a" },


  // ── Monsters, Dinos & Creatures ───────────────────────────────────────────────
  { id: 328, name: "Jurassic Park Collection", themeColor: "#0a2d0a", badge: { label: "JURASSIC", tone: "green" } },
  { id: 173710, name: "Planet of the Apes Collection", themeColor: "#0f1a0f" },
  { id: 1733, name: "The Mummy Collection", themeColor: "#2d1a00" },
  { id: 433256, name: "Jumanji Collection", themeColor: "#0a1a0a" },

  // ── Young Adult & Drama ───────────────────────────────────────────────────────
  { id: 131635, name: "The Hunger Games Collection", themeColor: "#2d1300", badge: { label: "HUNGER GAMES", tone: "orange" } },
  { id: 33514, name: "The Twilight Saga", themeColor: "#0a1a1a" },
  { id: 283579, name: "Divergent Collection", themeColor: "#1a1a2d" },
  { id: 295130, name: "Maze Runner Collection", themeColor: "#1a0a0a" },

  // ── Pixar & Disney Animation ──────────────────────────────────────────────────
  { id: 10194, name: "Toy Story Collection", themeColor: "#001a3b", badge: { label: "TOY STORY", tone: "blue" } },
  { id: 468222, name: "The Incredibles Collection", themeColor: "#2d0a0a" },
  { id: 87118, name: "Cars Collection", themeColor: "#2d0a0a" },
  { id: 137696, name: "Monsters, Inc. Collection", themeColor: "#0a0a2d" },
  { id: 717080, name: "Inside Out Collection", themeColor: "#0a1a2d" },
  { id: 255535, name: "Finding Nemo Collection", themeColor: "#001a2d" },
  { id: 404368, name: "Wreck-It Ralph Collection", themeColor: "#0a001a" },
  { id: 386382, name: "Frozen Collection", themeColor: "#0a1a3b" },
  { id: 15302, name: "The Lion King Collection", themeColor: "#2d1e00" },
  { id: 1084247, name: "Zootopia Collection", themeColor: "#001a0a" },
  { id: 1241984, name: "Moana Collection", themeColor: "#001a2d" },

  // ── DreamWorks & Other Animation ─────────────────────────────────────────────
  { id: 2150, name: "Shrek Collection", themeColor: "#111a00", badge: { label: "SHREK", tone: "green" } },
  { id: 94602, name: "Puss in Boots Collection", themeColor: "#1a0a00" },
  { id: 86066, name: "Despicable Me Collection", themeColor: "#131a26", badge: { label: "MINIONS", tone: "yellow" } },
  { id: 544669, name: "Minions Collection", themeColor: "#1a1a00" },
  { id: 8354, name: "Ice Age Collection", themeColor: "#0a1a2d" },
  { id: 77816, name: "Kung Fu Panda Collection", themeColor: "#2d2600" },
  { id: 14740, name: "Madagascar Collection", themeColor: "#2d260a" },
  { id: 89137, name: "How to Train Your Dragon Collection", themeColor: "#0a132d" },
  { id: 174614, name: "Hotel Transylvania Collection", themeColor: "#0a0a1a" },
  { id: 621023, name: "The Croods Collection", themeColor: "#2d1a00" },
  { id: 134095, name: "Rio Collection", themeColor: "#001a00" },
  { id: 427084, name: "The Secret Life of Pets Collection", themeColor: "#0a1a1a" },
  { id: 544670, name: "Sing Collection", themeColor: "#1a0a2d" },
  { id: 357376, name: "The Angry Birds Collection", themeColor: "#2d0a00" },
  { id: 385055, name: "The Boss Baby Collection", themeColor: "#001a2d" },
  { id: 444697, name: "Trolls Collection", themeColor: "#2d002d" },
  { id: 325470, name: "The LEGO Movie Collection", themeColor: "#2d1a00" },
  { id: 720879, name: "Sonic the Hedgehog Collection", themeColor: "#001a2d", badge: { label: "SONIC", tone: "blue" } },
  { id: 167613, name: "Alvin and the Chipmunks Collection", themeColor: "#2d1a00" },
  { id: 34055, name: "Pokémon Collection", themeColor: "#2d1a00" },
  { id: 750822, name: "The Addams Family Collection", themeColor: "#0a0a1a" },
  { id: 86486, name: "Spy Kids Collection", themeColor: "#001a0a" },

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
  { id: 9888, name: "Home Alone Collection", themeColor: "#1a1a00" },
  { id: 3167, name: "Ace Ventura Collection", themeColor: "#1a2d00" },
  { id: 37139, name: "Naked Gun Collection", themeColor: "#1a1a1a" },
  { id: 9338, name: "Police Academy Collection", themeColor: "#0a0a1a" },

  // ── Family & Classics ─────────────────────────────────────────────────────────
  { id: 430544, name: "Paddington Collection", themeColor: "#2d1a00" },
  { id: 256322, name: "The Muppets Collection", themeColor: "#2d1a2d" },
  { id: 945475, name: "Beetlejuice Collection", themeColor: "#0a0a1a" },

  // ── Video Game Adaptations ────────────────────────────────────────────────────
  { id: 9818, name: "Mortal Kombat Collection", themeColor: "#2d0a00" },
  { id: 931431, name: "Mortal Kombat (Reboot) Collection", themeColor: "#2d0500" },
  { id: 1216426, name: "Uncharted Collection", themeColor: "#1a1000" },

  // ── Indian Cinema ─────────────────────────────────────────────────────────────
  { id: 350309, name: "Baahubali Collection", themeColor: "#2d1500", badge: { label: "BAAHUBALI", tone: "amber" } },
  { id: 657153, name: "KGF Collection", themeColor: "#1a0a00", badge: { label: "KGF", tone: "amber" } },
  { id: 921781, name: "Pushpa Collection", themeColor: "#2d1000", badge: { label: "PUSHPA", tone: "red" } },
  { id: 246091, name: "Krrish Collection", themeColor: "#001a2d" },
  { id: 44976, name: "Dhoom Collection", themeColor: "#0a0a1a" },
  { id: 256433, name: "Dabangg Collection", themeColor: "#1a0a00" },
  { id: 483464, name: "Golmaal Collection", themeColor: "#1a1a00" },
  { id: 44724, name: "Don Collection", themeColor: "#0a0a1a" },
  { id: 506940, name: "Baaghi Collection", themeColor: "#1a0a0a" },
  { id: 142015, name: "Housefull Collection", themeColor: "#2d1a00" },
  { id: 401655, name: "Welcome Collection", themeColor: "#1a2d00" },
  { id: 142021, name: "Dhamaal Collection", themeColor: "#1a1a00" },
];

/** MCU = TMDB keyword "marvel cinematic universe (mcu)" ∩ Marvel Studios, minus documentaries. */
const MCU_SOURCE: FranchiseSource = {
  type: "keyword",
  keywordId: 180547,
  companyId: 420, // Marvel Studios
  excludeGenreIds: [99, 10770], // Documentary, TV Movie
  excludeIds: [],
  // Known in-universe order; films TMDB adds later are appended by release date
  pinnedOrder: [
    1771, 299537, 1726, 10138, 1724, 10195, 24428, 68721, 76338, 100402, 118340, 283995,
    99861, 102899, 271110, 497698, 284054, 315635, 284052, 284053, 299536, 363088, 299534,
    429617, 566525, 524434, 634649, 453395, 616037, 505642, 640146, 447365, 609681, 533535,
    822119,
  ],
  minRuntime: 70, // drops One-Shots, "I Am Groot" shorts and TV specials
};

/** Spider-Man = four TMDB collections, each labelled with its era. */
const SPIDER_MAN_SOURCE: FranchiseSource = {
  type: "merge",
  eras: [
    { tmdbCollectionId: 556, era: "Tobey Maguire Spider-Man (Standalone)" },
    { tmdbCollectionId: 125574, era: "Andrew Garfield Spider-Man (Standalone)" },
    { tmdbCollectionId: 531241, era: "Tom Holland Spider-Man (Standalone MCU)" },
    { tmdbCollectionId: 573436, era: "Miles Morales (Spider-Verse Animated)" },
  ],
};

export const FRANCHISE_SEED: FranchiseSeedRow[] = SEED_ENTRIES.map((entry, rank) => {
  const base = { key: entry.id, name: entry.name, themeColor: entry.themeColor, badge: entry.badge, rank };
  if (entry.id === MCU_FRANCHISE_ID) {
    return {
      ...base,
      name: "Marvel Cinematic Universe (Chronological)",
      overview:
        "The epic chronological timeline of the Marvel Cinematic Universe, from the origins of Captain America to the latest multiversal threats.",
      source: MCU_SOURCE,
      featuredMovieId: 299534, // Avengers: Endgame
    };
  }
  if (entry.id === SPIDER_MAN_FRANCHISE_ID) {
    return {
      ...base,
      overview:
        "The complete live-action standalone universe of Peter Parker across three generation-defining eras: Tobey Maguire, Andrew Garfield and Tom Holland. Plus Miles Morales in the Spider-Verse.",
      source: SPIDER_MAN_SOURCE,
      featuredMovieId: 634649, // Spider-Man: No Way Home
    };
  }
  return { ...base, source: { type: "collection", tmdbCollectionId: entry.id } };
});
