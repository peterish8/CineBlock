export interface WizardState {
  mood:
    | "brain-off"
    | "feel-something"
    | "get-scared"
    | "laugh"
    | "inspired"
    | "love"
    | "adventure";
  maxRuntime: 90 | 120 | 150 | 999;
  intensity: "light" | "moderate" | "intense";
  language: "en" | "hi" | "ko" | "ja" | "fr" | "any";
  dealbreakers: Array<"gore" | "jumpscares" | "animal-death" | "sad-ending">;
}

const MOOD_GENRES: Record<WizardState["mood"], string> = {
  "brain-off": "28,35",
  "feel-something": "18",
  "get-scared": "27,53",
  laugh: "35",
  inspired: "18,99",
  love: "10749,18",
  adventure: "12,878,14",
};

const INTENSITY_MAP: Record<
  WizardState["intensity"],
  { voteGte: string; sortBy: string }
> = {
  light: { voteGte: "6.5", sortBy: "popularity.desc" },
  moderate: { voteGte: "7.0", sortBy: "vote_average.desc" },
  intense: { voteGte: "7.5", sortBy: "vote_average.desc" },
};

const DEALBREAKER_GENRES: Record<string, string> = {
  gore: "27",
};

const DEALBREAKER_KEYWORDS: Record<string, string> = {
  jumpscares: "10944,9748",
  "animal-death": "14410",
  "sad-ending": "187056",
};

export function buildTMDBParams(
  state: WizardState
): Record<string, string> {
  const params: Record<string, string> = {
    include_adult: "false",
    page: String(Math.ceil(Math.random() * 4)),
    with_genres: MOOD_GENRES[state.mood],
    "vote_average.gte": INTENSITY_MAP[state.intensity].voteGte,
    sort_by: INTENSITY_MAP[state.intensity].sortBy,
  };

  if (state.maxRuntime !== 999) {
    params["with_runtime.lte"] = String(state.maxRuntime);
  }

  if (state.language !== "any") {
    params.with_original_language = state.language;
  }

  const withoutGenres: string[] = [];
  const withoutKeywords: string[] = [];

  for (const db of state.dealbreakers) {
    if (DEALBREAKER_GENRES[db]) {
      withoutGenres.push(DEALBREAKER_GENRES[db]);
    }
    if (DEALBREAKER_KEYWORDS[db]) {
      withoutKeywords.push(DEALBREAKER_KEYWORDS[db]);
    }
  }

  if (withoutGenres.length > 0) {
    const existing = params.with_genres.split(",");
    const filtered = existing.filter((g) => !withoutGenres.includes(g));
    if (filtered.length > 0) params.with_genres = filtered.join(",");
    params.without_genres = withoutGenres.join(",");
  }

  if (withoutKeywords.length > 0) {
    params.without_keywords = withoutKeywords.join(",");
  }

  return params;
}
