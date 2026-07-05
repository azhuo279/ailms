# Codebase Framework (Template)

A prescriptive guide for designers, engineers and agents working in `<PROJECT_NAME>`. Read this before adding pages, components, hooks, or data feeds.

> **How to use this template.** This is a generalized, reusable version of a per-project codebase framework. Search for `<CHOOSE: ...>`, `<PROJECT_NAME>`, and `> ⚠️ CONFIRM` markers and resolve each one before treating this doc as authoritative for your project. Once resolved, delete this callout.

> **Status:** `<CHOOSE: mock-first | backend-integrated | hybrid>`. If mock-first, backend, auth, and real-time transport are not yet decided and conventions below assume that state. Update this line as decisions land.

---

## 1. Stack

| Layer                 | Choice                                               | Notes                                                                                                                    |
| --------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------- | ----------------------------------- | ------------------------------------------------------------------- |
| Framework             | **Next.js** (App Router)                             | All routing under `src/app/`                                                                                             |
| UI runtime            | **React** + TypeScript                               | Most components are `"use client"` unless server components are intentional                                              |
| Styling               | **Tailwind CSS v4** (latest; CSS-variable theme)     | No `tailwind.config.js`; tokens defined in `src/app/globals.css` `@theme` block. Always use the latest Tailwind release. |
| Data fetching / cache | `<CHOOSE: TanStack Query                             | SWR                                                                                                                      | RTK Query | ...>`                               | One client instance in `src/lib/query-provider.tsx` (or equivalent) |
| Global client state   | `<CHOOSE: Zustand                                    | Redux Toolkit                                                                                                            | Jotai     | ...>` (with persistence middleware) | One store per domain; see `src/hooks/shared/`                       |
| Animation             | `<CHOOSE: Motion (framer-motion)                     | CSS transitions                                                                                                          | ...>`     |                                     |
| Icons                 | `<CHOOSE: icon library>`                             | > ⚠️ CONFIRM per project. Pick **one** icon library and do not introduce a second.                                       |
| Tables                | `<CHOOSE: TanStack React Table                       | AG Grid                                                                                                                  | native    | ...>`                               | Only if the app has data-grid needs                                 |
| Class merging         | `cn()` in `src/lib/utils.ts` (clsx + tailwind-merge) | Always use `cn()` instead of string concat                                                                               |
| Tests                 | `<CHOOSE: Vitest                                     | Jest>`+ **Playwright** +`<CHOOSE: Storybook                                                                              | none>`    | Full pyramid recommended (see §10)  |

> ⚠️ CONFIRM: If this project is **mock-first**, state here that there is **no backend, database, or ORM** and that all data is static JSON in `public/mock/`. Delete this note once the data stance is settled.

---

## 2. Folder layout

```
src/
├── app/                          # Routes (App Router)
│   ├── layout.tsx                # Root: providers + app shell
│   ├── globals.css               # Tailwind v4 @theme tokens
│   ├── <route>/
│   │   ├── page.tsx              # Route entry (thin)
│   │   ├── components/           # Route-specific components
│   │   ├── hooks/                # Route-specific data hooks
│   │   └── lib/                  # Route-specific domain logic, types, pure fns
│   └── api/                      # (reserved) Next.js API routes if/when a backend lands
├── components/
│   ├── ui/                       # Reusable design-system primitives (+ stories if used)
│   ├── layout/                   # Navbar, app shell, route stubs
│   └── shared/                   # Cross-route components (anything used by ≥2 routes)
├── hooks/
│   ├── shared/                   # Cross-route global-state stores + hooks
│   └── *.ts                      # Generic hooks (e.g., use-drawer-stack)
├── lib/
│   ├── query-provider.tsx        # Data-fetching client setup
│   └── utils.ts                  # cn() and small helpers
public/mock/                      # JSON fixtures consumed by hooks (mock-first projects)
docs/                             # Architecture, PRD, research
```

### Naming

- **Files & folders:** kebab-case — including component files (`action-feed-card.tsx`, not `ActionFeedCard.tsx`).
- **Components:** PascalCase exports.
- **Hooks:** `useThing` exports in `use-thing.ts`.
- **Query keys:** exported `UPPER_SNAKE` constants colocated with the hook (`KPIS_QUERY_KEY = ["kpis"] as const`).

### Where does a new file go?

| What you're adding            | Location                                           |
| ----------------------------- | -------------------------------------------------- |
| Reusable visual primitive     | `src/components/ui/<name>.tsx` (+ stories if used) |
| Route-specific component      | `src/app/<route>/components/<name>.tsx`            |
| Cross-route feature component | `src/components/shared/<name>.tsx`                 |
| Data hook for a route         | `src/app/<route>/hooks/use-<thing>.ts`             |
| Domain logic / types          | `src/app/<route>/lib/<thing>.ts`                   |
| Cross-route store             | `src/hooks/shared/use-<thing>-store.tsx`           |
| Mock data                     | `public/mock/<thing>.json`                         |

> **Two-bucket rule:** every component is either route-specific (lives under that route's `components/`) or cross-route (lives in `src/components/shared/` or `src/components/ui/`). Do not introduce other top-level feature folders under `src/components/`.

---

## 3. Routing

App Router; one folder per route. Conventions:

- `page.tsx` should be **thin** — keep page-level concerns (metadata, params parsing) here. It typically composes a small number of components from `./components/` directly; do not introduce a wrapper component just to re-export the page body. (A separate `<route>-view` component is fine when composition is genuinely complex, but it is not required.)
- A route owns its `components/`, `hooks/`, and `lib/` folders. Do not reach into another route's folder; promote to `src/components/shared/`, `src/hooks/shared/`, or `src/lib/` instead.
- Stub routes use a shared `<RouteStub />` from `src/components/shared/`.
- Route-level loading and error UX: add `loading.tsx` and `error.tsx` siblings to `page.tsx` for full-surface fallbacks (see §9).

### Target routes

> ⚠️ CONFIRM: List this project's canonical routes here, and note any that are persona/role-gated, plus the root redirect target (e.g. `/` → `/home`). Mark any legacy routes that new work should not build against.

---

## 4. Providers (root layout)

`src/app/layout.tsx` wraps providers from outermost to innermost. A typical shape:

```tsx
<QueryProvider>
  {" "}
  // Data-fetching cache
  {/* <CHOOSE: auth/session, theme, feature-scoped global providers> */}
  <AppShell>{children}</AppShell>
</QueryProvider>
```

**Rule:** Add a new provider **only** if state is needed by ≥2 unrelated routes. Otherwise prefer a feature-scoped global store or local state.

---

## 5. Data flow

### Current (mock-first)

1. JSON fixture lives in `public/mock/<thing>.json`.
2. A hook in the relevant `hooks/` folder wraps `fetch()` in a query.
3. UI components consume the hook; never call `fetch` directly.

> **Swap path:** when a real backend lands, replace the fetch path / body inside `fetchX` (or the query fn). Consumers of the hook do not change. This is the whole point of keeping `fetchX` standalone.

### Required hook shape

```ts
export const KPIS_QUERY_KEY = ["kpis"] as const;
const KPI_FIXTURE_PATH = "/mock/kpis.json";

export async function fetchKpis(): Promise<Kpi[]> {
  const res = await fetch(KPI_FIXTURE_PATH);
  if (!res.ok) throw new Error(`Failed to load KPIs (${res.status})`);
  return (await res.json()) as Kpi[];
}

export function useKpis(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: KPIS_QUERY_KEY,
    queryFn: fetchKpis,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchInterval: options?.refetchInterval, // see §6
  });
}
```

> ⚠️ CONFIRM: The snippet above assumes TanStack Query. If you chose a different data-fetching library in §1, adapt the hook shape to its API but keep the same three rules below.

**Rules:**

- Always export the query key as a typed constant — needed for cache invalidation.
- Keep `fetchX` standalone (testable, swappable when an API endpoint replaces the fixture).
- Validate the JSON shape at the boundary (Zod or hand-rolled type guard) for any hook backing user-visible decisions. Domain types live in `<route>/lib/`.
- **Do not** call `fetch` from components or `lib/` modules.

### Adding a new data feed

1. Create `public/mock/<thing>.json` matching a TS type in `src/app/<route>/lib/<thing>-types.ts`.
2. Create `src/app/<route>/hooks/use-<thing>.ts` following the shape above.
3. Consume from a component. When the backend lands, replace the fetch path / body — consumers do not change.

---

## 6. Real-time updates

Until a streaming transport is chosen, **live data uses polling** via the data-fetching library.

- Use `refetchInterval` on the hook, not `setInterval` in components.
- Choose cadences deliberately per feed (fast-moving activity feeds poll more often than KPI tiles; static reference data does not poll at all).
- Gate polling on tab visibility (e.g. TanStack's `refetchIntervalInBackground: false` default).

If/when SSE or WebSockets are introduced, encapsulate the subscription inside the same hook and keep the consumer API unchanged.

---

## 7. Client state & persistence

Three buckets, in order of preference:

1. **Local component state** — for anything single-component (open/closed, hover).
2. **Feature-scoped global store** — for shared state within one route (e.g., drawer stack). Stored in `src/app/<route>/hooks/` or `src/hooks/`.
3. **Cross-route global store** — only when ≥2 routes need it. Lives in `src/hooks/shared/`.

### Persistence policy

Use your state library's persistence middleware (`localStorage`) for state the user expects to survive a reload:

- ✅ persist: user preferences, filter selections, UI prefs (collapsed panels, density)
- ❌ do not persist: transient drill-in/navigation stacks, hover/focus, fetched data (the data-fetching cache owns this)

Pattern (Zustand example — adapt to your chosen library):

```ts
export const useThingStore = create<State>()(
  persist(
    (set) => ({
      /* ... */
    }),
    { name: "<PROJECT_NAME>.thing", version: 1 },
  ),
);
```

Bump `version` and supply a `migrate` when the schema changes.

### URL state

URL params are **not** the persistence layer by default. Adopt them only when a flow needs to be linkable/shareable; document the param contract in the route's `lib/`.

---

## 8. Styling & design tokens

- Uses **Tailwind CSS v4** (always the latest version). No `tailwind.config.js` — the theme is defined via the CSS `@theme` block.
- All color/spacing/radius/shadow tokens live in `src/app/globals.css` under `@theme`. **Add new tokens there**, not in component files.
- Prefer semantic tokens (e.g. `bg-surface`, `text-fg-primary`, `border-subtle`) over raw scales. Do not invent ad-hoc colors — extend the token set.
- Compose classes with `cn()`.
- Fonts are loaded via `next/font` in the root layout. Do not import additional fonts without design approval.

> ⚠️ CONFIRM: Document this project's specific token vocabulary (semantic color/spacing names, any domain-specific palette conventions) here.

---

## 9. Loading & error UX

Both layers are acceptable; choose by scope.

- **Component-level (preferred for widgets):** the data-bound component renders a skeleton on `isPending` and an inline error state on `isError`, with a retry that calls `refetch()`. Required for any tile/card backed by a hook.
- **Route-level (preferred for full surfaces):** add `loading.tsx` (skeleton page) and `error.tsx` (with `reset()` button) next to `page.tsx` to catch render/throw errors and Suspense boundaries.

Never silently render empty UI on error.

---

## 10. Testing

Full pyramid is recommended for new code:

| Layer                | Tool                | Required for                  |
| -------------------- | ------------------- | ----------------------------- | ----------------------------------------------------------------- |
| Visual / interaction | `<CHOOSE: Storybook | none>`                        | Every `src/components/ui/*` and any non-trivial feature component |
| Unit                 | `<CHOOSE: Vitest    | Jest>`                        | All pure functions in `lib/` and all hooks                        |
| E2E                  | **Playwright**      | Critical journeys per surface |

Conventions:

- Test files colocate: `foo.ts` ↔ `foo.test.ts`; stories: `foo.tsx` ↔ `foo.stories.tsx`.
- Mock data hooks at the boundary (`vi.mock("./hooks/use-kpis")`) rather than mocking `fetch`.
- Playwright specs live in `e2e/` (or `tests/e2e/`); use route-level fixtures to seed deterministic mock data.

---

## 11. Notable patterns to reuse

> ⚠️ CONFIRM: Fill this section per project. It is the catalog of blessed, reusable patterns so engineers/agents reuse before rebuilding. Candidates: shared drawer/modal stacks, canonical data-tile shapes, ranking/sort utilities, shared filter UIs, any singleton canvas/context. Delete this note once populated.

---

## 12. Recipes

### Add a new route

1. `src/app/<route>/page.tsx` — thin entry that composes components from `./components/` directly. Only introduce a `<route>-view.tsx` wrapper if composition is genuinely complex.
2. Optional `loading.tsx`, `error.tsx` siblings.
3. Route-scoped `hooks/`, `lib/`, `components/` as needed (all kebab-case files).
4. Add the route to the navbar in `src/components/shared/` (gate by persona/role if applicable).

### Add a new component

1. Decide route-specific vs cross-route (table in §2).
2. Build with Tailwind tokens + `cn()`; expose semantic props (state, level, variant).
3. Reusable components: add stories covering each prop matrix state (if Storybook is used).
4. Add unit tests for any non-trivial logic in the component.

### Add a new data feed

1. Define the type in `src/app/<route>/lib/<thing>-types.ts`.
2. Drop fixture at `public/mock/<thing>.json`.
3. Implement the `use<Thing>` hook (§5 shape) with appropriate `refetchInterval` (§6).
4. Consume from a component; render skeleton + error per §9.
5. Unit tests for the hook + lib.

### Add cross-route persistent state

1. Create store in `src/hooks/shared/use-<thing>-store.tsx`.
2. Wrap with your state library's persistence middleware (versioned `name`).
3. Document the persisted schema in a comment near the store.

---

## 13. Open questions (TBD)

These are intentionally undecided. Do not invent answers in PRs without first updating this doc:

- Backend transport (Next.js API routes vs external service vs Server Actions).
- Authentication and session/role resolution.
- Streaming transport for live data (SSE/WebSocket) if polling proves insufficient.
- URL deep-linking contract for drawer/navigation state.

> ⚠️ CONFIRM: Add project-specific open questions here.
