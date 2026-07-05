# Codebase Framework — AiLMS

A prescriptive guide for designers, engineers and agents working in **AiLMS**, a
logistics management system. Read this before adding pages, components, hooks, or
data feeds.

> **Status:** **mock-first**. There is **no backend, database, or ORM** yet. All
> data is static JSON in `public/mock/`, consumed through TanStack Query hooks.
> Auth and real-time transport are not yet decided; conventions below assume
> that state. Update this line as decisions land.

> New here? See `SCAFFOLD.md` for which files are throwaway examples vs.
> permanent framework infrastructure.

---

## 1. Stack

| Layer                 | Choice                                               | Notes                                                                                     |
| --------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Framework             | **Next.js** (App Router)                             | All routing under `src/app/`                                                              |
| UI runtime            | **React 19** + TypeScript                            | Most components are `"use client"` unless server components are intentional                |
| Styling               | **Tailwind CSS v4** (CSS-variable theme)             | No `tailwind.config.js`; tokens defined in `src/app/globals.css` `@theme` block           |
| Data fetching / cache | **TanStack Query**                                   | One client instance in `src/lib/query-provider.tsx`                                       |
| Global client state   | **Zustand** (with `persist` middleware)              | One store per domain; cross-route stores in `src/hooks/shared/`                           |
| Animation             | **Motion** (framer-motion)                           | Import from `motion/react`                                                                 |
| Icons                 | **lucide-react**                                     | The **one** icon library. Do not introduce a second.                                      |
| Tables                | _none yet_                                           | Add TanStack React Table only if a real data-grid need appears                            |
| Class merging         | `cn()` in `src/lib/utils.ts` (clsx + tailwind-merge) | Always use `cn()` instead of string concat                                                |
| Tests                 | **Vitest** + **Playwright** + **Storybook**          | Full pyramid (see §10)                                                                     |

**Mock-first note:** there is no backend, database, or ORM. All data is static
JSON in `public/mock/`. See the swap path in §5.

---

## 2. Folder layout

```
src/
├── app/                          # Routes (App Router)
│   ├── layout.tsx                # Root: providers + app shell
│   ├── globals.css               # Tailwind v4 @theme tokens
│   ├── page.tsx                  # Home overview (thin)
│   ├── loading.tsx / error.tsx   # Route-level fallbacks
│   ├── components/               # Home-route components
│   ├── hooks/                    # Home-route data hooks
│   ├── lib/                      # Home-route domain logic, types, pure fns
│   └── api/                      # (reserved) API routes if/when a backend lands
├── components/
│   ├── ui/                       # Reusable design-system primitives (+ stories)
│   ├── layout/                   # App shell
│   └── shared/                   # Cross-route components (used by ≥2 routes)
├── hooks/
│   ├── shared/                   # Cross-route global-state stores + hooks
│   └── *.ts                      # Generic hooks
├── lib/
│   ├── query-provider.tsx        # TanStack Query client setup
│   └── utils.ts                  # cn() and small helpers
public/mock/                      # JSON fixtures consumed by hooks
e2e/                              # Playwright specs
```

> As of scaffolding there is a single route (`/`). New routes get their own
> folder under `src/app/<route>/` with `components/`, `hooks/`, `lib/`.

### Naming

- **Files & folders:** kebab-case — including component files (`fleet-summary-grid.tsx`).
- **Components:** PascalCase exports.
- **Hooks:** `useThing` exports in `use-thing.ts`.
- **Query keys:** exported `UPPER_SNAKE` constants colocated with the hook
  (`FLEET_SUMMARY_QUERY_KEY = ["fleet-summary"] as const`).

### Where does a new file go?

| What you're adding            | Location                                           |
| ----------------------------- | -------------------------------------------------- |
| Reusable visual primitive     | `src/components/ui/<name>.tsx` (+ stories)         |
| Route-specific component      | `src/app/<route>/components/<name>.tsx`            |
| Cross-route feature component | `src/components/shared/<name>.tsx`                 |
| Data hook for a route         | `src/app/<route>/hooks/use-<thing>.ts`             |
| Domain logic / types          | `src/app/<route>/lib/<thing>.ts`                   |
| Cross-route store             | `src/hooks/shared/use-<thing>-store.tsx`           |
| Mock data                     | `public/mock/<thing>.json`                         |

> **Two-bucket rule:** every component is either route-specific (under that
> route's `components/`) or cross-route (`src/components/shared/` or `ui/`). Do
> not introduce other top-level feature folders under `src/components/`.

---

## 3. Routing

App Router; one folder per route.

- `page.tsx` is **thin** — metadata/params here; composes `./components/`
  directly. Add a `<route>-view.tsx` only when composition is genuinely complex.
- A route owns its `components/`, `hooks/`, `lib/`. Do not reach into another
  route's folder; promote to `shared/`.
- Stub routes use `<RouteStub />` from `src/components/shared/`.
- Add `loading.tsx` / `error.tsx` siblings for full-surface fallbacks (§9).

### Target routes

- `/` — **Home overview** (root; the only implemented route). No redirect.

No persona/role gating yet (single implicit user). When personas are introduced,
register + gate routes in `src/components/shared/navbar.tsx` and add a persona
store under `src/hooks/shared/`.

---

## 4. Providers (root layout)

`src/app/layout.tsx`, outermost → innermost:

```tsx
<QueryProvider>          // TanStack Query cache
  <AppShell>{children}</AppShell>
</QueryProvider>
```

**Rule:** add a new provider **only** if state is needed by ≥2 unrelated routes.
Otherwise prefer a feature-scoped Zustand store or local state.

---

## 5. Data flow (mock-first)

1. JSON fixture lives in `public/mock/<thing>.json`.
2. A hook in the relevant `hooks/` folder wraps `fetch()` in a TanStack query.
3. UI components consume the hook; never call `fetch` directly.

> **Swap path:** when a real backend lands, replace the fetch path/body inside
> the standalone `fetchX` function. Hook consumers do not change.

### Required hook shape

```ts
export const FLEET_SUMMARY_QUERY_KEY = ["fleet-summary"] as const;
const FIXTURE_PATH = "/mock/fleet-summary.json";

export async function fetchFleetSummary(): Promise<FleetSummary> {
  const res = await fetch(FIXTURE_PATH);
  if (!res.ok) throw new Error(`Failed to load fleet summary (${res.status})`);
  return fleetSummarySchema.parse(await res.json()); // validate at the boundary
}

export function useFleetSummary(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: FLEET_SUMMARY_QUERY_KEY,
    queryFn: fetchFleetSummary,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchInterval: options?.refetchInterval, // see §6
  });
}
```

(See `src/app/hooks/use-fleet-summary.ts` for the working reference.)

**Rules:**

- Export the query key as a typed constant — needed for cache invalidation.
- Keep `fetchX` standalone (testable, swappable).
- Validate JSON shape at the boundary with **Zod** for any hook backing a
  user-visible decision. Domain types live in `<route>/lib/`.
- **Do not** call `fetch` from components or `lib/` modules.

---

## 6. Real-time updates

Until a streaming transport is chosen, **live data uses polling** via TanStack
Query.

- Use `refetchInterval` on the hook, not `setInterval` in components.
- Choose cadences per feed (fast activity feeds poll often; slow KPIs rarely;
  static reference data not at all).
- Polling is tab-visibility gated (`refetchIntervalInBackground: false`, set as
  the client default in `query-provider.tsx`).

When SSE/WebSockets arrive, encapsulate the subscription inside the same hook and
keep the consumer API unchanged.

---

## 7. Client state & persistence

Three buckets, in order of preference:

1. **Local component state** — single-component (open/closed, hover).
2. **Feature-scoped global store** — shared within one route.
3. **Cross-route global store** — only when ≥2 routes need it; lives in
   `src/hooks/shared/`.

### Persistence policy (Zustand `persist`, localStorage)

- ✅ persist: user preferences, filter selections, UI prefs (density, collapsed panels)
- ❌ do not persist: transient nav/drill-in stacks, hover/focus, fetched data

```ts
export const usePreferencesStore = create<State>()(
  persist((set) => ({ /* ... */ }), { name: "ailms.preferences", version: 1 }),
);
```

Store `name`s are namespaced `ailms.<domain>`. Bump `version` + add `migrate`
when the persisted schema changes. Reference store:
`src/hooks/shared/use-preferences-store.tsx`.

### URL state

URL params are **not** the persistence layer by default. Adopt them only when a
flow must be linkable/shareable; document the param contract in the route's `lib/`.

---

## 8. Styling & design tokens

- **Tailwind CSS v4**. No `tailwind.config.js` — theme lives in the `@theme`
  block of `src/app/globals.css`. Add new tokens **there**.
- Prefer semantic tokens over raw scales. Do not invent ad-hoc colors.
- Compose classes with `cn()`.
- Fonts loaded via `next/font` in the root layout (Geist Sans/Mono). No new
  fonts without design approval.

### Token vocabulary

- **Surfaces:** `surface`, `surface-raised`, `surface-sunken`
- **Foreground:** `fg-primary`, `fg-secondary`, `fg-muted`
- **Borders:** `border-subtle`, `border-strong`
- **Brand:** `brand`, `brand-fg`
- **Logistics status:** `status-intransit`, `status-delivered`,
  `status-delayed`, `status-pending`

Dark theme re-maps the same semantic tokens under `.dark` on `<html>`.

---

## 9. Loading & error UX

- **Component-level (preferred for widgets):** render a skeleton on `isPending`
  and an inline error with a `refetch()` retry on `isError`. Required for any
  tile/card backed by a hook. Reference: `fleet-summary-grid.tsx`.
- **Route-level (preferred for full surfaces):** `loading.tsx` (skeleton page) +
  `error.tsx` (with `reset()`) next to `page.tsx`.

**Never silently render empty UI on error.**

---

## 10. Testing

| Layer                | Tool           | Required for                                                    |
| -------------------- | -------------- | --------------------------------------------------------------- |
| Visual / interaction | **Storybook**  | Every `src/components/ui/*` and any non-trivial feature component |
| Unit                 | **Vitest**     | All pure functions in `lib/` and all hooks                      |
| E2E                  | **Playwright** | Critical journeys per surface                                   |

Conventions:

- Colocate: `foo.ts` ↔ `foo.test.ts`; stories: `foo.tsx` ↔ `foo.stories.tsx`.
- Mock data hooks at the boundary (`vi.mock("./hooks/use-fleet-summary")`)
  rather than mocking `fetch`.
- Playwright specs live in `e2e/`; use route-level fixtures for deterministic
  mock data.

Commands: `npm test` (Vitest), `npm run test:e2e` (Playwright),
`npm run storybook`.

---

## 11. Notable patterns to reuse

- **Data hook shape** — query-key constant + standalone `fetchX` + `useQuery`
  with Zod boundary validation. See `use-fleet-summary.ts`. Reuse for every feed.
- **Hook-backed widget** — skeleton + inline-error-with-retry. See
  `fleet-summary-grid.tsx`.
- **KPI tile** — `StatTile` primitive (`src/components/ui/stat-tile.tsx`) with
  semantic `tone` props mapped to status tokens.
- **Cross-route persisted store** — `usePreferencesStore` (Zustand + `persist`,
  namespaced `ailms.*`).
- **Route stub** — `<RouteStub />` for not-yet-built surfaces.

---

## 12. Recipes

### Add a new route

1. `src/app/<route>/page.tsx` — thin entry composing `./components/`.
2. Optional `loading.tsx`, `error.tsx` siblings.
3. Route-scoped `hooks/`, `lib/`, `components/` (kebab-case files).
4. Register the route in `src/components/shared/navbar.tsx`.

### Add a new component

1. Decide route-specific vs cross-route (§2 table).
2. Build with Tailwind tokens + `cn()`; expose semantic props.
3. Reusable components: add `*.stories.tsx` covering each prop state.
4. Unit-test non-trivial logic.

### Add a new data feed

1. Define the type in `src/app/<route>/lib/<thing>-types.ts` (+ Zod schema).
2. Drop fixture at `public/mock/<thing>.json`.
3. Implement `use<Thing>` (§5 shape) with an appropriate `refetchInterval` (§6).
4. Consume from a component; render skeleton + error per §9.
5. Unit tests for the hook + lib.

### Add cross-route persistent state

1. Create store in `src/hooks/shared/use-<thing>-store.tsx`.
2. Wrap with Zustand `persist` (versioned `ailms.<domain>` name).
3. Document the persisted schema in a comment near the store.

---

## 13. Open questions (TBD)

Do not invent answers in PRs without first updating this doc:

- Backend transport (Next.js API routes vs external service vs Server Actions).
- Authentication and session/role resolution; persona gating.
- Streaming transport for live data (SSE/WebSocket) if polling proves insufficient.
- URL deep-linking contract for navigation state.
- Real logistics domain model (shipments, routes, carriers, warehouses) — the
  scaffolded `fleet-summary` feed is a placeholder (see `SCAFFOLD.md`).
