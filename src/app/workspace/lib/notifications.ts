/**
 * Route-local mock notifications source for the workspace bell (UI shell). There
 * is no real notification store yet, so this stands in with a small, realistic
 * feed of two kinds:
 *   - "feed"  → exception-feed updates (new/escalated exceptions)
 *   - "brief" → AI-authored briefs (shift summaries)
 *
 * Copy is scannable with key phrases bolded via **markers** the panel renders as
 * <strong>. Swap this for a real fetch hook when the notification service lands;
 * the WorkspaceNotification shape is the contract to preserve.
 */

export type NotificationKind = "feed" | "brief";

export interface WorkspaceNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  /** Short scannable body. Wrap key phrases in **double asterisks** to bold. */
  body: string;
  /** Pre-rendered relative timestamp label, e.g. "4m ago". */
  timeAgo: string;
  read: boolean;
}

export const MOCK_NOTIFICATIONS: WorkspaceNotification[] = [
  {
    id: "ntf-01",
    kind: "brief",
    title: "Morning brief ready",
    body: "**3 critical exceptions** across your cluster, up from 1 at last shift close. Laredo leads the load.",
    timeAgo: "2m ago",
    read: false,
  },
  {
    id: "ntf-02",
    kind: "feed",
    title: "New critical exception",
    body: "Customs hold at the **Laredo World Trade Bridge** tied to two Gold-tier orders. SLA window closes in under 4 hours.",
    timeAgo: "9m ago",
    read: false,
  },
  {
    id: "ntf-03",
    kind: "feed",
    title: "Exception escalated",
    body: "**exc-1010** moved to the escalated queue after a third silent carrier tender at Corpus Christi Port.",
    timeAgo: "24m ago",
    read: false,
  },
  {
    id: "ntf-04",
    kind: "feed",
    title: "Source feed degraded",
    body: "**SignalTrack** GPS pings are running 8 to 15 minutes late, so two cold-chain loads read as inferred.",
    timeAgo: "41m ago",
    read: true,
  },
  {
    id: "ntf-05",
    kind: "brief",
    title: "Cluster trend",
    body: "Dock congestion at **San Marcos Fulfillment** cleared. No open exceptions there for the first time today.",
    timeAgo: "1h ago",
    read: true,
  },
  {
    id: "ntf-06",
    kind: "feed",
    title: "Exception delegated",
    body: "**exc-1014** assigned to the customs broker with a note on the HS-code correction.",
    timeAgo: "2h ago",
    read: true,
  },
];
