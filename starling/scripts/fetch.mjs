#!/usr/bin/env node
/**
 * Agent entrypoint for reading Starling annotations from the shared store.
 *
 * This is a THIN runner over the shared data-access functions in
 * `plugin/snapshots.ts` (built to `dist/plugin/snapshots.js`) — it parses flags,
 * `await`s those same functions the app's Rewind path uses, and prints the
 * result. No query logic lives here.
 *
 * A prompter describes a snapshot by metadata, never by id ("the latest", "from
 * zhuo.andy", "from last Tuesday"); these flags map 1:1 to that metadata so an
 * agent can resolve the right snapshot itself.
 *
 * Usage:
 *   node starling/scripts/fetch.mjs --app <id> [filters...]              # list metadata
 *   node starling/scripts/fetch.mjs --app <id> [filters...] --content    # + print content
 *   node starling/scripts/fetch.mjs --app <id> --id <rowId> --content     # direct by id
 *
 * Filters: --author <substr> --since <ISO> --until <ISO> --basename <substr>
 *          --latest --limit <n>
 * Content: --content [--md | --json]   (default --md)
 *
 * Examples:
 *   node starling/scripts/fetch.mjs --app agentic-spar --latest --content
 *   node starling/scripts/fetch.mjs --app agentic-spar --author zhuo --since 2026-06-10
 */
import { fetchSnapshot, fetchSnapshots } from "../dist/plugin/snapshots.js";

function parseArgs(argv) {
  const flags = {};
  const bool = new Set(["latest", "content", "md", "json"]);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    if (bool.has(key)) {
      flags[key] = true;
    } else {
      flags[key] = argv[++i];
    }
  }
  return flags;
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
if (!args.app) {
  fail("starling fetch: --app <id> is required (e.g. --app agentic-spar)");
}

const query = {
  appId: args.app,
  author: args.author,
  since: args.since,
  until: args.until,
  basename: args.basename,
  latest: Boolean(args.latest),
  limit: args.limit != null ? Number(args.limit) : undefined,
};

// Direct-by-id shortcut.
if (args.id) {
  const found = await fetchSnapshot({ appId: args.app, id: args.id });
  if (!found) fail(`starling fetch: no snapshot ${args.id} for app ${args.app}`);
  process.stdout.write(args.json ? found.session : found.markdown);
  process.stdout.write("\n");
  process.exit(0);
}

const snapshots = await fetchSnapshots(query);

if (snapshots.length === 0) {
  console.error("starling fetch: no snapshots matched.");
  process.exit(0);
}

// Without --content, just print the metadata listing for the agent to pick from.
if (!args.content) {
  for (const s of snapshots) {
    console.log(
      `${s.filename}\t${s.basename}\t${s.annotationCount} annotations\t${s.savedAt}\tby ${s.author ?? "unknown"}`,
    );
  }
  process.exit(0);
}

// --content: resolve to ONE snapshot, else show the list and ask to narrow down.
if (snapshots.length > 1) {
  console.error(
    `starling fetch: ${snapshots.length} snapshots matched — narrow the filters (or pass --id). Candidates:`,
  );
  for (const s of snapshots) {
    console.error(`  ${s.filename}\t${s.basename}\t${s.savedAt}\tby ${s.author ?? "unknown"}`);
  }
  process.exit(2);
}

const only = snapshots[0];
const found = await fetchSnapshot({ appId: args.app, id: only.filename });
if (!found) fail(`starling fetch: could not load snapshot ${only.filename}`);
process.stdout.write(args.json ? found.session : found.markdown);
process.stdout.write("\n");
