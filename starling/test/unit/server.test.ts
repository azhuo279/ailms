import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The server delegates all persistence to the data-access layer; mock it so
// these tests stay offline and assert delegation + git-author stamping only.
const insertSnapshot = vi.fn();
const fetchSnapshots = vi.fn();
const fetchSnapshot = vi.fn();
vi.mock("../../plugin/snapshots", () => ({
  insertSnapshot: (...args: unknown[]) => insertSnapshot(...args),
  fetchSnapshots: (...args: unknown[]) => fetchSnapshots(...args),
  fetchSnapshot: (...args: unknown[]) => fetchSnapshot(...args),
}));

const { listSnapshots, loadSnapshot, saveSnapshot } = await import(
  "../../plugin/server"
);

const SESSION = JSON.stringify({
  version: 1,
  sessionId: "s1",
  annotations: [{ id: "a", note: "hi" }],
});

describe("Starling dev-server core", () => {
  let root: string;

  beforeEach(() => {
    insertSnapshot.mockReset();
    fetchSnapshots.mockReset();
    fetchSnapshot.mockReset();
    insertSnapshot.mockResolvedValue({
      id: "row-1",
      savedAt: "stamped",
      author: null,
    });
    root = mkdtempSync(join(tmpdir(), "starling-"));
    // A real repo so `git config user.name` resolves deterministically.
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync("git", ["config", "user.name", "Ada Lovelace"], { cwd: root });
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("stamps git author + savedAt into the session and inserts it under appId", async () => {
    const res = await saveSnapshot(
      { appId: "agentic-spar", basename: "snap", markdown: "# md", sessionJson: SESSION },
      { root },
    );
    expect(res.author).toBe("Ada Lovelace");
    expect(res.id).toBe("row-1");

    expect(insertSnapshot).toHaveBeenCalledOnce();
    const input = insertSnapshot.mock.calls[0]![0];
    expect(input.appId).toBe("agentic-spar");
    expect(input.basename).toBe("snap");
    expect(input.markdown).toBe("# md");
    expect(input.author).toBe("Ada Lovelace");
    const stamped = JSON.parse(input.sessionJson);
    expect(stamped.author).toBe("Ada Lovelace");
    expect(typeof stamped.savedAt).toBe("string");
    expect(stamped.annotations).toHaveLength(1);
  });

  it("falls back to user.email when user.name is unset", async () => {
    execFileSync("git", ["config", "--unset", "user.name"], { cwd: root });
    execFileSync("git", ["config", "user.email", "ada@example.com"], { cwd: root });
    const res = await saveSnapshot(
      { appId: "app", basename: "snap", markdown: "x", sessionJson: SESSION },
      { root },
    );
    expect(res.author).toBe("ada@example.com");
  });

  it("lists snapshots by delegating to fetchSnapshots scoped by appId", async () => {
    fetchSnapshots.mockResolvedValue([
      { filename: "row-1", basename: "snap", annotationCount: 1, savedAt: "t", version: 1, author: "Ada Lovelace" },
    ]);
    const list = await listSnapshots("agentic-spar");
    expect(fetchSnapshots).toHaveBeenCalledWith({ appId: "agentic-spar" });
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ basename: "snap", author: "Ada Lovelace" });
  });

  it("loads a snapshot's session JSON by row id + appId", async () => {
    fetchSnapshot.mockResolvedValue({ session: SESSION, markdown: "x" });
    const raw = await loadSnapshot("row-1", "agentic-spar");
    expect(fetchSnapshot).toHaveBeenCalledWith({ appId: "agentic-spar", id: "row-1" });
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).sessionId).toBe("s1");
  });

  it("returns null (without hitting the store) when id or appId is missing", async () => {
    expect(await loadSnapshot("", "agentic-spar")).toBeNull();
    expect(await loadSnapshot("row-1", "")).toBeNull();
    expect(fetchSnapshot).not.toHaveBeenCalled();
  });

  it("returns null when the store has no matching snapshot", async () => {
    fetchSnapshot.mockResolvedValue(null);
    expect(await loadSnapshot("missing", "agentic-spar")).toBeNull();
  });
});
