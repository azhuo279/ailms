import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { withStarling } from "../../plugin/next";

const ROUTE = ["api", "starling", "[action]", "route.ts"];

describe("withStarling — auto-route scaffolding", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "starling-next-"));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("creates the route file under src/app when present", () => {
    mkdirSync(join(root, "src/app"), { recursive: true });
    withStarling({}, { root, enabled: true });
    const file = join(root, "src/app", ...ROUTE);
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, "utf8")).toContain("createStarlingRoute");
  });

  it("creates the route file under app/ when there's no src/app", () => {
    mkdirSync(join(root, "app"), { recursive: true });
    withStarling({}, { root, enabled: true });
    expect(existsSync(join(root, "app", ...ROUTE))).toBe(true);
  });

  it("is idempotent — doesn't overwrite an existing route file", () => {
    const dir = join(root, "src/app", "api", "starling", "[action]");
    mkdirSync(dir, { recursive: true });
    const file = join(dir, "route.ts");
    // Pre-write a customized file; scaffolding must leave it untouched.
    writeFileSync(file, "// mine\n");
    withStarling({}, { root, enabled: true });
    expect(readFileSync(file, "utf8")).toBe("// mine\n");
  });

  it("does nothing when autoRoute is false", () => {
    mkdirSync(join(root, "src/app"), { recursive: true });
    withStarling({}, { root, enabled: true, autoRoute: false });
    expect(existsSync(join(root, "src/app", ...ROUTE))).toBe(false);
  });

  it("skips scaffolding when disabled (e.g. production)", () => {
    mkdirSync(join(root, "src/app"), { recursive: true });
    withStarling({}, { root, enabled: false });
    expect(existsSync(join(root, "src/app", ...ROUTE))).toBe(false);
  });

  it("skips when no app directory exists", () => {
    withStarling({}, { root, enabled: true });
    expect(existsSync(join(root, "app", ...ROUTE))).toBe(false);
    expect(existsSync(join(root, "src/app", ...ROUTE))).toBe(false);
  });
});
