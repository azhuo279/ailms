import type { Meta, StoryObj } from "@storybook/nextjs";
import { EpistemicTag, ImpactProjectionPanel, ConflictingSignalComparisonPanel } from "./epistemic-status";

/**
 * **Epistemic status family** — the shared visual vocabulary for saying "how
 * sure are we, and why" (PRD P-02, spanning FR-03 / FR-10 / FR-11 / FR-13 /
 * FR-17 / FR-18). Three scales of one language: an inline `EpistemicTag`, a
 * persistent-disclosure `ImpactProjectionPanel` for an AI forecast, and a
 * `ConflictingSignalComparisonPanel` for two disagreeing source systems.
 */
const meta: Meta<typeof EpistemicTag> = {
  title: "UI/EpistemicStatus",
  component: EpistemicTag,
};

export default meta;
type Story = StoryObj<typeof EpistemicTag>;

// ---------------------------------------------------------------------------
// EpistemicTag
// ---------------------------------------------------------------------------

export const TagConfirmed: Story = {
  name: "EpistemicTag / Confirmed",
  render: () => <EpistemicTag tone="confirmed" basis="FleetCommand TMS event, 14:02 CT" />,
};

export const TagAiEstimate: Story = {
  name: "EpistemicTag / AI estimate",
  render: () => <EpistemicTag tone="ai" basis="Based on lane history and current transit speed" />,
};

export const TagUnknown: Story = {
  name: "EpistemicTag / Not available",
  render: () => <EpistemicTag tone="unknown" basis="Not yet received from carrier" />,
};

export const TagInlineRow: Story = {
  name: "EpistemicTag / Inline usage",
  render: () => (
    <div className="flex w-96 flex-col divide-y divide-border-subtle rounded-lg border border-border-subtle bg-surface-raised p-4">
      <div className="flex items-center justify-between gap-3 py-2">
        <span className="text-body-s text-fg-muted">Carrier scan, Memphis hub</span>
        <EpistemicTag tone="confirmed" basis="FleetCommand TMS event, 14:02 CT" />
      </div>
      <div className="flex items-center justify-between gap-3 py-2">
        <span className="text-body-s text-fg-muted">Predicted delivery date</span>
        <span className="flex items-center gap-2 text-body-m font-medium text-fg-primary">
          Jul 9
          <EpistemicTag tone="ai" basis="Model: lane-eta-v3, based on 3 source systems" />
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 py-2">
        <span className="text-body-s text-fg-muted">Proof of delivery signature</span>
        <EpistemicTag tone="unknown" basis="Carrier has not uploaded proof yet" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// ImpactProjectionPanel
// ---------------------------------------------------------------------------

export const ImpactProjection: Story = {
  name: "ImpactProjectionPanel / SLA breach forecast",
  render: () => (
    <ImpactProjectionPanel
      className="w-[28rem]"
      headline={
        <>
          If not resolved within the <b>4-hour breach window</b>, <b>3 orders</b> tied to{" "}
          <b>2 Gold-tier customers</b> are projected to miss SLA.
        </>
      }
      confidenceLabel="Medium confidence · 68%"
      riskCountLabel="3 orders at risk"
      evidence={[
        { id: "o1", content: <><b>Order 48291</b> Gold tier, SLA 18:00 CT, exposure $4,200</> },
        { id: "o2", content: <><b>Order 48305</b> Gold tier, SLA 19:30 CT, exposure $2,850</> },
        { id: "o3", content: <><b>Order 48312</b> Silver tier, SLA 21:00 CT, exposure $1,100</> },
        { id: "o4", content: <>Lane has missed SLA in <b>4 of the last 12</b> similar delays</> },
      ]}
      citations={["TMS", "Order Management", "SLA terms"]}
    />
  ),
};

export const ImpactProjectionCustomsHold: Story = {
  name: "ImpactProjectionPanel / Customs hold cascade",
  render: () => (
    <ImpactProjectionPanel
      className="w-[28rem]"
      headline={
        <>
          If the documentation gap is not cleared by <b>end of day</b>, the load is projected to
          miss its <b>cross-dock connection</b> at the Laredo yard.
        </>
      }
      confidenceLabel="High confidence · 82%"
      riskCountLabel="1 shipment, 1 downstream load"
      reasoningTitle="Why this projection"
      evidence={[
        { id: "c1", content: <>Missing document is a <b>commercial invoice</b>, required before BorderIQ can release the hold</> },
        { id: "c2", content: <>Cross-dock connection departs Laredo at <b>06:00 CT</b> tomorrow, next slot is 48 hours later</> },
        { id: "c3", content: <>Similar documentation gaps cleared in <b>under 4 hours</b> in 9 of the last 10 cases</> },
      ]}
      citations={["BorderIQ", "FleetCommand TMS"]}
    />
  ),
};

// ---------------------------------------------------------------------------
// ConflictingSignalComparisonPanel
// ---------------------------------------------------------------------------

export const ConflictingSignals: Story = {
  name: "ConflictingSignalComparisonPanel / Vehicle position",
  render: () => (
    <ConflictingSignalComparisonPanel
      className="w-[30rem]"
      bannerText="Conflicting signals on vehicle position."
      columns={[
        {
          id: "tms",
          source: "TMS",
          tone: "confirmed",
          basis: "FleetCommand TMS checkpoint, last refreshed 3 hours ago",
          value: "On track, ETA 16:40",
        },
        {
          id: "gps",
          source: "GPS",
          tone: "confirmed",
          basis: "SignalTrack telemetry, refreshed 4 minutes ago",
          value: "2 hrs behind, ETA 18:40",
        },
      ]}
      rationaleTitle="Why the summary used GPS"
      rationale={
        <ul className="list-disc space-y-1 pl-4">
          <li>GPS pings refreshed <b>4 minutes ago</b></li>
          <li>TMS record last updated <b>3 hours ago</b>, at the prior checkpoint</li>
          <li>Live telemetry outranks a stale checkpoint when the two disagree</li>
        </ul>
      }
      resolutionText={
        <>AI summary uses the GPS reading. Read-only comparison, the AI does not arbitrate silently.</>
      }
    />
  ),
};

export const ConflictingSignalsOrderQuantity: Story = {
  name: "ConflictingSignalComparisonPanel / Order quantity",
  render: () => (
    <ConflictingSignalComparisonPanel
      className="w-[30rem]"
      bannerText="Conflicting signals on shipped quantity."
      columns={[
        {
          id: "wms",
          source: "WMS",
          tone: "confirmed",
          basis: "Nexus WMS pick-pack-ship event, dock 12",
          value: "48 pallets shipped",
        },
        {
          id: "asn",
          source: "ASN",
          tone: "ai",
          basis: "Inferred from carrier manifest, ASN not yet matched",
          value: "46 pallets expected",
        },
      ]}
      rationaleTitle="Why the summary used the WMS count"
      rationale={
        <ul className="list-disc space-y-1 pl-4">
          <li>WMS count is a <b>confirmed scan event</b> at time of loading</li>
          <li>ASN figure is an <b>AI-matched estimate</b> pending carrier manifest confirmation</li>
          <li>Confirmed source events outrank inferred figures when the two disagree</li>
        </ul>
      }
      resolutionText={
        <>AI summary uses the WMS scan count. The 2-pallet gap is flagged for manual ASN reconciliation, not resolved automatically.</>
      }
    />
  ),
};
