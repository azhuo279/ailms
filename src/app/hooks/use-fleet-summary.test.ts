import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchFleetSummary } from "./use-fleet-summary";

// SCAFFOLD EXAMPLE — demonstrates the §5 fetcher test pattern. Delete when the
// example fleet-summary feed is removed. See SCAFFOLD.md.
describe("fetchFleetSummary", () => {
  afterEach(() => vi.restoreAllMocks());

  it("parses a valid fixture", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          inTransit: 1,
          delivered: 2,
          delayed: 0,
          pending: 3,
          onTimeRate: 0.9,
          updatedAt: "2026-07-03T00:00:00.000Z",
        }),
      }),
    );

    await expect(fetchFleetSummary()).resolves.toMatchObject({ inTransit: 1 });
  });

  it("throws on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    await expect(fetchFleetSummary()).rejects.toThrow(/500/);
  });

  it("rejects a malformed fixture at the boundary", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ inTransit: "not-a-number" }),
      }),
    );

    await expect(fetchFleetSummary()).rejects.toBeInstanceOf(Error);
  });
});
