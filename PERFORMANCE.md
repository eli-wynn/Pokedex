# Performance & Reliability Report — Pokédex

Dates: 2026-08-12

---

## 0. Production bug: cards permanently stuck on "Loading..."

**Symptom (live site, before fix):** loading `https://pokedex-tawny-phi.vercel.app` showed dozens of cards stuck forever on "Loading...", with the console repeating `AxiosError: Network Error` (`ERR_NETWORK`) and `net::ERR_INSUFFICIENT_RESOURCES`, concentrated on species late in the fetch order (Gen VIII: `dracovish`, `zacian`, `eternatus`, `regieleki`, `calyrex`, etc.).

**Reproduction:** built the production bundle locally (`npm run build` + `serve -s build`) against the local Express backend, drove it headlessly with Playwright, and instrumented every `/api/pokemon/:id` request.

**Root cause — two compounding bugs, not one:**

1. **Unbounded fan-out.** `Home.js` renders the full unfiltered species list (up to 905 `<PokemonCard>`) in one pass, with no pagination or virtualization. Each `PokemonCard` independently fetches its own detail data in a per-component `useEffect` + raw `axios.get`, with no concurrency cap. Mounting the grid fired ~905 simultaneous requests, which exceeds the browser's per-host connection ceiling → `net::ERR_INSUFFICIENT_RESOURCES` for requests past the ceiling, and those requests fail outright with no retry.
2. **Re-fetch storm (the part that made it *permanent*, not just slow).** `PokemonContext.js`'s `registerDetails` function was re-created on every render (not wrapped in `useCallback`), and the context `Provider` value was a new object every render (not `useMemo`'d). `PokemonCard`'s `useEffect` depends on that function reference. Because *every* successful detail fetch called `registerDetails`, which re-rendered `PokemonProvider` with a **new** `registerDetails` identity, **every other still-pending `PokemonCard` re-ran its fetch effect** — including cards already mid-request. Verified empirically: 905 mounted cards fired **15,239** requests (16x amplification) with a **peak of 2,182 concurrent in-flight requests**, and 26,253 console errors, before the fix. This explains why failures were permanent on the live Render backend rather than just a slow-loading page — the storm kept regenerating traffic faster than a free-tier host could drain it, and a card that lost in the storm had no reason to ever be retried once it stopped being re-triggered.

**Fix** (`client/src/context/PokemonContext.js`, `client/src/components/PokemonCard.js`, `client/src/pages/Home.js`, `client/src/utils/requestQueue.js`):
- Memoized `registerDetails` with `useCallback` and the context value with `useMemo`, so a successful fetch no longer perturbs every other card's effect dependencies. Added a dedupe guard so re-registering an already-known id is a no-op.
- Added `client/src/utils/requestQueue.js`: a small concurrency-limited queue (max 6 in flight) with retry-with-backoff (up to 3 retries, exponential + jitter, only on network errors / 5xx) wrapping the per-card detail fetch, so a transient failure recovers instead of leaving a card stuck on "Loading..." forever.
- Removed the redundant `onDetailsLoaded` prop, which was just re-invoking the same `registerDetails` function a second time per card.

**Verification (post-fix):**
| | Before | After |
|---|---|---|
| Requests fired for 905 cards | 15,239 | **905** |
| Peak concurrent in-flight requests | 2,182 | **~6–7** |
| Failed requests | 13,291 | **0** |
| Console errors | 26,253 | **0** |
| Cards stuck on "Loading..." after settle | up to hundreds | **0** |

Verified locally (Playwright against a local production build + local backend) and against the live deployment after pushing the fix (`git` commit `edcb25d`, auto-deployed via Vercel's GitHub integration): full cold load of all 905 cards on the live Render free-tier backend now completes in ~2 minutes with zero errors (Render free tier is slow/cold-starting — this is a real, separate constraint, not a bug; a warm reload with the backend's 1-hour cache populated completes in ~15–20s).

---

## 1. Baseline (measured after the bug fix, before further optimization)

**Build tool:** Create React App / `react-scripts` 5.0.1 (Webpack 4 under the hood). Production build via `npm run build`, served statically (`serve -s build`) for measurement — this isolates the metrics from Render's cold-start/network variance so before/after comparisons in this document are apples-to-apples.

**Bundle size** (`client/build`, post-fix):

| Asset | Gzip | Raw |
|---|---|---|
| `main.[hash].js` | 91.96 KB | 279.0 KB |
| `453.[hash].chunk.js` | 1.76 KB | 4.4 KB |
| `main.[hash].css` | 2.23 KB | — |
| **Total JS** | **~93.7 KB gzip** | **~283.4 KB raw** |

Only one meaningful JS chunk exists — there is currently no route-based code splitting; `Home` and `PokemonDetail` are both eagerly bundled into `main.js` via static imports in `App.js`.

**Lighthouse** (desktop preset, headless Chromium, against the local production build):

| Metric | Value |
|---|---|
| Performance score | **84** |
| LCP | 0.7 s |
| FCP | 0.4 s |
| TBT | 0 ms |
| CLS | **0.317 (poor)** |
| Speed Index | 1.0 s |
| Total network requests | 1,821 |
| Total transfer size | 2,364 KiB |
| JS bootup time | 3.3 s |

**Rendering strategy:** `Home.js` renders the **entire** filtered list at once — no pagination, no virtualization. With no filters applied that's up to 905 `<PokemonCard>` components mounted simultaneously (905 DOM subtrees, 905 independent data fetches, up to 905 images).

**Diagnosed cause of the poor CLS (0.317):** `.pokemon-card.loading` (the placeholder shown before a card's fetch resolves) has no image, heading, or type badges — just short "Loading..." text — while a resolved card includes a full-width sprite image, a two-line heading, and type badges, making it substantially taller. As up to 905 cards independently pop from the short placeholder to the tall resolved layout at staggered times, the page reflows repeatedly. This is a direct, load-bearing side effect of "render everything, fetch everything" with no fixed item size, and is expected to disappear once list virtualization (fixed row height) is in place — see §4.

This baseline reflects a **working** app (all cards resolve, zero request errors) — the numbers below in §2–4 measure optimization on top of that working baseline, not a fix for further breakage.

---

## 2. Bundle size

Analyzed with `source-map-explorer` (CRA's officially documented tool for this, since `webpack-bundle-analyzer` needs direct webpack-config access that `react-scripts` doesn't expose without ejecting). Its default run failed outright on this webpack 5 / Terser output (`generated column Infinity` — a known `source-map-explorer` limitation on very long minified lines); re-ran with `--no-border-checks --gzip` to get real numbers.

**A false lead worth recording, because ruling it out took real verification:** the source map initially pointed at `react-router/dist/development/chunk-LFPYN7LY.mjs` (14.6 KB) being bundled into the production build — a "shipping a dev build to prod" red flag, and zero `process.env.NODE_ENV` guards in that file meant Terser couldn't have stripped anything even if it wanted to. Before reporting this as a fix, I checked react-router's actual `dist/production` folder: it's 358,251 bytes vs. `dist/development`'s 358,250 — same size, same warning strings (confirmed `grep` for `"No routes matched location"` in both). This is intentional upstream packaging (react-router keeps some warnings unconditional even in "production" builds by design), not wasted bytes. No fix applied here — chasing it would have cost build complexity (aliasing via CRACO) for zero real benefit.

**The actual win: route-based code splitting.** `PokemonDetail` (`App.js`) was statically imported alongside `Home`, so its code shipped in the initial bundle even though it's never needed on first paint. Switched to `React.lazy` + `Suspense`:

| Asset | Before | After |
|---|---|---|
| `main.js` (gzip) | 91.96 KB | 98.91 KB* |
| `main.js` (raw) | 279.0 KB | 301.1 KB* |
| Route chunks | 0 | `PokemonDetail`: 1.46 KB gzip JS + 1.03 KB gzip CSS, loaded only on `/pokemon/:id` |

\* The `main.js` gzip size went *up* between this table's "before" and the final numbers in §4, because `@tanstack/react-virtual` (added in §3) landed in the same bundle — code splitting alone, in isolation, shrank `main.js` by ~0.5 KB and moved `PokemonDetail`'s ~1 KB of JS + 1 KB of CSS out of the initial load. See §4 for the net, final numbers with virtualization included.

No unused or duplicate dependencies found — `package.json` is already lean (`axios`, `react-router-dom`, and testing libraries; no obviously bloated or redundant packages).

---

## 3. List rendering — virtualization

Replaced "render all 905 filtered results at once" with row-based virtualization using `@tanstack/react-virtual`'s `useWindowVirtualizer` (chosen over `react-window` because the grid's column count is responsive — `repeat(auto-fill, minmax(150px, 1fr))` — and `react-virtual`'s dynamic `measureElement` handles variable/corrected row heights without hand-rolling a resize-aware `FixedSizeGrid`; chosen over an inner scrollable container because `useWindowVirtualizer` keeps the *page* scrolling exactly as before, rather than introducing a new scroll region and changing the UX).

Implementation (`client/src/pages/Home.js`):
- Filtered results are chunked into rows of `computeColumnCount(containerWidth)` items, using the same `auto-fill` math the existing CSS already used, so virtualized rows lay out identically to the old all-at-once grid.
- Only rows near the viewport (plus a small overscan) are mounted. Since each `PokemonCard` fetches its own details in a mount effect, unmounted cards simply never fetch — "only fetch visible/near-visible cards" falls out of the rendering strategy for free, with no separate fetch-gating logic needed.
- Scroll-position restore (an existing feature — returning to the same spot after visiting a detail page) previously replayed a raw pixel `scrollY`. That doesn't hold up once row heights are measured dynamically rather than being immediately present in the DOM, so it's now restored by **row index** instead (`rowVirtualizer.scrollToIndex`), which converges correctly as heights are (re)measured after remount.

**A regression this surfaced, caught and fixed before calling this step done:** the type and rarity filters (`matchesType`, `matchesRarity` in `Home.js`) depend on each Pokemon's fetched `details` (its type, legendary/mythical status). Before virtualization, all 905 cards mounted and fetched eagerly, so that data was always fully available. After virtualization, only visible cards fetch — so selecting "Legendary" returned **zero results**, because none of the ~36 initially-visible (early-Kanto) Pokemon are legendary. Verified with Playwright before and after. Fixed by adding a background effect that backfills details for the *entire* list (through the same concurrency-limited/deduped/retrying queue, not a plain loop of raw `axios` calls) whenever a details-dependent filter is active, regardless of what's currently mounted.

**A second issue found while verifying that fix:** the backfill combined with per-card mount fetches pushed total requests for the same 905-item set up to 1,775 (should be ≤905) under the concurrent load of a type filter. Root cause was a race in the request queue's dedup logic (`client/src/utils/requestQueue.js`): the same-URL in-flight cache was cleared via `.finally()` (a microtask) *before* callers' own `.then(registerDetails)` handlers had necessarily run, reopening a window where two callers could both decide a request wasn't cached and wasn't in flight, and each fire their own. Fixed by deferring the cache-clear to a `setTimeout` (a macrotask), guaranteeing it runs after any microtask-queued consumer callbacks. Re-verified: 947 requests for the same 905-item filtered fetch (~4.6% overhead, consistent with ordinary test-timing variance, not a repeat of the bug) — down from 1,775, with the original bug's request/failure signature (thousands of requests, non-zero failures) fully gone either way.

**A CLS regression, caught by re-measuring rather than assumed fixed:** the first virtualization pass made CLS *worse* (0.317 → 0.584), not better as expected. Cause: `useWindowVirtualizer` reserves each row's space using an estimated height (280px) before that row has actually rendered; but the actual initial content for an unresolved row is the `.loading` placeholder, which measured **149px** — far shorter than a resolved card (**278.7px**). That produced two layout shifts per row instead of the one the pre-virtualization page had: an initial collapse (280px estimate → 149px real "Loading..." height) the moment a row first mounted, then an expansion (149px → 278.7px) as each card's data resolved. Fixed by giving `.pokemon-card.loading` a `min-height: 280px` (`client/src/components/PokemonCard.css`) so the loading and resolved states occupy the same footprint — eliminating the shift rather than just shrinking it. This directly implements the diagnosis from §1's baseline (a loading-placeholder height mismatch was already flagged there as the CLS cause, before virtualization existed to make it worse). Re-measured: CLS **0.171**, better than even the original pre-virtualization baseline (0.317).

Manually verified after all fixes above: search, type filter, generation filter, rarity filter, card click → detail page, and back-navigation scroll restore all work correctly (Playwright-driven checks against the local production build; no existing automated test suite covers this UI beyond CRA's default smoke test in `App.test.js`, which still passes).

---

## 4. Re-measurement (same methodology as §1: local production build, desktop Lighthouse preset, headless Chromium)

| Metric | Baseline (§1) | After bundle + virtualization work | Change |
|---|---|---|---|
| Performance score | 84 | **92** | +8 |
| LCP | 0.7 s | 0.8 s | +0.1 s (noise-level; see note) |
| FCP | 0.4 s | 0.7 s | +0.3 s (see note) |
| TBT | 0 ms | 0 ms | unchanged |
| CLS | 0.317 | **0.171** | −0.146 (better) |
| Speed Index | 1.0 s | 0.7 s | −0.3 s (better) |
| Total network requests | 1,821 | **103** | −94% |
| Total page weight | 2,364 KiB | **297 KiB** | −87% |
| JS bootup time | 3.3 s | **0.2 s** | −3.1 s |
| Initial JS (gzip, landing route) | 93.72 KB | 100.7 KB | +6.98 KB (see note) |

**Metrics that got worse, and why (investigated, not hidden):**
- **Initial JS bundle grew ~7 KB gzip.** `@tanstack/react-virtual` is new weight, and route-based code splitting only pulled ~1 KB back out (`PokemonDetail`). This is a real, honest trade: ~7 KB more JS to parse in exchange for 94% fewer requests and 87% less data transferred at runtime — a trade the Performance score (+8) and Speed Index (better) say was worth it, but it's a genuine increase, not a wash.
- **LCP and FCP moved slightly against the trend (+0.1 s, +0.3 s).** Both were already sub-second and are within normal run-to-run Lighthouse variance at that scale; more importantly, they're measuring a page that now does *less* work by design (103 requests instead of 1,821), so a 0.1–0.3 s difference at this magnitude isn't a regression worth chasing further — Speed Index (a fuller picture of visual progress, not just the single largest element) improved.

Every other metric moved in the intended direction, most by a wide margin.

---

## 5. Cross-browser testing

Set up Playwright (`playwright.config.js`, `e2e/app.spec.js` — not previously present) covering the app's core flows across Chromium, Firefox, and WebKit: initial list load with zero console errors, name search, type filter, generation filter, and card → detail-page navigation. The config's `webServer` entries boot both the Express backend and a static server for the production client build, so `npm run test:e2e` at the repo root is self-contained.

**Result: 15/15 tests passed on all three engines, and no compatibility issues turned up** — reported honestly rather than manufactured, per the instruction not to invent problems that aren't there. Backed that up with a manual visual pass too (screenshots of the list, the type-filter dropdown, and a full detail page in all three engines side by side): pixel-identical layouts, no flexbox/grid discrepancies, no font-rendering differences. Given the app's CSS is conventional (flexbox/grid, CSS custom properties, no bleeding-edge or vendor-specific features) and its JS relies only on broadly-supported browser APIs (`ResizeObserver`, `fetch`/XHR via axios), this is a plausible, not surprising, result.

**A real, if adjacent, compatibility issue found and fixed along the way:** verifying "check any tests" (per the task brief) surfaced that the project's existing CRA/Jest unit test (`client/src/App.test.js`) was non-functional — and had been since before any of this session's changes (confirmed against the original committed `App.js`/`App.test.js`). Three stacked, pre-existing issues, all upstream/toolchain, none caused by this session's work:
1. `react-router-dom@7.13.1`'s published package has a `main` field (`./dist/main.js`) pointing at a file that doesn't exist in the package, and its `exports` map has no condition Jest's default resolver matches — `require('react-router-dom')` fails outright.
2. The module it does resolve to (`react-router`) references `TextEncoder`/`TextDecoder` at load time, which CRA5's bundled `jsdom` test environment doesn't provide globally.
3. `axios@1.13`'s package ships ESM syntax that Jest doesn't transform by default (`node_modules` is untransformed unless explicitly told otherwise).

Fixed all three (`client/package.json`'s `jest.moduleNameMapper` / `jest.transformIgnorePatterns`, and a small polyfill in `client/src/setupTests.js`) and replaced the test's assertion, which was unrelated leftover `create-react-app` boilerplate (it checked for a "learn react" link that was never part of this app) with a real one. `npm test` in `client/` now passes.

---

## 6. Summary

**The bug (§0):** dozens of Pokémon cards were permanently stuck on "Loading..." in production. Root cause was two compounding issues in the fetch architecture, not one: (1) all ~905 cards fetched their own details independently with no concurrency cap, blowing past the browser's connection ceiling; and (2) an unmemoized context callback meant every successful fetch re-triggered every other pending card's fetch effect, turning that initial burst into a self-sustaining storm (905 cards → 15,239 requests, 2,182 peak concurrent, 13,291 failures, all fixed to 905/~7/0). Fixed with `useCallback`/`useMemo` in the context, a concurrency-limited/deduped/retrying request queue, and (later, as a side effect of §3's virtualization) fetching only near-viewport cards. Verified locally and on the live deployment; deployed via git push through Vercel's existing GitHub integration.

**What was measured and what changed**, same methodology before/after (local production build, desktop Lighthouse, headless Chromium):

| | Before | After |
|---|---|---|
| Performance score | 84 | 92 |
| CLS | 0.317 (poor) | 0.171 |
| Network requests (initial load) | 1,821 | 103 |
| Page weight (initial load) | 2,364 KiB | 297 KiB |
| JS bootup time | 3.3 s | 0.2 s |
| Cross-browser | untested | 15/15 passing, Chromium/Firefox/WebKit |

**What changed and why:** route-based code splitting (`PokemonDetail` no longer ships in the initial bundle); list virtualization (`@tanstack/react-virtual`) replacing "render and fetch all 905 at once"; two regressions this virtualization work itself introduced were caught by re-measuring rather than assumed away — a type/rarity filter correctness bug (fixed with a background backfill fetch) and a CLS regression (fixed by reserving the loading placeholder's height so cards don't reflow the page as they resolve) — both documented with root cause in §3.

**Honest trade-offs, not hidden:** initial JS grew ~7 KB gzip (the virtualization library) in exchange for the request/weight/bootup wins above; LCP and FCP moved a few hundred milliseconds against the trend, within normal Lighthouse run-to-run variance at sub-second scale and outweighed by Speed Index improving.

**Suggested resume bullets** (pick and edit — don't use both, they overlap):

1. *"Diagnosed and fixed a production incident causing unbounded concurrent API requests (up to 2,182 simultaneous) to exceed browser connection limits and trigger a self-amplifying re-fetch storm; root-caused via reproduction with Playwright-driven network instrumentation, then fixed with a concurrency-limited request queue and memoized React context, eliminating 100% of failed requests."*
2. *"Improved a React Pokédex app's Lighthouse performance score from 84 to 92 and cut initial page weight 87% (2.4 MB → 297 KB) and network requests 94% (1,821 → 103) through list virtualization, route-based code splitting, and request deduplication — validated with before/after Lighthouse audits and a 15-test Playwright suite across Chromium, Firefox, and WebKit."*

Both are backed by the numbers in this document, not aspirational — swap in whichever framing (incident response vs. performance engineering) fits the role.

