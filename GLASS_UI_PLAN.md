# Glass Theme — Animation & UI/UX Implementation Plan

## What I pulled from the design references

| Brand | Principle Borrowed |
|---|---|
| **Apple** (visionOS) | Layered glass depth, spring physics, chromatic blur, specular highlights |
| **Linear** | Precise micro-interactions, stagger lists, hover scale-precision |
| **Raycast** | Gradient glow on active/focus, snappy panel open/close, dark chrome |
| **ElevenLabs / RunwayML** | Cinematic hero section, full-bleed imagery, smooth crossfade |
| **Framer** | whileInView scroll reveals, gesture feedback, AnimatePresence mastery |
| **Superhuman** | Premium modal entrance, purple/blue glow, keyboard-first feel |
| **Ferrari / SpaceX** | Dramatic entrance hierarchy, sparse whitespace, full-viewport impact |
| **Revolut / Kraken** | Gradient card surfaces, data-dense glass panels |

---

## Phase 1 — Background & Foundation (globals.css + tailwind.config)
_Everything below this is pure CSS/config — zero component rewrites needed_

### 1.1 Animated Depth Orbs
Replace the static aurora gradient with three animating radial "depth orbs" on `body.theme-glass`:
```css
/* Three floating orbs — primary blue, accent orange, deep purple */
/* Orb 1: top-left, slow drift 18s */
/* Orb 2: bottom-right, medium drift 24s, delay 6s */
/* Orb 3: center, slow pulse 30s, delay 12s */
/* All: radial-gradient, opacity 0.12–0.18, pointer-events:none, z-index:-1 */
```
**Source**: Apple visionOS ambient lighting — orbs give the illusion of light sources through glass.

### 1.2 Glass Surface Hierarchy (depth tokens)
Add four surface levels to `:root` for `body.theme-glass`:
```
--glass-0: rgba(255,255,255, 0.03)   /* page background layer */
--glass-1: rgba(255,255,255, 0.05)   /* cards, panels */
--glass-2: rgba(255,255,255, 0.08)   /* elevated cards, inputs */
--glass-3: rgba(255,255,255, 0.12)   /* active/hover states, modals */
--glass-4: rgba(255,255,255, 0.18)   /* tooltips, top-level overlays */
```
**Source**: Apple layered glass / Linear surface elevation system.

### 1.3 Specular Inner Highlight
Every glass surface gets a `::before` pseudo-element with a top-edge shine:
```css
inset 0 1px 0 rgba(255,255,255,0.12),   /* top edge catch-light */
inset 0 -1px 0 rgba(0,0,0,0.15)         /* bottom edge grounding */
```
**Source**: visionOS glass spec — the top highlight is what makes glass look glass.

### 1.4 New Keyframes to add
```
glassEnterBottom  — translateY(32px) + blur(12px) → 0 (spring, 0.55s)
glassEnterScale   — scale(0.94) + blur(8px) → 1 (spring, 0.4s)
orbDrift1         — infinite position drift (18s ease-in-out)
orbDrift2         — infinite position drift (24s ease-in-out, offset)
magneticHover     — used by JS mouse tracking, not keyframe
shimmerGlass      — blue-to-orange shimmer sweep (2s)
```

---

## Phase 2 — PosterCard (`src/components/PosterCard.tsx`)
_Most-seen component — every improvement is multiplied_

### 2.1 Magnetic hover effect
On `mouseMove` within the card boundary, apply a subtle 3D tilt via `transform: perspective(800px) rotateX() rotateY()`.
- Max tilt: ±6deg X, ±8deg Y
- Spring physics: use `framer-motion` `useMotionValue` + `useSpring` with `stiffness:400 damping:30`
- Poster image shifts slightly opposite direction (parallax shift ±4px)
- Rating badge intensifies glow on hover direction
**Source**: Framer website cards, Apple App Store card tilt.

### 2.2 Action rail slide-in stagger
Currently the action rail is always visible. In glass theme:
- Rail starts `opacity:0, x:-8px` 
- On card hover: actions stagger in with 40ms delay between each
- Use `motion.div` with `variants` for each action button
- Each button gets a micro-press animation on click (scale 0.88 → 1.08 → 1)
**Source**: Linear action menus, Raycast command items.

### 2.3 Image reveal on hover
The `glass-poster-overlay` currently fades in. Upgrade to:
- Overlay: mask-image gradient wipe from bottom (not opacity fade)
- Title text: `blur(4px) → blur(0)` + `translateY(6px → 0)` staggered from title → meta
- Smooth 200ms cubic-bezier(0.22,1,0.36,1) — snappy but spring-like
**Source**: Framer, Ferrari editorial cards.

---

## Phase 3 — TrendingHero (`src/components/TrendingHero.tsx`)
_First thing users see — must be cinematic_

### 3.1 Crossfade with Ken Burns
Current: simple `current` state change. Upgrade:
- `AnimatePresence mode="sync"` wrapping backdrop image
- Exit: `scale(1.05) opacity(0) blur(6px)` over 600ms
- Enter: `scale(1.08) → 1.02` Ken Burns zoom over 6s (the auto-rotate duration)
- Content block: stagger children — badge → title → meta → buttons, 80ms between each
**Source**: Apple TV+ hero, RunwayML media sections.

### 3.2 Parallax scroll
Add `useScroll` + `useTransform` from framer-motion:
- Backdrop image: `scrollY [0,400] → y [0, 80]` (moves slower = parallax depth)
- Content overlay: `scrollY [0,200] → opacity [1, 0]` (fades as you scroll into the grid)
**Source**: SpaceX, Tesla full-viewport sections.

### 3.3 Slide indicator refinement
Current dot indicators → animated pill:
- Active dot expands to pill (width: 6px → 24px) with `layout` animation
- Background: gradient `--theme-primary → --theme-accent`
- Inactive: `opacity:0.3` with smooth transition
**Source**: Apple carousel indicators, Linear progress dots.

---

## Phase 4 — Bottom Nav (`src/components/MobileBottomNav.tsx`)
_Seen on every page — glass feel must be perfect_

### 4.1 Floating glass pill redesign
Current: full-width border-top bar. Upgrade for glass theme:
- Wrap nav items in a `mx-4 mb-4 rounded-2xl` floating pill
- `backdrop-blur(24px) saturate(180%)` 
- Subtle gradient border: `linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))`
- Drop shadow: `0 -4px 40px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.4)`
**Source**: iOS dock, Raycast launcher panel.

### 4.2 Active indicator — morphing underline
Replace the `drop-shadow` glow with a morphing indicator:
- Active item gets a `layoutId="nav-active"` pill behind the icon
- Pill animates position with `layout` transition (spring: stiffness 500, damping 35)
- Pill: `bg-blue-500/20, border border-blue-400/30, rounded-xl`
- Icon: spring scale 1 → 1.15 on activation
**Source**: Linear sidebar active states, Raycast selected item.

### 4.3 Haptic feedback simulation
On nav item press:
- Rapid scale: `1 → 0.88 → 1.05 → 1` over 280ms (spring)
- Icon rotates ±3deg on the 0.88 frame (wobble)
**Source**: Apple iOS tap feedback, Framer gesture system.

---

## Phase 5 — MovieModal (`src/components/MovieModal.tsx`)
_The most complex component — needs the most cinematic treatment_

### 5.1 Entrance — shared element transition illusion
The modal currently fades in. Upgrade to:
- `initial: { clipPath: "inset(0% 0% 100% 0%)", filter: "blur(12px)" }`
- `animate: { clipPath: "inset(0% 0% 0% 0%)", filter: "blur(0px)" }`
- Duration: 0.55s `cubic-bezier(0.22, 1, 0.36, 1)`
- Backdrop blur overlay: separate layer, fades in 100ms before the panel
**Source**: Apple Sheet presentation, Superhuman compose window.

### 5.2 Backdrop image — cinematic reveal
The hero backdrop image reveal:
- Start: `scale(1.08), brightness(0.3), blur(8px)`
- Animate to: `scale(1.0), brightness(0.6), blur(0px)` over 800ms
- Gradient overlay on top fades in separately with 200ms delay
- Gives the sensation of a cinema screen lighting up
**Source**: Apple TV+ movie page, Ferrari hero imagery.

### 5.3 Content stagger
After backdrop reveal, stagger all content blocks:
- Studio logos row: slideUp + fadeIn (delay 200ms)
- Title: slideUp (delay 300ms)  
- Meta row (rating, year, runtime): slideUp (delay 380ms)
- Action buttons: slideUp (delay 450ms)
- Synopsis: fadeIn (delay 500ms)
- Cast row: stagger each actor avatar (delay 600ms + 30ms per actor)
**Source**: Linear detail views, RunwayML media cards.

### 5.4 Action buttons — glass pill style
The Like/Watchlist/Watched buttons for glass theme:
- Default: `glass-1` surface, subtle border
- Active: `bg-blue-500/25, border-blue-400/50, shadow-glow-blue`
- Press: scale 0.92, release: scale 1.08 → 1.0 (spring)
- Toggling off: brief red/orange flash before returning to default
**Source**: Raycast action buttons, Linear status buttons.

---

## Phase 6 — Scroll-Driven Section Reveals
_Applied to PosterGrid, RecommendationsSection, RadarShelf, SimilarRow_

### 6.1 whileInView stagger for poster grids
Wrap each poster in `motion.div`:
- `initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}`
- `whileInView={{ opacity: 1, y: 0, filter: "blur(0)" }}`
- `viewport={{ once: true, margin: "-60px" }}`
- `transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}`
- Cap stagger at index 12 (beyond that, no delay — avoid waiting too long)
**Source**: Linear list reveals, Framer motion examples.

### 6.2 Section headers — clip-path wipe
Section titles (e.g. "Trending", "For You", "Similar"):
- `initial={{ clipPath: "inset(0 100% 0 0)" }}`
- `animate={{ clipPath: "inset(0 0% 0 0)" }}`
- Duration: 0.5s, `easeOut`
- Optional: small accent line grows in after title
**Source**: Ferrari editorial headings, SpaceX section reveals.

---

## Phase 7 — CommandHub / Search (`src/components/CommandHub.tsx`)
_Daily driver for all users — must feel premium_

### 7.1 Search input — glass focus state
On focus:
- Border: `rgba(96,165,250,0.15)` → `rgba(96,165,250,0.5)` 
- Box shadow: `0 0 0 3px rgba(96,165,250,0.15), 0 0 24px rgba(96,165,250,0.12)`
- Background: `glass-1` → `glass-2`
- Smooth 200ms transition
- The search icon itself animates: scale 1 → 0.85, color dimmed → blue-400
**Source**: Raycast search, Linear search bar.

### 7.2 Filter chips — spring reveal
When filter panel opens (`showFilters: true`):
- Chips stagger in: `y: 12 → 0, opacity: 0 → 1` with 30ms between each chip
- Filter panel container: `clipPath` wipe from top (not height animation — avoids layout jank)
- Active chip: glowing border sweep animation (neonTrace but faster, 0.8s)
**Source**: Raycast filters, Framer filter UI.

---

## Phase 8 — Glass Typography Refinements (`globals.css`)
_Typography is where premium vs cheap is decided_

### 8.1 Fluid type scale
Use `clamp()` for heading sizes to scale fluidly across breakpoints:
```css
body.theme-glass h1 { font-size: clamp(1.75rem, 4vw, 3rem); letter-spacing: -0.03em; }
body.theme-glass h2 { font-size: clamp(1.25rem, 2.5vw, 1.75rem); letter-spacing: -0.02em; }
```
**Source**: Linear, Stripe weight-300 precision.

### 8.2 Text rendering
```css
body.theme-glass {
  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
  font-feature-settings: "ss01", "cv01", "liga";  /* Space Grotesk OpenType features */
}
```

### 8.3 Selection styling
```css
body.theme-glass ::selection {
  background: rgba(96,165,250,0.25);
  color: #fff;
  text-shadow: 0 0 12px rgba(96,165,250,0.5);
}
```

---

## Phase 9 — Skeleton Loaders (`src/components/RadarSkeleton.tsx` + `SkeletonCard.tsx`)
_Loading states should feel like the rest of the theme_

### 9.1 Glass shimmer
Current brutal-shimmer uses a grey sweep. Glass version:
- Base: `glass-0` surface with glass border
- Shimmer: `rgba(96,165,250,0.06) → rgba(249,115,22,0.05) → rgba(96,165,250,0.06)` sweep
- Speed: 2.2s (slightly slower = more luxurious feel)
- Subtle border pulse: border opacity 0.06 → 0.18 in sync with shimmer
**Source**: Apple skeleton loaders, Linear loading states.

---

## Phase 10 — Toast Notifications (`src/components/ToastProvider.tsx`)
_Tiny moment, big impact on perceived quality_

### 10.1 Glass toast style
- Floating pill: `glass-3` surface, `backdrop-blur(20px)`
- Enter: `y: 80 → 0, scale: 0.92 → 1.02 → 1` spring
- Exit: `y: 0 → -12, opacity: 1 → 0, scale: 1 → 0.94` 
- Border: gradient from `--theme-primary/30` to `--theme-accent/20`
- Progress bar: thin line at bottom, drains left-to-right over toast duration
**Source**: Raycast toast, Linear action feedback.

---

## Implementation Order (priority → impact)

| Priority | Phase | Files | Impact |
|---|---|---|---|
| 1 | 1 (orbs + depth tokens) | globals.css | Every component instantly better |
| 2 | 3 (TrendingHero) | TrendingHero.tsx | First impression, cinematic |
| 3 | 4 (Bottom nav pill) | MobileBottomNav.tsx | Seen on every page |
| 4 | 2 (PosterCard) | PosterCard.tsx | Multiplied across all grids |
| 5 | 5 (MovieModal) | MovieModal.tsx | Deepest user interaction |
| 6 | 7 (CommandHub) | CommandHub.tsx | Daily driver |
| 7 | 6 (Scroll reveals) | PosterGrid + sections | Perceived polish |
| 8 | 10 (Toasts) | ToastProvider.tsx | Small but felt |
| 9 | 9 (Skeletons) | SkeletonCard + RadarSkeleton | Loading feel |
| 10 | 8 (Typography) | globals.css | Cumulative refinement |

---

## What NOT to touch

- Keep `framer-motion` — already installed, no new deps needed
- Don't add new animation libraries — everything can be done with existing Framer Motion + CSS
- Don't change animations in `body.theme-netflix` or default theme — glass-only
- Don't slow down PosterCard render — all hover effects via CSS transforms only (no layout changes)
- Don't add `will-change: transform` to everything — only poster cards and modal
- Respect `prefers-reduced-motion` — wrap all keyframe animations with `@media (prefers-reduced-motion: reduce) { animation: none; transition: none }`

---

## Framer Motion patterns to use consistently

```tsx
// Spring preset — snappy but smooth (use for interactive elements)
const spring = { type: "spring", stiffness: 400, damping: 30 }

// Smooth preset — content reveals (use for page elements)
const smooth = { duration: 0.4, ease: [0.22, 1, 0.36, 1] }

// Cinematic preset — hero/modal (use for full-screen transitions)
const cinematic = { duration: 0.65, ease: [0.16, 1, 0.3, 1] }

// Stagger container
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } }
}

// Stagger child
const staggerChild = {
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" }
}
```
