# Scaffold inventory — what's an example vs. permanent

This project was scaffolded from `codebase-framework-template.md`. To exercise
the framework end-to-end, the scaffold originally included a **fake demo data
feed** (a logistics "fleet summary") demonstrating the patterns in the
framework doc. That demo feed has been removed now that the real Workspace
surface (Flow 4.1b) is the home route.

## ✅ Removed — the fleet-summary demo feed

These files were deleted once real features landed:

| File | What it demonstrated |
| ---- | -------------------- |
| `public/mock/fleet-summary.json` | Mock fixture in `public/mock/` (§5) |
| `src/app/lib/fleet-summary-types.ts` | Domain types + Zod boundary validation (§5) |
| `src/app/hooks/use-fleet-summary.ts` | The required data-hook shape: query-key constant + standalone fetcher + `useQuery` (§5) |
| `src/app/hooks/use-fleet-summary.test.ts` | Unit test for a fetcher (§10) |
| `src/app/components/fleet-summary-grid.tsx` | Hook-backed component with skeleton + inline error/retry (§9) |
| `e2e/home.spec.ts` | Playwright smoke test for a surface (§10) |

`src/app/page.tsx` now just redirects `/` to `/workspace`, the app's real home
screen.

## 🤔 EXAMPLE but reusable — keep or adapt

Small, generic, and likely useful — safe to keep as-is:

| File | Note |
| ---- | ---- |
| `src/components/ui/stat-tile.tsx` | Generic KPI tile primitive. Uses the `status-*` tokens; keep if you'll show KPIs. |
| `src/components/ui/stat-tile.stories.tsx` | Its Storybook stories. Delete with the tile if you remove it. |
| `src/hooks/shared/use-preferences-store.tsx` | Cross-route Zustand+persist store showing the §7 pattern. Keep if you'll have UI prefs; otherwise delete. |
| `src/components/shared/route-stub.tsx` | Placeholder for not-yet-built routes; referenced by the framework (§3). Keep. |

## ✅ PERMANENT — framework infrastructure (do not delete)

- `src/app/layout.tsx`, `src/app/globals.css` — root layout + theme tokens
- `src/app/loading.tsx`, `src/app/error.tsx` — route-level fallbacks (§9)
- `src/app/page.tsx` — the home route (redirects to `/workspace`)
- `src/lib/utils.ts` (`cn()`), `src/lib/query-provider.tsx`
- `src/components/layout/app-shell.tsx`, `src/components/shared/navbar.tsx`
- All config: `package.json`, `tsconfig.json`, `next.config.ts`,
  `postcss.config.mjs`, `vitest.config.ts`, `vitest.setup.ts`,
  `playwright.config.ts`, `.storybook/*`
- `CODEBASE.md` — the resolved framework doc for this project

## Logistics-specific tokens

`globals.css` defines `--color-status-{intransit,delivered,delayed,pending}`
for the demo. These were added for the example — prune or rename any you don't
use once the real domain is defined.
