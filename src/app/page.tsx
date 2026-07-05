import type { Metadata } from "next";
import { FleetSummaryGrid } from "@/app/components/fleet-summary-grid";

export const metadata: Metadata = {
  title: "Overview · AiLMS",
};

/**
 * Home overview. Thin route entry — composes route components directly
 * (framework doc §3). Add page-level concerns (metadata, params) here only.
 *
 * NOTE: the page stays, but its body composes SCAFFOLD EXAMPLE content
 * (FleetSummaryGrid) — swap that for real content. See SCAFFOLD.md.
 */
export default function HomePage() {
  return (
    <div className="relative flex flex-col gap-8 w-full h-full">
      <header>
        <h1 className="text-2xl font-semibold text-fg-primary">Overview</h1>
        <p className="mt-1 text-sm text-fg-secondary">
          Fleet and shipment status at a glance.
        </p>
      </header>

      <section aria-labelledby="fleet-summary-heading">
        <h2 id="fleet-summary-heading" className="sr-only">
          Fleet summary
        </h2>
        <FleetSummaryGrid />
      </section>
    </div>
  );
}
