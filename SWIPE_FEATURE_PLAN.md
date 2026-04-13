---
name: Swipe Feature Plan
description: Detailed implementation plan for a Tinder‑style swipe interface for discovering movies, including UI/UX, backend, data flow, gestures mapping, performance, and testing.
type: project
---

# Goal
Create a dedicated “Swipe” page where users discover movies one‑by‑one, swipe in four directions to perform actions, and receive micro‑animations. The feature must be production‑ready, performant, and respect a 200‑swipes‑per‑day quota.

## High‑level Architecture
1. **Frontend**
   - New route `src/app/swipe/page.tsx` (RSC + client component).
   - `SwipeDeck` component renders a stack of `MovieCard` (based on existing `PosterCard` UI) using **Framer Motion** for drag gestures.
   - Gesture directions → actions (configurable, default mapping provided).
   - After each swipe, invoke `useMovieLists` hooks to like/watchlist/watched/add‑to‑cineblock.
   - On “add to cineblock” swipe, show a lightweight modal asking if the user also wants to add to liked/watchlist (using existing `BlockModalProvider`).
   - Daily‑limit stored in a server‑side DB via `/api/swipe/limit` endpoint; client cache in local storage to avoid extra round‑trip.
   - Batch fetching: `/api/swipe/batch?size=20\u0026offset=…` returns a shuffled list of movies (discovery endpoint). When the deck falls below a threshold (e.g., 5 cards), pre‑fetch next batch.
   - Loading \u0026 empty states with graceful UI.
   - Use `react-query` (or SWR) for data fetching to get cache \u0026 stale‑while‑revalidate semantics.

2. **Backend (Next.js API routes)**
   - `src/pages/api/swipe/batch.ts` – query TMDB discover/search with random page, returns `size` movies, filters out IDs already in any list for the user.
   - `src/pages/api/swipe/limit.ts` – GET returns `{remaining: number, resetAt: ISO}`; POST increments count after successful swipe. Enforce 200 limit, respond with 429 when exceeded.
   - Leverage existing auth (likely `next‑auth` or custom session) to identify user.
   - Add rate‑limit middleware to protect the endpoint.

3. **Data Flow**
   - On page load, fetch initial batch + limit.
   - Store movies in local state array `deck`.
   - On swipe → determine direction → call appropriate hook (`toggleLiked`, `toggleWatchlist`, `toggleWatched`, `openBlockModal`).
   - After action, call `/api/swipe/limit` to decrement remaining.
   - If limit reached, show banner “You have reached today’s swipe limit. Come back tomorrow.”
   - When deck length < `prefetchThreshold`, trigger next batch fetch.

## Gesture‑to‑Action Mapping (default)
| Direction | Action | UI Feedback |
|-----------|--------|-------------|
| **Right** | Favorite (like) | Card flies right with a heart burst animation |
| **Left**  | Skip / Dismiss (no state change) | Card flips left, fades out |
| **Up**    | Add to Watchlist | Card lifts up, watchlist icon flashes |
| **Down**  | Add to CineBlock (playlist) | Card drops down, opens small modal asking if also add to liked/watchlist |

*The mapping can be overridden via a config object (`SwipeConfig`) stored in `src/lib/constants.ts`.*

## Micro‑animations \u0026 Performance
- Use **Framer Motion** `animate` and `whileTap` for press feedback.
- On swipe release, animate off‑screen with a spring; on cancel, spring back to centre.
- Card stack shows next two cards partially (scale/translate) for depth cue.
- Prefetch next batch using `useEffect` with debounce to avoid multiple calls.
- Avoid per‑movie API calls; fetch in batches (size 20) and filter client‑side.
- Store already‑seen IDs in a `Set` to prevent duplicates across batches.

## Testing Strategy
1. **Unit tests** for `SwipeDeck` gesture handling (Jest + React Testing Library).
2. **Integration tests** using Playwright to simulate swipes and verify list updates and limit enforcement.
3. **Performance tests** – ensure initial load < 1 s, subsequent batch fetch < 500 ms.
4. **Accessibility** – ensure cards are focusable and draggable via keyboard (arrow keys) with ARIA labels.

## Steps \u0026 Tasks
| # | Description | Owner | Estimated Effort |
|---|-------------|-------|-------------------|
| 1 | Add Framer Motion dependency (`npm i framer-motion`). | Me | 5 min |
| 2 | Create `src/app/swipe/page.tsx` and route. | Me | 15 min |
| 3 | Implement `SwipeDeck` component (stack, drag logic). | Me | 45 min |
| 4 | Create `MovieCard` component re‑using PosterCard UI with motion wrappers. | Me | 30 min |
| 5 | Add backend API `/api/swipe/batch` and `/api/swipe/limit`. | Me | 30 min |
| 6 | Wire actions to `useMovieLists` hooks. | Me | 20 min |
| 7 | Implement daily‑limit logic (server + client cache). | Me | 20 min |
| 8 | Add modal for “add to CineBlock” with extra list options. | Me | 25 min |
| 9 | Write unit \u0026 integration tests. | Me | 45 min |
|10| Update navigation (add link from home). | Me | 10 min |
|11| Performance \u0026 accessibility audit. | Me | 20 min |
|12| Documentation in `README` and commit message. | Me | 10 min |

## Risks \u0026 Mitigations
- **Duplicate movies** – keep a global `seenIds` Set; filter on server.
- **Exceeding TMDB rate limits** – batch fetch reduces calls; add exponential back‑off.
- **User confusion over gestures** – provide a brief overlay tutorial on first visit.
- **Daily limit bypass** – enforce on server side; client only for UI.
- **Mobile drag performance** – test on low‑end devices; limit number of cards in DOM (keep only top 5).

## Acceptance Criteria
- Users can swipe right/left/up/down with corresponding actions.
- No more than 200 swipes per day; UI shows remaining count.
- New movies are loaded automatically when the deck depletes.
- All actions persist via existing list hooks and backend.
- Micro‑animations are smooth (≥60 fps) and accessible.
- Automated tests pass.

---

*Plan file created for review.*