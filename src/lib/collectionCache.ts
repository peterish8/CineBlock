import { TMDBCollectionDetail } from "@/lib/types";

const cache = new Map<number, Promise<TMDBCollectionDetail>>();
const MAX_RETRIES = 3;

async function fetchWithRetry(id: number, attempt = 0): Promise<TMDBCollectionDetail> {
  const res = await fetch(`/api/movies?action=collection&id=${id}`);
  const data = await res.json();

  if (res.status === 429 && attempt < MAX_RETRIES) {
    const retryAfter = Number(res.headers.get("Retry-After")) || 2 ** attempt;
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return fetchWithRetry(id, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(data.error || `Failed to load collection (${res.status})`);
  }

  return data as TMDBCollectionDetail;
}

/** Deduplicated collection fetch — shared by cards and modals. */
export function fetchCollectionDetail(id: number): Promise<TMDBCollectionDetail> {
  const existing = cache.get(id);
  if (existing) return existing;

  const request = fetchWithRetry(id).catch((err) => {
    cache.delete(id);
    throw err;
  });
  cache.set(id, request);
  return request;
}
