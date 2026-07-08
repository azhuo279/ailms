import type { AuditActor, AuditEvent, AuditTier } from "./audit-log-types";
import type { PriorityTier } from "@/app/workspace/lib/exception-types";

/**
 * Session audit-event builders — turn a confirmed workspace action into a
 * domain-shaped `AuditEvent` for the session overlay (useAuditSessionStore),
 * kept out of the components so the event shape stays in one testable place
 * beside the audit-log domain it belongs to.
 *
 * A priority-tier change maps to the fixed `tier_routing` event type: the enum
 * value that literally denotes a priority-tier routing action. `override` is
 * intentionally NOT used here, it denotes overriding an AI recommendation
 * (an action-level before/after), whereas this is a pure priority reprioritise.
 */

/**
 * The current human dispatcher, mocked to match the existing audit-log actor
 * convention (a real build reads this from the session/auth context). Reuses
 * the same id/name/role/kind shape the fetched fixture uses so the User filter
 * facet and the AI-vs-human treatment resolve identically.
 */
export const SESSION_DISPATCHER: AuditActor = {
  id: "usr-msantos",
  name: "Maria Santos",
  role: "Dispatcher",
  kind: "human",
};

export interface DismissEventInput {
  exceptionId: string;
  shipmentId: string;
  tier: PriorityTier;
  note?: string;
}

export function buildDismissAuditEvent(input: DismissEventInput): AuditEvent {
  const note = input.note?.trim() ? input.note.trim() : undefined;
  return {
    id: `aud-session-dismiss-${input.exceptionId}-${Date.now()}`,
    exceptionId: input.exceptionId,
    shipmentId: input.shipmentId,
    type: "dismiss",
    actor: SESSION_DISPATCHER,
    timestamp: new Date().toISOString(),
    tier: input.tier as AuditTier,
    content: `Exception dismissed from feed.${note ? ` Note: **${note}**` : ""}`,
    context: {
      ...(note ? { note } : {}),
    },
  };
}

export interface TierChangeEventInput {
  exceptionId: string;
  shipmentId: string;
  /** Tier before the change (for the drawer before/after context). */
  fromTier: PriorityTier;
  /** Tier after the change — the event's `tier`. */
  toTier: PriorityTier;
  /** Human label of the destination tier, e.g. "T2 High". */
  toTierLabel: string;
  /** Human label of the source tier, e.g. "T1 Critical". */
  fromTierLabel: string;
  /** Selected change-reason label, e.g. "Deadline adjustment". */
  reasonLabel: string;
  /** Optional free-text note captured with the change. */
  note?: string;
}

/**
 * Builds a `tier_routing` audit event for a confirmed priority change. The
 * content is one scannable line with the destination tier and reason bolded
 * (mock-data **bold** convention, no em-dashes); the before/after tiers and the
 * optional note ride in the structured `context` the drawer renders.
 */
export function buildTierChangeAuditEvent(
  input: TierChangeEventInput,
): AuditEvent {
  const note = input.note?.trim() ? input.note.trim() : undefined;
  return {
    // Session ids are namespaced so they never collide with fetched `aud-*` ids.
    id: `aud-session-${input.exceptionId}-${Date.now()}`,
    exceptionId: input.exceptionId,
    shipmentId: input.shipmentId,
    type: "tier_routing",
    actor: SESSION_DISPATCHER,
    timestamp: new Date().toISOString(),
    tier: input.toTier as AuditTier,
    content: `Changed priority to **${input.toTierLabel}**. Reason: **${input.reasonLabel}**.`,
    context: {
      changes: [
        {
          label: "Priority",
          before: input.fromTierLabel,
          after: input.toTierLabel,
        },
      ],
      ...(note ? { note } : {}),
    },
  };
}
