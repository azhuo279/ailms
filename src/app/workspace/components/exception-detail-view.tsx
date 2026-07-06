"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  MoveUpRight,
  Package,
  Pencil,
  Send,
  Sparkles,
  Tag as TagIcon,
  Truck,
  Warehouse as WarehouseIcon,
  Waypoints,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/ui/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { TextArea } from "@/components/ui/text-area";
import { RadioGroup } from "@/components/ui/radio-group";
import { MessageBar } from "@/components/ui/message-bar";
import { EpistemicTag } from "@/components/ui/epistemic-status";
import { useCopilotOpen } from "@/components/ui/app-shell";
import {
  STATUS_DOT,
  STATUS_WORD,
} from "@/app/workspace/components/source-health-control";
import {
  formatRelativeTime,
  getWarehouse,
  buildSourceStatusMap,
  getSourceStatus,
  SOURCE_STATUS_LABEL,
  type SourceEpistemicStatus,
} from "@/app/workspace/lib/exception-format";
import {
  buildAiSummary,
  buildRecommendedActions,
  buildEvidence,
  buildTimeline,
  getAiConfidence,
  getResolutionEta,
  getRoutingKind,
  isLegalHold,
  type RecommendedAction,
  type RoutingKind,
} from "@/app/workspace/lib/exception-detail";
import type {
  ExceptionRecord,
  ExceptionQueue,
  PriorityTier,
  SourceHealth,
  Warehouse,
} from "@/app/workspace/lib/exception-types";
import { DelegateModal } from "./delegate-modal";
import { EscalateModal } from "./escalate-modal";
import { EditableTierControl } from "./editable-tier-control";
import { DelegationStatusPanel } from "./delegation-status-panel";
import { EscalationStatusPanel } from "./escalation-status-panel";

/**
 * Exception Detail View — the right pane of the /workspace split view when an
 * exception is selected (it replaces ExceptionMapPanel; the map returns when
 * selection is cleared). Route-local organism, bound to this one screen and use
 * case (see Step 11a manifest, kept local not elevated).
 *
 * Layout: a full-width non-scrolling header (breadcrumb-led) spanning both
 * columns, then a scrollable main column (AI summary card, then a tab strip
 * whose primary tab is the recommended action, plus evidence/timeline/notes)
 * beside a widened non-scrolling metadata sidebar of Cards.
 *
 * Reserved-ramp discipline: AI-authored surfaces use the `ai-*` teal ramp only
 * (via EpistemicTag and ai-surface tokens); true exception urgency uses the
 * `severity-*` ramp only (via PriorityTierBadge). priorityScore is never read
 * or rendered — only the tier and a coarse rank band are shown.
 */

const REVEAL = "motion-safe:animate-[empty-state-rise-in_200ms_ease-out_both]";

/**
 * Minimal **bold** renderer for mock copy. The detail derivations pre-bold key
 * phrases with markdown-style `**...**` markers (mock-data convention: scannable
 * text, bolded key phrases). This splits on the markers and wraps the odd
 * segments in a semibold span rather than pulling in a markdown dependency.
 */
function RichText({ text }: { text: string }) {
  const parts = text.split("**");
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-fg-primary">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** Source health status → a Badge tone for the sidebar source dots. */
const SOURCE_DOT_TONE: Record<
  SourceEpistemicStatus,
  "success" | "warning" | "danger"
> = {
  verified: "success",
  inferred: "warning",
  stale: "danger",
};

export interface ExceptionDetailViewProps {
  exception: ExceptionRecord;
  warehouseMap: Map<string, Warehouse>;
  sourceHealth: SourceHealth[];
  /** Clears the selection and returns the pane to the map. */
  onBack: () => void;
  /**
   * Called when the selected action is routed (delegated/escalated) from a
   * pending exception. The container moves the exception to the matching queue
   * and clears the selection so the tab shows the routed result.
   */
  onRouted?: (id: string, queue: ExceptionQueue) => void;
  className?: string;
}

export function ExceptionDetailView({
  exception,
  warehouseMap,
  sourceHealth,
  onBack,
  onRouted,
  className,
}: ExceptionDetailViewProps) {
  const [nowMs] = useState(() => Date.now());
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  // Priority tier is now editable from the header (Starling feedback). Lifted
  // here so the header badge and any tier-derived read update on confirm. A real
  // build posts the change (tier + reason + note) to a service; this mock keeps
  // the confirmed tier in local state. Reset when a different exception loads.
  const [tier, setTier] = useState<PriorityTier>(exception.priorityTier);
  useEffect(() => {
    setTier(exception.priorityTier);
  }, [exception.id, exception.priorityTier]);
  // When the docked Copilot panel is open the main column narrows, so the AI
  // summary card reflows its metric rail from a right column to a bottom row
  // (Starling feedback). Read from the shell's copilot-open context.
  const copilotOpen = useCopilotOpen();
  // Recommended action is the primary (default) tab (item 6).
  const [activeTab, setActiveTab] = useState("action");

  const summary = useMemo(() => buildAiSummary(exception), [exception]);
  const actions = useMemo(
    () => buildRecommendedActions(exception),
    [exception],
  );
  const evidence = useMemo(
    () => buildEvidence(exception, sourceHealth),
    [exception, sourceHealth],
  );
  const timeline = useMemo(() => buildTimeline(), []);
  const sourceStatusMap = useMemo(
    () => buildSourceStatusMap(sourceHealth),
    [sourceHealth],
  );

  // Routing-as-execution state. A recommendation is never approved/confirmed;
  // it is EXECUTED by routing (Delegate for T1/T2, Escalate for T3/T4). The
  // only decisions here are which rec and whether it was modified; the recipient
  // (and, when modified, the context) are chosen inside the handoff modal.
  const primaryAction = actions.find((a) => a.isAiPrimary) ?? actions[0];
  const [selectedActionId, setSelectedActionId] = useState(primaryAction.id);
  const [customMode, setCustomMode] = useState(false);
  const [customAction, setCustomAction] = useState("");
  // A written action is not bound to a rec tier, so the ZOM picks whether it
  // delegates or escalates. Defaults to delegate; only used in custom mode.
  const [customRoutingKind, setCustomRoutingKind] =
    useState<RoutingKind>("delegate");
  // Per-selected-action instruction edit (case a). Keyed by action id so
  // switching recs does not carry an edit across. An entry present + differing
  // from the action's own description marks it modified.
  const [editedInstructions, setEditedInstructions] = useState<
    Record<string, string>
  >({});
  const [editingInstruction, setEditingInstruction] = useState(false);
  // Which handoff modal is open (Direction C). Opening it carries the selected
  // action through into the modal (adjustment 2). null = no modal open.
  const [routingModal, setRoutingModal] = useState<RoutingKind | null>(null);

  // Once routed, the exception sits in the delegated/escalated queue and the
  // recommended-action block is replaced by a live status surface.
  const isDelegated = exception.queue === "delegated";
  const isEscalated = exception.queue === "escalated";
  const isRouted = isDelegated || isEscalated;

  // A sanctions / legal hold (inspector F1 / Starling). When set the AI action
  // recommendation is SUPPRESSED: the recommended-action tab shows a calm
  // "requires legal review, cannot be actioned here" panel whose sole CTA is
  // Escalate to Legal (which opens the existing EscalateModal, policy-locked to
  // Legal). No delegate / write-your-own / edit-instruction path is offered.
  const legalHold = isLegalHold(exception);

  const selectedAction =
    actions.find((a) => a.id === selectedActionId) ?? primaryAction;

  // Instruction text for the selected rec — the edited value if the ZOM
  // changed it, else the action's own description.
  const instructionText =
    editedInstructions[selectedAction.id] ?? selectedAction.description;
  const instructionEdited =
    !customMode &&
    editedInstructions[selectedAction.id] !== undefined &&
    editedInstructions[selectedAction.id].trim() !==
      selectedAction.description.trim();

  // MODIFIED is DERIVED, not a button. True when ANY of:
  //  (a) the instruction text was edited before routing,
  //  (b) an alternative was selected instead of the AI primary, or
  //  (c) the ZOM wrote their own action (customMode is always modified).
  const isModified =
    customMode || !selectedAction.isAiPrimary || instructionEdited;

  // Tier drives the single CTA for a suggested rec. A written action has no
  // tier, so the ZOM's chosen delegate/escalate governs instead.
  const routingKind: RoutingKind = customMode
    ? customRoutingKind
    : getRoutingKind(selectedAction.tier);

  const warehouse = getWarehouse(exception, warehouseMap);
  const detected = formatRelativeTime(exception.eventTimestamp, nowMs);
  const aiConfidence = getAiConfidence(exception);
  const resolutionEta = getResolutionEta(exception);

  // Picking a rec closes any open instruction editor so the new rec starts clean.
  const resetRouting = () => {
    setEditingInstruction(false);
  };

  const selectAction = (id: string) => {
    setCustomMode(false);
    setSelectedActionId(id);
    resetRouting();
  };

  const enterCustomMode = (on: boolean) => {
    setCustomMode(on);
    resetRouting();
  };

  // Switching delegate/escalate changes which modal opens next; reset the
  // per-rec editing state so nothing carries across.
  const changeCustomRoutingKind = (kind: RoutingKind) => {
    setCustomRoutingKind(kind);
    resetRouting();
  };

  const editInstruction = (value: string) => {
    setEditedInstructions((prev) => ({ ...prev, [selectedAction.id]: value }));
  };

  // The Delegate / Escalate button now OPENS the handoff modal directly
  // (Starling feedback: no intermediate inline recipient-picker step). The
  // modal is the reviewable-before-send artifact where the recipient, the AI
  // package/brief, and the note are chosen and confirmed. The selected action is
  // carried into the modal so its header + package derive from THAT action
  // (adjustment 2).
  const handleRoute = () => {
    setRoutingModal(routingKind);
  };

  // A legal hold has exactly one path: open the Escalate modal, which is
  // policy-locked to the Legal / Compliance approver (getPolicyApprover) and
  // strips the AI recommendation from the brief.
  const handleEscalateToLegal = () => {
    setRoutingModal("escalate");
  };

  // Modal confirm — the mock route. A real build posts the assembled package /
  // brief to the delegation/escalation service. The exception then moves to the
  // matching queue and the selection clears so the tab shows the routed result.
  const handleModalConfirm = () => {
    const targetQueue: ExceptionQueue =
      routingModal === "escalate" ? "escalated" : "delegated";
    setRoutingModal(null);
    resetRouting();
    onRouted?.(exception.id, targetQueue);
  };

  return (
    <section
      aria-label={`Exception detail, ${exception.headline}`}
      className={cn(
        "flex h-full min-w-0 flex-col overflow-hidden bg-surface-raised rounded-lg shadow-sm",
        className,
      )}
    >
      {/* Header — full width, non-scrolling, spans both columns below.
          Explicit back button leads on the left, then the breadcrumb for
          context (item B2); both return to the feed. */}
      <header className="flex shrink-0 flex-col gap-2 border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Button
            iconOnly
            variant="ghost"
            size="sm"
            icon={<ArrowLeft />}
            aria-label="Back to feed"
            onClick={onBack}
          />
          <Breadcrumb
            size="sm"
            items={[
              { label: "Workspace", onClick: onBack },
              { label: exception.shipmentId },
            ]}
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Editable tier control (Starling feedback): the badge is now a
              dropdown that opens a reason-capture modal on a real change. The
              shared PriorityTierBadge stays read-only; this route-local control
              composes it as the trigger face. */}
          <EditableTierControl
            tier={tier}
            onTierChange={(change) => {
              // Mock commit — a real build posts { tier, reasonId, note } to the
              // priority service. Here we lift the confirmed tier locally.
              setTier(change.tier);
            }}
          />
          <span className="min-w-0 truncate text-title font-semibold text-fg-primary">
            {exception.headline}
          </span>
        </div>
        {/* Meta row — source system removed (item 2); "Detected" stays. */}
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-caption text-fg-muted">
          <span title={detected.absolute}>Detected {detected.short}</span>
        </div>
      </header>

      {/* Body — scrollable main column + fixed metadata sidebar. */}
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_16rem] overflow-hidden">
        {/* Main column (scrollable). AI summary card stays above the tab
            strip; the recommended action now lives inside its own tab. */}
        <div className="min-w-0 space-y-4 overflow-y-auto p-4">
          <AiSummaryCard
            summary={summary}
            expanded={summaryExpanded}
            onToggle={() => setSummaryExpanded((v) => !v)}
            confidence={aiConfidence}
            resolutionEta={resolutionEta}
            copilotOpen={copilotOpen}
          />

          <DetailTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            exceptionId={exception.id}
            evidence={evidence}
            timeline={timeline}
            actionBlock={
              isRouted ? (
                isEscalated ? (
                  <EscalationStatusPanel exception={exception} />
                ) : (
                  <DelegationStatusPanel exception={exception} />
                )
              ) : legalHold ? (
                // AI action recommendation suppressed for a sanctions / legal
                // hold. Calm statement + sole Escalate to Legal CTA (item F1).
                <LegalHoldActionPanel onEscalate={handleEscalateToLegal} />
              ) : (
              <RecommendedActionBlock
                actions={actions}
                selectedAction={selectedAction}
                onSelect={selectAction}
                customMode={customMode}
                customAction={customAction}
                customRoutingKind={customRoutingKind}
                onCustomModeChange={enterCustomMode}
                onCustomActionChange={setCustomAction}
                onCustomRoutingKindChange={changeCustomRoutingKind}
                instructionText={instructionText}
                editingInstruction={editingInstruction}
                onEditingInstructionChange={setEditingInstruction}
                onInstructionChange={editInstruction}
                isModified={isModified}
                routingKind={routingKind}
                onRoute={handleRoute}
              />
              )
            }
          />
        </div>

        {/* Sidebar — widened, non-scrolling, metadata Cards (items 7, 8). */}
        <aside className="flex shrink-0 flex-col gap-3 overflow-y-auto border-l border-border-subtle bg-surface p-3.5 text-body-s">
          {/* Card 1 — exception facts, one icon per property (item 7c).
              Roomier padding on the two sidebar cards only (item C1). */}
          <Card padding="spacious">
            <div className="flex flex-col gap-3">
              <MetaBlock label="Exception type" icon={<TagIcon />}>
                <span className="font-medium text-fg-primary">
                  {exception.type}
                </span>
              </MetaBlock>
              <MetaBlock label="Shipment" icon={<Package />}>
                <span className="font-medium text-fg-primary">
                  {exception.shipmentId}
                </span>
              </MetaBlock>
              <MetaBlock label="Carrier" icon={<Truck />}>
                <span className="text-fg-secondary">{exception.carrier}</span>
              </MetaBlock>
              {warehouse ? (
                <MetaBlock label="Warehouse" icon={<WarehouseIcon />}>
                  <span className="text-fg-secondary">{warehouse.name}</span>
                </MetaBlock>
              ) : null}
            </div>
          </Card>

          {/* Card 2 — source systems only (item 8), same roomier padding (item C1). */}
          <Card padding="spacious">
            <MetaBlock label="Source systems" icon={<Waypoints />}>
              <ul className="flex flex-col gap-2">
                {exception.sourceSystems.map((system) => {
                  const status = getSourceStatus(system, sourceStatusMap);
                  return (
                    <li key={system} className="flex items-center gap-2 py-1">
                      <Badge
                        dot
                        size="sm"
                        tone={SOURCE_DOT_TONE[status]}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate text-fg-secondary">
                        {system}
                      </span>
                      <span className="sr-only">
                        {SOURCE_STATUS_LABEL[status]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </MetaBlock>
          </Card>
        </aside>
      </div>

      {/* Handoff modals (Direction C) — the reviewable-before-send artifact.
          Each carries the SELECTED action through so its header + AI
          package/brief derive from that action (adjustment 2). Portalled to
          document.body by the Dialog primitive. */}
      {routingModal === "delegate" ? (
        <DelegateModal
          open
          exception={exception}
          action={selectedAction}
          onClose={() => setRoutingModal(null)}
          onConfirm={handleModalConfirm}
        />
      ) : null}
      {routingModal === "escalate" ? (
        <EscalateModal
          open
          exception={exception}
          action={selectedAction}
          onClose={() => setRoutingModal(null)}
          onConfirm={handleModalConfirm}
        />
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// AI Summary card — collapsed digest, expands to a per-claim full read.
// ---------------------------------------------------------------------------

function AiSummaryCard({
  summary,
  expanded,
  onToggle,
  confidence,
  resolutionEta,
  copilotOpen = false,
}: {
  summary: ReturnType<typeof buildAiSummary>;
  expanded: boolean;
  onToggle: () => void;
  confidence: number;
  resolutionEta: string;
  /**
   * When the docked Copilot panel is open the main column narrows, so the
   * metric rail reflows from a right column to a bottom row (Starling
   * feedback). Closed keeps the original horizontal summary-beside-rail layout.
   */
  copilotOpen?: boolean;
}) {
  return (
    <div className="ai-card p-3.5">
      {/* Summary text beside the AI confidence + ETA rail (item 4). When the
          Copilot panel is open the column is narrow, so the layout goes
          vertical: summary on top, the metric rail reflows to a bottom ROW
          (Starling feedback). */}
      <div
        className={cn(
          "flex h-full items-stretch",
          copilotOpen ? "flex-col gap-3" : "flex-row items-start gap-3",
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-2 items-stretch ">
          <Sparkles
            className="mt-0.5 size-4 shrink-0 text-ai-emphasis"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1 items-stretch">
            <p className="text-label-s font-semibold uppercase tracking-wide text-ai-fg items-stretch">
              AI summary
            </p>
            {/* Digest — clamped to 2 lines when collapsed (item E1). */}
            <div className="flex flex-col items-center justify-between w-full h-full pb-4 items-stretch">
              <p
                className={cn(
                  "mt-1 text-body-m text-fg-primary",
                  !expanded && "line-clamp-3",
                )}
              >
                <RichText text={summary.digest} />
              </p>
              <button
                type="button"
                onClick={onToggle}
                aria-expanded={expanded}
                className=" inline-flex items-center gap-1 rounded-md text-label-m font-medium text-ai-fg transition-colors hover:bg-ai-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                {expanded ? "Hide summary" : "Full summary"}
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "size-4 shrink-0 transition-transform",
                    expanded && "rotate-180",
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Metric rail — the two metric blocks (small label over a large value)
            split by a subtle divider (item E2). Copilot CLOSED: a right column,
            blocks stacked, split by a LEFT border. Copilot OPEN: a bottom row,
            blocks side by side, split by a TOP border and a vertical inner
            divider. */}
        <div
          className={cn(
            "flex gap-3 border-ai-border/30",
            copilotOpen
              ? "w-full flex-row border-t pt-3"
              : "w-30 shrink-0 flex-col items-start border-l pl-4",
          )}
        >
          {/* Confidence — large value beside a compact ring. */}
          <div className="flex w-full flex-col gap-1">
            <span className="text-footnote text-fg-muted">Confidence</span>
            <div className="flex items-center w-full">
              <span className="text-heading-m text-ai-fg">
                {Math.round(confidence)}%
              </span>
              <div className="w-full flex items-center justify-center">
                <ConfidenceDonut value={confidence} />
              </div>
            </div>
          </div>

          {/* Divider — matches the expanded-section inner-divider treatment.
              Horizontal between stacked blocks (closed), vertical between
              side-by-side blocks (open). */}
          <div
            className={cn(
              "border-ai-border/30",
              copilotOpen ? "border-l" : "w-full border-t",
            )}
          />

          {/* Estimated resolution — large value (AI-derived, so teal). */}
          <div className="flex w-full flex-col gap-1">
            <span className="text-footnote text-fg-muted">
              Est. resolution time
            </span>
            <span className="text-heading-m text-ai-fg">{resolutionEta}</span>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className={cn("mt-3 border-t border-ai-border/30 pt-3", REVEAL)}>
          {/* Epistemic legend lives in the expanded state only (item 5). */}
          {/* <span className="flex flex-wrap items-center gap-1.5">
            <EpistemicTag tone="confirmed" label="Confirmed" />
            <EpistemicTag tone="ai" label="Inferred" />
            <EpistemicTag tone="unknown" label="Unknown" />
          </span> */}
          <ul className="mt-3 flex flex-col gap-2.5">
            {summary.claims.map((claim) => (
              <li key={claim.id} className="flex items-start gap-2">
                <div className="w-28">
                  <EpistemicTag
                    tone={claim.tone}
                    basis={claim.basis}
                    className="mt-0.5"
                  />
                </div>
                <span className="min-w-0 flex-1 text-body-s text-fg-secondary">
                  <RichText text={claim.text} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/**
 * ConfidenceDonut — a small SVG ring visualizing AI confidence as an arc.
 * The project's ProgressIndicator is linear only, so this is a route-local
 * circular read for the AI summary card. Uses the reserved `ai-*` ramp (this is
 * AI confidence) against a sunken track. The numeric value is rendered beside
 * the ring by the caller, so this renders the ring only — no centered % and no
 * caption chrome.
 */
function ConfidenceDonut({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <svg viewBox="0 0 36 36" className="size-8 -rotate-90" aria-hidden="true">
      <circle
        cx="18"
        cy="18"
        r={radius}
        fill="none"
        stroke="var(--color-surface-sunken)"
        strokeWidth="3.5"
      />
      <circle
        cx="18"
        cy="18"
        r={radius}
        fill="none"
        stroke="var(--color-ai-emphasis)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Recommended action block — routing IS execution. Each rec is an
// expand-in-place item showing its tier badge, name, description, outcome, and
// trade-off. There is NO approve/confirm. Each rec carries exactly ONE CTA,
// chosen by its tier: T1/T2 -> Delegate, T3/T4 -> Escalate. Tapping the CTA
// EXPANDS an inline recipient picker (it does not route). When the rec is
// MODIFIED (edited instruction / an alternative / write-your-own), a "Modified"
// badge shows and a required reason category + optional note appear beside the
// recipient. A final "Delegate to.../Escalate to..." button completes the
// routing. The AI-primary rec is open by default and wears a "Top
// recommendation" badge. A "Write your own action" path follows.
// ---------------------------------------------------------------------------

/** Copy per routing kind (single source for the tier CTA label + icon). */
const ROUTING_COPY: Record<RoutingKind, { cta: string; icon: typeof Send }> = {
  delegate: {
    cta: "Delegate",
    icon: Send,
  },
  escalate: {
    cta: "Escalate",
    icon: MoveUpRight,
  },
};

interface RoutingPanelProps {
  isModified: boolean;
  routingKind: RoutingKind;
  onRoute: () => void;
}

/**
 * The single tier-CTA for one recommendation. Starling feedback: the button now
 * OPENS the handoff modal directly (no intermediate inline recipient-picker
 * step). Recipient selection lives inside the modal (its dispatcher/approver
 * routing). Delegate/Escalate use the normal primary interactive role (never the
 * ai or severity ramp). Opening the modal IS how routing begins.
 */
function RoutingPanel({ isModified, routingKind, onRoute }: RoutingPanelProps) {
  const copy = ROUTING_COPY[routingKind];
  const CtaIcon = copy.icon;

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Single tier-appropriate CTA — opens the handoff modal directly. */}
        <Button
          size="sm"
          variant="primary"
          leadingIcon={<CtaIcon />}
          onClick={onRoute}
        >
          {copy.cta}
        </Button>
      </div>

      {isModified ? (
        <p className="text-caption text-fg-muted">
          This routes as{" "}
          <span className="font-medium text-fg-secondary">modified</span>. The
          recipient sees what was originally recommended and what changed.
        </p>
      ) : null}
    </div>
  );
}

/**
 * LegalHoldActionPanel — replaces the recommended-action block for a sanctions /
 * legal hold (inspector F1 / Starling). The AI action recommendation is
 * suppressed by policy: no self-serve remedy, no delegate, no write-your-own,
 * no edit-instruction. A calm statement explains the hold requires legal review
 * and cannot be actioned here, and the SOLE CTA escalates to Legal (opening the
 * existing EscalateModal, which is policy-locked to the Legal / Compliance
 * approver and strips the AI recommendation from the brief).
 *
 * Reserved-ramp discipline: this is an operational routing panel, so the CTA
 * uses the normal `primary` interactive role, never the `ai-*` teal or the
 * `severity` urgency ramp. The calm framing uses a neutral `info` accent, not an
 * alarm colour. Route-local, single-use (Step 11a): NOT elevated.
 */
function LegalHoldActionPanel({ onEscalate }: { onEscalate: () => void }) {
  return (
    <div className={cn("flex flex-col gap-3", REVEAL)}>
      <MessageBar
        severity="info"
        title="Requires legal review"
        action={
          /* Sole CTA — normal primary interactive role, routes to Legal. */
          <Button
            size="sm"
            variant="primary"
            leadingIcon={<MoveUpRight />}
            onClick={onEscalate}
          >
            Escalate to Legal
          </Button>
        }
      >
        This is a{" "}
        <strong className="font-semibold text-fg-primary">
          sanctions or prohibited-goods hold
        </strong>
        . It{" "}
        <strong className="font-semibold text-fg-primary">
          cannot be actioned from here
        </strong>{" "}
        and no AI remedy is proposed. Escalate to Legal for a manual clearance
        ruling.
      </MessageBar>
    </div>
  );
}

function RecommendedActionBlock({
  actions,
  selectedAction,
  onSelect,
  customMode,
  customAction,
  customRoutingKind,
  onCustomModeChange,
  onCustomActionChange,
  onCustomRoutingKindChange,
  instructionText,
  editingInstruction,
  onEditingInstructionChange,
  onInstructionChange,
  isModified,
  routingKind,
  onRoute,
}: {
  actions: RecommendedAction[];
  selectedAction: RecommendedAction;
  onSelect: (id: string) => void;
  customMode: boolean;
  customAction: string;
  customRoutingKind: RoutingKind;
  onCustomModeChange: (v: boolean) => void;
  onCustomActionChange: (v: string) => void;
  onCustomRoutingKindChange: (v: RoutingKind) => void;
  instructionText: string;
  editingInstruction: boolean;
  onEditingInstructionChange: (v: boolean) => void;
  onInstructionChange: (v: string) => void;
  isModified: boolean;
  routingKind: RoutingKind;
  onRoute: () => void;
}) {
  // The open item is the currently-selected action (unless the user is writing
  // their own, which collapses the suggested list). Toggling an item selects it.
  const openId = customMode ? null : selectedAction.id;

  const routingPanel = (
    <RoutingPanel
      isModified={isModified}
      routingKind={routingKind}
      onRoute={onRoute}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle">
        {actions.map((action) => {
          const isOpen = action.id === openId;
          return (
            <RecommendationItem
              key={action.id}
              action={action}
              isOpen={isOpen}
              onToggle={() => onSelect(action.id)}
              instructionText={instructionText}
              editingInstruction={editingInstruction}
              onEditingInstructionChange={onEditingInstructionChange}
              onInstructionChange={onInstructionChange}
              routingPanel={routingPanel}
            />
          );
        })}
      </div>

      {/* Write your own — always routes as modified. */}
      <div>
        {!customMode ? (
          <button
            type="button"
            onClick={() => onCustomModeChange(true)}
            className="ml-3 text-label-m font-medium text-link transition-colors hover:text-link-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1"
          >
            Write custom action
          </button>
        ) : (
          <div
            className={cn(
              "flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-raised p-3",
              REVEAL,
            )}
          >
            <TextArea
              label="Your action"
              placeholder="Describe the action you want to take instead."
              rows={2}
              value={customAction}
              onChange={(e) => onCustomActionChange(e.target.value)}
            />
            {/* A written action has no rec tier, so the ZOM chooses whether it
                delegates or escalates before routing. */}
            <RadioGroup
              name="custom-routing-kind"
              label="Route this action as"
              value={customRoutingKind}
              onChange={(v) => onCustomRoutingKindChange(v as RoutingKind)}
              options={[
                { value: "delegate", label: "Delegate to an execution owner" },
                { value: "escalate", label: "Escalate for a decision" },
              ]}
            />
            {/* A written action is inherently modified, so it flows through the
                same single-CTA that opens the handoff modal. */}
            {routingPanel}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * A single expand-in-place recommendation (accordion-style disclosure). Each
 * rec shows its tier via PriorityTierBadge (the tier drives which CTA appears,
 * so it must be visible); the AI-primary rec also wears a "Top recommendation"
 * Badge on the reserved `ai-*` ramp. Opening reveals the (inline-editable)
 * instruction, the expected outcome, and the single tier-CTA routing panel.
 * Editing the instruction marks the rec modified (correction case a).
 */
function RecommendationItem({
  action,
  isOpen,
  onToggle,
  instructionText,
  editingInstruction,
  onEditingInstructionChange,
  onInstructionChange,
  routingPanel,
}: {
  action: RecommendedAction;
  isOpen: boolean;
  onToggle: () => void;
  instructionText: string;
  editingInstruction: boolean;
  onEditingInstructionChange: (v: boolean) => void;
  onInstructionChange: (v: string) => void;
  routingPanel: ReactNode;
}) {
  return (
    <div className="bg-surface-raised first:rounded-t-lg last:rounded-b-lg">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors",
          "hover:bg-option-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset",
        )}
      >
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          {/* Starling: the tier badge is dropped from the recommended action row.
              The tier still drives which CTA appears; it just no longer shows a
              redundant priority badge here (the selected exception's tier is
              already carried in the detail header). */}
          <span className="text-body-m font-medium text-fg-primary">
            {action.name}
          </span>
          {action.isAiPrimary ? (
            <Badge size="sm" className="bg-ai-surface text-ai-fg">
              Top recommendation
            </Badge>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-fg-muted transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen ? (
        <div className={cn("px-3.5 pb-3.5", REVEAL)}>
          {/* Instruction — inline-editable (correction case a). Editing it
              sets Modified state on the parent. */}
          {editingInstruction ? (
            <div className={cn("flex flex-col gap-2", REVEAL)}>
              <TextArea
                label="Edit instruction"
                rows={2}
                value={instructionText}
                onChange={(e) => onInstructionChange(e.target.value)}
              />
              <button
                type="button"
                onClick={() => onEditingInstructionChange(false)}
                className="self-start text-label-m font-medium text-link transition-colors hover:text-link-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1"
              >
                Done editing
              </button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 text-body-s text-fg-secondary">
                {instructionText}
              </p>
              <Button
                size="sm"
                variant="ghost"
                leadingIcon={<Pencil />}
                onClick={() => onEditingInstructionChange(true)}
              >
                Edit
              </Button>
            </div>
          )}

          <p className="mt-1.5 flex items-start gap-1.5 text-body-s text-ai-fg">
            <MoveUpRight
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            <span>{action.expectedOutcome}</span>
          </p>

          {/* Single tier-CTA routing panel — Delegate/Escalate + recipient +
              (when modified) reason capture. Routing IS the execution. */}
          {routingPanel}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs — Recommended action (default, primary) · Evidence · Timeline · Notes.
// Sits between the AI summary card and its panels (item 6).
// ---------------------------------------------------------------------------

function DetailTabs({
  activeTab,
  onTabChange,
  exceptionId,
  evidence,
  timeline,
  actionBlock,
}: {
  activeTab: string;
  onTabChange: (v: string) => void;
  /** Exception id, used to deep-link the "Progress" tab to the Audit Log. */
  exceptionId: string;
  evidence: ReturnType<typeof buildEvidence>;
  timeline: ReturnType<typeof buildTimeline>;
  actionBlock: ReactNode;
}) {
  return (
    <div>
      <Tabs
        variant="underline"
        size="sm"
        value={activeTab}
        onChange={onTabChange}
        items={[
          { value: "action", label: "Recommended action" },
          { value: "evidence", label: "Evidence" },
          // Renamed "Timeline" -> "Progress" (lifecycle stepper). The tab VALUE
          // stays "timeline" so nothing keyed on it breaks; only the label
          // changed. A bridge link to the full Audit Log sits at the bottom of
          // this tab's content.
          { value: "timeline", label: "Progress" },
          { value: "notes", label: "Notes" },
        ]}
      />

      <div className="px-2 pt-3">
        {activeTab === "action" ? actionBlock : null}

        {activeTab === "evidence" ? (
          <div>
            {/* All source events are shown inline — no disclosure toggle
                (feedback: no extra click layer). */}
            <p className="px-1 py-1.5 text-body-s font-medium text-fg-primary">
              Source event log ({evidence.length})
            </p>
            <ul className="mt-2 flex flex-col gap-2">
              {evidence.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start gap-2.5 rounded-md border border-border-subtle p-2.5"
                >
                  {/* Source-system health AT THE TIME the event was logged —
                      the same status-dot vocabulary as SourceHealthControl
                      (STATUS_DOT), NOT an epistemic tag. Same system can read
                      healthy at an earlier entry and degraded/down at a later
                      one. */}
                  <span
                    title={`${event.source} ${STATUS_WORD[event.healthStatus]} at ${event.time}`}
                    aria-label={`${event.source} ${STATUS_WORD[event.healthStatus]} at ${event.time}`}
                    className="mt-1 flex shrink-0 items-center"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        STATUS_DOT[event.healthStatus],
                      )}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-caption text-fg-muted">
                      <span className="font-medium text-fg-secondary">
                        {event.source}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{event.time}</span>
                    </div>
                    <p className="mt-0.5 text-body-s text-fg-secondary">
                      {event.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {activeTab === "timeline" ? (
          <div>
          <ol className="flex flex-col pl-1">
            {timeline.map((step, i) => {
              const isLast = i === timeline.length - 1;
              // Connector runs from this dot down to the next; it is
              // "traversed" (completed color) only when this step is done
              // (item E3). The last step draws no trailing connector.
              const connectorDone = step.state === "done";
              return (
                <li key={step.id} className="flex items-stretch gap-2.5">
                  {/* Dot + connector rail (item E3). */}
                  <div className="flex shrink-0 flex-col items-center">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                        step.state === "done" &&
                          "border-success-border bg-success-surface text-success-fg",
                        step.state === "current" &&
                          "border-primary-700 bg-selection-surface text-primary-700",
                        step.state === "upcoming" &&
                          "border-border-strong bg-surface-raised",
                      )}
                    >
                      {step.state === "done" ? (
                        <Check className="size-2.5" />
                      ) : null}
                    </span>
                    {!isLast ? (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-1 w-px flex-1",
                          connectorDone
                            ? "bg-success-border"
                            : "bg-border-strong",
                        )}
                      />
                    ) : null}
                  </div>
                  {/* Label + time, with a wider gap below each step (item E3). */}
                  <div className={cn("min-w-0 flex-1", !isLast && "pb-5")}>
                    <p
                      className={cn(
                        "text-body-s",
                        step.state === "upcoming"
                          ? "text-fg-muted"
                          : "font-medium text-fg-primary",
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="text-caption text-fg-muted">{step.time}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          {/* Bridge to the full history — the Progress tab shows the lifecycle
              stepper; the Audit Log holds the complete immutable event record.
              Deep-links pre-filtered to this exception. */}
          <div className="mt-2 border-t border-border-subtle pt-3 pl-1">
            <Link
              href={`/audit-log?exception=${exceptionId}`}
              className="text-label-m"
            >
              View full history in Audit Log
              <MoveUpRight className="size-3.5 shrink-0" aria-hidden="true" />
            </Link>
          </div>
          </div>
        ) : null}

        {activeTab === "notes" ? (
          <TextArea
            label="Dispatcher notes"
            placeholder="Add a note for the next shift or the resolving team."
            rows={4}
          />
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar metadata helpers.
// ---------------------------------------------------------------------------

/**
 * A labelled sidebar metadata row with an illustrative leading icon (item 7c).
 * The icon sits in front of the label/value stack.
 */
function MetaBlock({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <span
        className=" flex size-5 shrink-0 items-center justify-center text-fg-muted [&>svg]:size-4"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-caption font-medium uppercase tracking-wide text-fg-muted">
          {label}
        </span>
        {children}
      </div>
    </div>
  );
}
