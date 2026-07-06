import { redirect } from "next/navigation";

/**
 * Superseded route. The director-only Adoption Tracker folded into
 * /performance as its second tab ("AI Adoption", inventor Direction C). This
 * route now permanently redirects there so any existing links/bookmarks keep
 * working; the tab's own director gate (via `useUserPersona`) governs access.
 */
export default function AdoptionTrackerPage() {
  redirect("/performance");
}
