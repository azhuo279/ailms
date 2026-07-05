/**
 * Example: the route file that powers Starling's Compile + Rewind on Next.js.
 *
 * You normally DON'T need this — `withStarling()` in next.config.ts auto-creates
 * this exact file on dev startup. Use it only if you set `autoRoute: false` (to
 * manage the file yourself) by copying it to `app/api/starling/[action]/route.ts`.
 *
 * The `[action]` segment ("save" | "list" | "load") is read from the URL, so this
 * single catch-all file serves all three endpoints. Authorship is stamped
 * server-side from `git config user.name` (falling back to `user.email`) — the
 * browser can't read git — so saved snapshots and the Rewind session list show
 * "… by <name>" automatically.
 *
 * Dev-only by intent: keep the <Starling /> mount (and this route) out of prod.
 */
import { createStarlingRoute } from "@starling/dev/next/config";

export const { GET, POST } = createStarlingRoute();
