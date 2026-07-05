#!/usr/bin/env node
/**
 * One-time migration: import existing `annotations/*.starling.json` snapshots
 * into the shared remote store via the same `insertSnapshot` function the live
 * save path uses. Run once, then the `annotations/` folder can be deleted.
 *
 * Usage:
 *   node starling/scripts/migrate-annotations.mjs [--app <id>] [--dir <path>] [--dry]
 *
 * Defaults: --app agentic-spar, --dir <repo-root>/annotations.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { insertSnapshot } from "../dist/plugin/snapshots.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", ".."); // starling/scripts → repo root
const JSON_SUFFIX = ".starling.json";

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    if (key === "dry") flags.dry = true;
    else flags[key] = argv[++i];
  }
  return flags;
}

const args = parseArgs(process.argv.slice(2));
const appId = args.app ?? "agentic-spar";
const dir = resolve(args.dir ?? join(REPO_ROOT, "annotations"));

let files;
try {
  files = readdirSync(dir).filter((n) => n.endsWith(JSON_SUFFIX));
} catch {
  console.error(`No annotations directory at ${dir}`);
  process.exit(1);
}

if (files.length === 0) {
  console.log(`No ${JSON_SUFFIX} files in ${dir}; nothing to migrate.`);
  process.exit(0);
}

console.log(`Migrating ${files.length} snapshot(s) from ${dir} → app "${appId}"`);

let ok = 0;
for (const filename of files) {
  const basename = filename.slice(0, -JSON_SUFFIX.length);
  const sessionJson = readFileSync(join(dir, filename), "utf8");

  let session = {};
  try {
    session = JSON.parse(sessionJson);
  } catch {
    console.warn(`  ! ${filename}: unparseable JSON, skipping`);
    continue;
  }

  // Pair the human-readable Markdown if present.
  let markdown = "";
  try {
    markdown = readFileSync(join(dir, `${basename}.md`), "utf8");
  } catch {
    /* no companion .md — fine */
  }

  const savedAt = session.savedAt ?? new Date().toISOString();
  const author = session.author ?? null;

  if (args.dry) {
    const count = Array.isArray(session.annotations) ? session.annotations.length : 0;
    console.log(`  (dry) ${basename}: ${count} annotations, savedAt ${savedAt}, by ${author ?? "unknown"}`);
    continue;
  }

  try {
    const { id } = await insertSnapshot({
      appId,
      basename,
      sessionJson,
      markdown,
      author,
      savedAt,
    });
    ok++;
    console.log(`  ✓ ${basename} → ${id}`);
  } catch (err) {
    console.error(`  ✗ ${basename}: ${err?.message ?? err}`);
  }
}

if (!args.dry) console.log(`Done — ${ok}/${files.length} inserted.`);
