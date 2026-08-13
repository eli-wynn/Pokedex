---
target: client/src/pages/Home.js
total_score: 15
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-08-13T04-16-04Z
slug: client-src-pages-home-js
---
Method: dual-agent (A: a02da3488ce370d38 · B: ada8106b9c4c95856)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1/4 | Loading is a bare `<p>Loading Pokédex...</p>`; no progress/skeleton, no result count anywhere |
| 2 | Match Between System & Real World | 2/4 | Correct domain vocabulary, undercut by an uncleaned data artifact ("POKéMON") and no Pokédex-device metaphor |
| 3 | User Control and Freedom | 1/4 | No "clear filters"; dropdowns don't dismiss on outside click/Escape; multi-select gen picker force-closes after every click |
| 4 | Consistency and Standards | 1/4 | Type filter never highlights the active selection while Gen filter does; both dropdowns are custom divs, not native controls; heading hierarchy skips h1→h3 (detector-confirmed) |
| 5 | Error Prevention | 2/4 | No destructive actions to guard; no search debounce (up to 905 client-side re-filters per keystroke); zero-result states give no guidance |
| 6 | Recognition Rather Than Recall | 2/4 | Type badge colors are consistent app-wide, but the open Type dropdown shows no indicator of the current selection |
| 7 | Flexibility and Efficiency of Use | 1/4 | Search/type/rarity are shareable via URL params; generation filter is not (session-only) — inconsistent, and no shortcuts/sort/bulk actions exist anywhere |
| 8 | Aesthetic and Minimalist Design | 3/4 | Genuinely clean: consistent spacing, restrained palette, coherent monospace type system — the strongest score in the set |
| 9 | Help Users Recognize/Diagnose/Recover from Errors | 1/4 | Every fetch failure is swallowed by `console.error` only; a dead ability request leaves "Loading..." on screen forever with no retry |
| 10 | Help and Documentation | 1/4 | No explanation anywhere of what "Legendary"/"Mythical" mean or what a "Generation" range covers, for a visitor unfamiliar with Pokémon lore |
| **Total** | | **15/40** | **Poor — significant improvements needed before users are happy** |

## Design Specificity Verdict

**LLM assessment**: Mostly generic, with a thin skin of Pokémon-specific paint. Strip the red/dark palette, the monospace font, and two CSS animations (the legendary/mythical rotating ring, the shiny-sprite easter egg), and what's left — a search box, two dropdown filters, a three-pill rarity toggle, an auto-fill card grid, and a detail page with progress-bar stats — is the exact skeleton you'd ship for a recipe browser or an employee directory. Nothing in the *interaction model* is Pokédex-specific; only the *decoration* (type colors, dex-number padding, the legendary ring) is. Type-color-coding is a genuine domain touch worth crediting, but it's a data-driven accent, not a structural one.

**Deterministic scan**: `detect.mjs` found 1 static finding (`layout-transition` on `PokemonDetail.css:72`, verified genuine). The live browser overlay found 39 anti-patterns on the home page and 11 on the detail page — the overwhelming majority (36 of 39, and 5 of 11) are `low-contrast` findings on the type-badge palette, corroborating the LLM's independently-computed WCAG ratios almost exactly (e.g. detector: grass 2.1:1, LLM: grass 2.08:1). The detector also caught a `skipped-heading` (h1→h3, no h2) that the LLM review didn't flag, and an `ai-color-palette` hit on the detail page's "purple/violet gradient" background.

That last one is worth calling out as a genuine disagreement between the two assessments, not a rubber-stamp: the LLM review specifically *praised* that same radial gradient as bespoke craft (it's a type-color blend — grass→poison for Bulbasaur — not a decorative default). The detector is right that it happens to visually resemble a generic "AI gradient," but it's driven by real per-Pokémon type data, not filler; the disagreement is about surface resemblance vs. underlying intent. Read it as a caution to make the domain-logic more *visually legible* (so it doesn't get mistaken for filler), not as a instruction to remove it.

**Visual overlays**: Browser automation confirmed script injection succeeded on both pages, but this session has no interactive `[Human]` tab for you to view live — the sub-agents ran headless. Screenshots were captured instead: `home-desktop-1280.png`, `detail-desktop-1280.png`, `home-mobile-390.png` (in the session scratchpad), which back the mobile-overflow and contrast findings below.

## Overall Impression

The bones are more disciplined than the polish suggests — URL-synced filter state, row-indexed scroll restoration, a genuinely bespoke legendary-ring animation — but the app currently fails at the two things a portfolio piece can least afford to fail at: it's unusable on a phone (the filter bar overflows the viewport at 390px) and unusable by keyboard (dropdowns and all 905 cards have zero keyboard affordance). Both assessments landed on the same throughline independently: real engineering care went into state and data-fetching, and comparatively little went into what happens when a real, imperfect user — on a phone, on a keyboard, on a bad connection — actually touches it. The single biggest opportunity is the generation multi-select: it's the one feature built specifically for power users, and it's currently the worst experience in the app (full-page flash + forced dropdown close on every click).

## What's Working

1. **The legendary/mythical rotating ring + type-colored radial aura on the detail page** (`PokemonDetail.css:49-51, 222-240`) — a bespoke conic-gradient animation unique to rare Pokémon, layered under a type-blended background. Real, non-templated craft, not a stock effect.
2. **URL-synced filter state + row-indexed scroll restoration** (`Home.js:33-71, 184-199`) — search/type/rarity are shareable and bookmarkable, and returning from a detail page restores your exact scroll position rather than dumping you at the top. Deliberate engineering-for-UX that a lot of portfolio CRUD apps skip entirely.
3. **The ~10% shiny sprite easter egg** (`PokemonDetail.js:12, 63-64`) — a small, well-observed nod to actual Pokémon fandom (shiny hunting) that shows real domain understanding, not just API wiring.

## Priority Issues

**[P0] Mobile filter bar overflows the viewport horizontally**
- **Why it matters**: Confirmed live at 390px width — `.filters` measures 1067px wide against a 390px viewport (`document.documentElement.scrollWidth: 728` vs `clientWidth: 390`). The Generation filter is pushed off-screen entirely. This is the landing view, at the width nearly every phone visitor will hit — for a portfolio piece a recruiter may well open on their phone, this is the first impression failing outright.
- **Fix**: Add `flex-wrap: wrap` to `.filters` in `Home.css`, or convert to a horizontally-scrollable chip row / collapsible "Filters" sheet under ~480px.
- **Suggested command**: `/impeccable adapt`

**[P0] Type filter, generation filter, and every Pokémon card are unreachable by keyboard**
- **Why it matters**: `TypeFilter.js` and `GenFilter.js`'s toggles are plain `<div onClick>` with no `tabIndex`/`role`/key handler; `PokemonCard.js` is the same. Live-verified: tabbing from page load cycles through only 3 focusable elements in the whole app (the search input + 3 rarity buttons) — the dropdowns and all 905 cards are completely invisible to Tab. A keyboard-only user cannot open a single Pokémon's detail page. This is a hard accessibility failure, not a nice-to-have.
- **Fix**: Add `tabIndex={0}`, `role="button"`, `aria-expanded`/`aria-haspopup` and Enter/Space handlers to both dropdown toggles and to cards (or swap the divs for real `<button>` elements); add outside-click/Escape dismissal to both dropdowns.
- **Suggested command**: `/impeccable audit`

**[P1] Type badges fail contrast for 13 of 18 types, confirmed independently by both assessments**
- **Why it matters**: The LLM's manually-computed WCAG ratios and the detector's live-measured ratios agree almost exactly (e.g. grass 2.08:1 vs. 2.1:1, water 3.10:1 vs. 3.1:1). Only Fighting, Poison, Ghost, Dragon, and Dark clear the 4.5:1 minimum; the rest — Electric (1.5:1), Ice, Ground, Steel, Grass, Bug, Normal, Rock, Flying, Fairy, Fire, Water, Psychic — fail it, some badly. Type badges are the single most-repeated element in the app (every card, every filter, every detail page), so this isn't an edge case, it's systemic. The detector also flagged the primary brand color pairing (`#faf3dd` on `#d33e43`, 4.2:1) as just under threshold.
- **Fix**: Per-type text color — dark text on the light/mid-luminance backgrounds (Electric, Ice, Ground, Steel, Grass, etc.), keep white only where it already passes.
- **Suggested command**: `/impeccable audit`

**[P1] Multi-selecting generations is actively broken by a full-page remount**
- **Why it matters**: `Home.js`'s fetch effect sets `loading=true` on every `selectedGens` change, and the top-level `if (loading) return <p>...</p>` unmounts the entire filter row — including `GenFilter`, whose internal `isOpen` state resets on remount. Live-confirmed: selecting "Gen I" closes the dropdown even though the click handler never calls `setIsOpen(false)`. A user wanting "Gen I + Gen III + Gen V" must reopen the dropdown and sit through a full-screen flash for every single click — directly punishing the one feature (multi-select generations) that was built specifically for this.
- **Fix**: Keep filter chrome mounted during refetch; show an inline spinner near the grid instead of swapping the whole tree.
- **Suggested command**: `/impeccable optimize`

**[P2] No fetch failure is ever surfaced to the user**
- **Why it matters**: Every catch block across `Home.js`, `PokemonDetail.js`, and `PokemonCard.js` only does `console.error`. If an ability-description request fails permanently, the UI is stuck showing the literal string "Loading..." forever, with zero retry affordance anywhere in the app.
- **Fix**: Add a minimal inline error state ("Couldn't load — retry") to each of the three fetch paths.
- **Suggested command**: `/impeccable harden`

## Persona Red Flags

**Sam (Accessibility-dependent — screen reader + keyboard-only)**
- Cannot Tab to the Type filter or Generation filter at all — two of the app's four filtering mechanisms are entirely invisible to Sam.
- Cannot Tab to a single Pokémon card — the core "click in to see details" interaction, across all 905 cards, is mouse-only (verified via a 13-Tab-stop trace that never left the search box and three rarity buttons).
- The search input has no `<label>` or `aria-label`, relying only on `placeholder` — a discouraged pattern since the accessible-name cue vanishes the moment Sam starts typing.
- No landmark structure on the detail page beyond flat `<h1>`/`<h2>` tags (and the home page skips straight from `<h1>` to `<h3>`, detector-confirmed) — Sam has no way to jump to "Base Stats" or "Moves" without linearly reading through everything first.

**Casey (Distracted mobile user)**
- The filter bar overflows sideways at 390px (see P0 above) — Casey has to notice and perform an unexpected horizontal scroll just to reach the Generation filter, which most mobile visitors will simply never discover.
- The detail-page title clips for longer names like "Charizard" — zero `@media` queries exist in `PokemonDetail.css`, and a fixed 200×200px sprite circle eats nearly half the 390px viewport before the name column even starts.
- The open Type dropdown doesn't dismiss on an outside tap — on a small screen where an accidental tap-to-scroll is common, the panel stays stuck open over the content beneath it.
- A search typo hits a flat "No Pokémon found." dead end, no fuzzy-match suggestion or "clear search" nudge — costly for a low-patience, one-thumb user.

## Minor Observations

- The browser tab shows the Create-React-App default **"React App"**, not "Eli's Pokédex" — the intended title landed in a stray `<meta name="Eli's Pokedex" .../>` instead of an actual `<title>` tag, so it never shows in the tab, history, or bookmarks. Small, but it's the kind of detail a recruiter's open-tabs bar makes visible immediately.
- Bulbasaur's description (the very first Pokémon anyone will look at) renders the raw, uncleaned PokeAPI artifact "...grows with this POKéMON." instead of "Pokémon."
- Detector-confirmed: `PokemonDetail.css:72` animates `width` directly (`transition: width 0.5s ease` on the stat bars) instead of `transform`/`scaleX`, which causes layout thrash rather than a compositor-only animation — six stat rows repeat this per detail-page visit.
- Under throttled network, cards with resolved name/number/type badges still show a blank gap where the sprite belongs (no fixed aspect-ratio box or shimmer) — reads as broken rather than "loading."
- The same pill shape (`border-radius: 20px`) is reused for type badges, move tags, generation labels, and rarity toggle buttons — cohesive, but it also flattens the distinction between "a control you can click" and "a fact you're just reading" (the Moves list looks clickable but isn't).

## Questions to Consider

- If you deleted the red/dark palette and the monospace font, would anyone still recognize this as a Pokédex rather than a product catalog? What's one *interaction* — not a color — that only a Pokédex could have?
- The rarity filter is the one moment explicitly built to feel special — why does filtering to Legendary produce a grid of Mewtwo and Ho-Oh dressed in the exact same gray card as Weedle? What would it cost to let the *grid*, not just the detail page, carry the "this one's rare" feeling?
- If a recruiter timed how long it takes to select "Gen I + Gen III + Gen V" during a live demo, would that number be embarrassing?
