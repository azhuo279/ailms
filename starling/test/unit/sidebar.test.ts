import { describe, it, expect, vi, beforeEach } from "vitest";
import { Sidebar, type SidebarCallbacks } from "../../src/ui/Sidebar";
import type { SnapshotMeta } from "../../src/types";

/**
 * The Rewind sidebar groups saved snapshots into one collapsible accordion per
 * save-day: the current day opens by default, older days stay collapsed, and the
 * day header carries a count tag summing that day's annotations. These tests pin
 * that grouping + open-state machine.
 */
describe("Sidebar day accordions", () => {
  let cb: SidebarCallbacks;
  let sidebar: Sidebar;

  beforeEach(() => {
    cb = {
      onJump: vi.fn(),
      onDelete: vi.fn(),
      onClose: vi.fn(),
      onSelectSession: vi.fn(),
    };
    sidebar = new Sidebar(cb);
  });

  /** A snapshot saved at `date` with `count` annotations. */
  const snap = (id: string, date: Date, count: number): SnapshotMeta => ({
    filename: id,
    basename: id,
    annotationCount: count,
    savedAt: date.toISOString(),
    version: 1,
    author: "Andy",
  });

  const daysAgo = (n: number, hour = 12): Date => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  const render = (snapshots: SnapshotMeta[], activeFilename: string | null = null) =>
    sidebar.render({
      liveAnnotations: [],
      snapshots,
      activeFilename,
      loadedAnnotations: null,
      currentRoute: "/",
      detachedIds: new Set(),
    });

  const dayGroups = () =>
    Array.from(sidebar.el.querySelectorAll<HTMLDivElement>(".pp-day-group"));
  const head = (g: HTMLElement) => g.querySelector<HTMLElement>(".pp-day-head")!;
  const count = (g: HTMLElement) =>
    g.querySelector<HTMLElement>(".pp-day-count")!.textContent;
  const collapsed = (g: HTMLElement) => g.classList.contains("pp-day-collapsed");

  it("makes one accordion per save-day, newest day first", () => {
    render([
      snap("a", daysAgo(0, 16), 5), // today
      snap("b", daysAgo(0, 9), 3), //  today (earlier)
      snap("c", daysAgo(5), 2), //     5 days ago
    ]);
    const groups = dayGroups();
    expect(groups).toHaveLength(2);
    // The first group is today (it carries both of today's snapshots).
    expect(groups[0]!.querySelectorAll(".pp-session-group")).toHaveLength(2);
    expect(groups[1]!.querySelectorAll(".pp-session-group")).toHaveLength(1);
  });

  it("counts total annotations across a day's snapshots, not snapshot count", () => {
    render([
      snap("a", daysAgo(0, 16), 5),
      snap("b", daysAgo(0, 9), 3),
      snap("c", daysAgo(5), 2),
    ]);
    const groups = dayGroups();
    expect(count(groups[0]!)).toBe("8"); // 5 + 3
    expect(count(groups[1]!)).toBe("2");
  });

  it("opens the current day by default and collapses older days", () => {
    render([snap("a", daysAgo(0), 4), snap("c", daysAgo(3), 1)]);
    const groups = dayGroups();
    expect(collapsed(groups[0]!)).toBe(false); // today
    expect(collapsed(groups[1]!)).toBe(true); //  older
  });

  it("toggles a day open/closed on header click, and the choice survives re-render", () => {
    const snaps = [snap("a", daysAgo(0), 4), snap("c", daysAgo(3), 1)];
    render(snaps);

    // Expand the older (collapsed) day.
    head(dayGroups()[1]!).click();
    expect(collapsed(dayGroups()[1]!)).toBe(false);

    // A fresh render (e.g. a snapshot-list refresh) keeps it expanded.
    render(snaps);
    expect(collapsed(dayGroups()[1]!)).toBe(false);
    expect(collapsed(dayGroups()[0]!)).toBe(false);

    // Collapsing today persists too.
    head(dayGroups()[0]!).click();
    render(snaps);
    expect(collapsed(dayGroups()[0]!)).toBe(true);
  });

  it("force-expands the day holding the selected snapshot so its notes stay visible", () => {
    const snaps = [snap("a", daysAgo(0), 4), snap("c", daysAgo(3), 1)];
    // Selecting the older snapshot should reveal its (otherwise collapsed) day.
    render(snaps, "c");
    expect(collapsed(dayGroups()[1]!)).toBe(false);
  });

  it("keeps the live Current-session group above the day accordions", () => {
    render([snap("a", daysAgo(0), 4)]);
    const firstGroup = sidebar.el.querySelector(".pp-sidebar-body")!
      .firstElementChild!;
    expect(firstGroup.classList.contains("pp-session-group")).toBe(true);
    expect(firstGroup.classList.contains("pp-day-group")).toBe(false);
    expect(firstGroup.textContent).toContain("Current session");
  });
});
