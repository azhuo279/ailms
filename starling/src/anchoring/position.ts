/**
 * Position math for badges. The badge straddles the element's top-right corner,
 * sitting ~4px outside on both axes (equivalent to Tailwind's -top-1/-right-1),
 * and stays clamped into the viewport so it isn't clipped by overflow:hidden
 * ancestors or the screen edge (PRD §12).
 */
const BADGE = 18;
/** How far the badge pokes past the corner (px) — matches -top-1 / -right-1. */
const CORNER_OFFSET = 4;

export interface Point {
  left: number;
  top: number;
}

export function badgePosition(rect: DOMRect): Point {
  // Right edge of the badge sits CORNER_OFFSET px past the element's right edge.
  const left = Math.min(
    rect.right - BADGE + CORNER_OFFSET,
    window.innerWidth - BADGE - 2,
  );
  // Top edge of the badge sits CORNER_OFFSET px above the element's top edge.
  const top = Math.max(rect.top - CORNER_OFFSET, 2);
  return { left: Math.max(left, 2), top };
}

/**
 * Fan out badges that would overlap. Given desired points (in render order),
 * nudge any that collide with an already-placed one to the right. Keeps tiny
 * adjacent elements' badges readable (PRD §12 collision rule).
 */
export function fanOut(points: Point[]): Point[] {
  const placed: Point[] = [];
  const STEP = BADGE + 2;
  return points.map((p) => {
    let { left } = p;
    const { top } = p;
    let guard = 0;
    while (
      guard++ < 50 &&
      placed.some((q) => Math.abs(q.left - left) < BADGE && Math.abs(q.top - top) < BADGE)
    ) {
      left = Math.min(left + STEP, window.innerWidth - BADGE - 2);
    }
    const out = { left, top };
    placed.push(out);
    return out;
  });
}

/** Sticky position: just below-right of the badge, clamped into the viewport. */
export function stickyPosition(rect: DOMRect, stickyWidth = 220): Point {
  const left = Math.min(
    Math.max(rect.right - stickyWidth, 8),
    window.innerWidth - stickyWidth - 8,
  );
  const top = Math.min(Math.max(rect.top + 16, 8), window.innerHeight - 120);
  return { left, top };
}
