import { describe, it, expect, vi, afterEach } from "vitest";
import { saveSnapshotToEndpoint } from "../../src/compile/download";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("saveSnapshotToEndpoint", () => {
  it("POSTs appId + basename + both artifacts and returns the saved row id", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "row-1", savedAt: "2026-06-15T00:00:00.000Z" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await saveSnapshotToEndpoint(
      "/api/starling/save",
      "agentic-spar",
      "starling-1-annotation",
      "# md",
      '{"version":1}',
    );

    expect(result).toEqual({
      id: "row-1",
      savedAt: "2026-06-15T00:00:00.000Z",
      author: null,
    });
    const init = fetchMock.mock.calls[0]![1];
    const body = JSON.parse(init.body);
    expect(body).toEqual({
      appId: "agentic-spar",
      basename: "starling-1-annotation",
      markdown: "# md",
      sessionJson: '{"version":1}',
    });
  });

  it("returns the server-stamped author from git config user.name", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "a", savedAt: "t", author: "Ada Lovelace" }),
      }),
    );
    const result = await saveSnapshotToEndpoint("/x", "app", "b", "md", "{}");
    expect(result?.author).toBe("Ada Lovelace");
  });

  it("falls back to a null author when the server omits it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "a", savedAt: "t" }),
      }),
    );
    const result = await saveSnapshotToEndpoint("/x", "app", "b", "md", "{}");
    expect(result?.author).toBeNull();
  });

  it("strips any extension from the basename before posting", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "a", savedAt: "t" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await saveSnapshotToEndpoint("/x", "app", "snap.starling.json", "md", "{}");
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(body.basename).toBe("snap");
  });

  it("returns null on a non-OK response (caller surfaces an error)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await saveSnapshotToEndpoint("/x", "app", "b", "md", "{}")).toBeNull();
  });

  it("returns null on a network error and never throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await saveSnapshotToEndpoint("/x", "app", "b", "md", "{}")).toBeNull();
  });

  it("returns null when the response is missing the row id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    );
    expect(await saveSnapshotToEndpoint("/x", "app", "b", "md", "{}")).toBeNull();
  });
});
