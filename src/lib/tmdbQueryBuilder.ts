export interface WizardState {
  keywordId: number | null;
  languages: string[];
  yearFrom: number;
  yearTo: number;
}

export type BuildParamsOptions = {
  includeKeyword?: boolean;
  yearFrom?: number;
  yearTo?: number;
  languageMode?: "strict" | "any";
  sortBy?: "vote_average.desc" | "popularity.desc";
  page?: number;
  minVoteAverage?: string;
  voteCountMin?: string;
};

function sanitizeLanguages(languages: string[]) {
  const unique = new Set(
    (languages || [])
      .map((l) => String(l || "").toLowerCase().trim())
      .filter((l) => l && l !== "any")
  );
  return [...unique].slice(0, 5);
}

export function buildTMDBParams(state: WizardState, options: BuildParamsOptions = {}): Record<string, string> {
  const languages = sanitizeLanguages(state.languages);
  const page = options.page ?? Math.floor(Math.random() * 8) + 1;
  const includeKeyword = options.includeKeyword ?? true;
  const languageMode = options.languageMode ?? "strict";
  const yearFrom = options.yearFrom ?? state.yearFrom;
  const yearTo = options.yearTo ?? state.yearTo;

  // Lower vote threshold for very recent years so fresh releases aren't filtered out
  const currentYear = new Date().getFullYear();
  const voteCountMin = yearTo >= currentYear - 1 ? "10" : "80";

  const params: Record<string, string> = {
    include_adult: "false",
    include_video: "false",
    page: String(page),
    "vote_average.gte": options.minVoteAverage ?? "6.9",
    "vote_count.gte": options.voteCountMin ?? voteCountMin,
    sort_by: options.sortBy ?? "vote_average.desc",
  };

  if (includeKeyword && state.keywordId) {
    params.with_keywords = String(state.keywordId);
  }

  params["primary_release_date.gte"] = `${yearFrom}-01-01`;
  params["primary_release_date.lte"] = `${yearTo}-12-31`;

  if (languageMode === "strict" && languages.length > 0) {
    params.with_original_language = languages.join("|");
  }

  return params;
}
