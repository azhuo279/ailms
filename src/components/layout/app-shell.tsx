/**
 * Re-exports the canonical App Shell from the component library
 * (`src/components/ui/app-shell.tsx`). Kept as a thin alias so existing
 * imports from `@/components/layout/app-shell` keep working — the design
 * system's canonical source for App Shell now lives in `ui/` alongside the
 * rest of Phase 2's navigation and workspace components.
 */
export { AppShell, type AppShellProps } from "@/components/ui/app-shell";
