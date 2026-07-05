// ⚠️ SCAFFOLD EXAMPLE — safe to delete. Fake demo types showing the §5 pattern
// (domain types in route lib/, validated at the fetch boundary). Replace with
// real logistics domain types. See SCAFFOLD.md for the full example inventory.
import { z } from "zod";

/**
 * Domain types for the home overview's fleet summary feed. Validated at the
 * fetch boundary (framework doc §5). Domain types live in the route's lib/.
 */
export const fleetSummarySchema = z.object({
  inTransit: z.number().int().nonnegative(),
  delivered: z.number().int().nonnegative(),
  delayed: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  onTimeRate: z.number().min(0).max(1),
  updatedAt: z.string(),
});

export type FleetSummary = z.infer<typeof fleetSummarySchema>;
