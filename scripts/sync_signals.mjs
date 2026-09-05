/* Copy the hand-synced regions from aliquoto, which is canonical, into the other
 * tools. DEPENDENCIES.md used to say "re-copy by hand"; this is that sentence
 * turned into something that runs.
 *
 * Two marked regions travel:
 *   - the signal-source block, which must exist in the page script AND inside
 *     each worklet template literal, so every copy in the file is replaced;
 *   - the sound-analysis block, which is main-thread only, so a tool that does
 *     not carry one is left alone rather than given one.
 *
 * Usage:  node anexacta/scripts/sync_signals.mjs [--check] [tool ...]
 *         --check reports drift and exits 1 without writing.
 *
 * Run check_signals.mjs afterwards - this moves text, it does not test it.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CANON = "aliquoto";

const REGIONS = [
  { name: "signal sources", start: "/* ---------- signal sources - suite arc 1.1 ----------",
    end: "/* ---------- end signal sources ---------- */", everyCopy: true },
  { name: "sound analysis", start: "/* ---------- sound analysis - suite arc 1.2 ----------",
    end: "/* ---------- end sound analysis ---------- */", everyCopy: false },
];

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const named = args.filter((a) => !a.startsWith("--"));
const tools = (named.length ? named : ["cella", "moire"]).filter((t) => t !== CANON);

function extract(src, r) {
  const i = src.indexOf(r.start);
  if (i < 0) return null;
  const j = src.indexOf(r.end, i);
  if (j < 0) throw new Error(`region "${r.name}" has no end marker`);
  return src.slice(i, j + r.end.length);
}

function replaceAll(src, r, text) {
  let out = "", from = 0, n = 0;
  for (;;) {
    const i = src.indexOf(r.start, from);
    if (i < 0) break;
    const j = src.indexOf(r.end, i);
    if (j < 0) throw new Error(`region "${r.name}" has no end marker`);
    out += src.slice(from, i) + text;
    from = j + r.end.length;
    n++;
    if (!r.everyCopy) break;
  }
  return { text: out + src.slice(from), n };
}

const canonSrc = readFileSync(join(ROOT, CANON, "index.html"), "utf8");
const canonical = REGIONS.map((r) => [r, extract(canonSrc, r)]);
for (const [r, t] of canonical)
  if (!t) throw new Error(`${CANON} has no "${r.name}" region to copy from`);

let drift = 0, wrote = 0;
for (const tool of tools) {
  const path = join(ROOT, tool, "index.html");
  let src = readFileSync(path, "utf8");
  const before = src;
  for (const [r, text] of canonical) {
    const have = extract(src, r);
    if (have == null) {
      console.log(`  --    ${tool}: no "${r.name}" region, left alone`);
      continue;
    }
    const { text: next, n } = replaceAll(src, r, text);
    const changed = next !== src;
    src = next;
    console.log(`  ${changed ? "sync" : "ok  "}  ${tool}: "${r.name}" (${n} cop${n === 1 ? "y" : "ies"})${changed ? " updated" : " already matches"}`);
    if (changed) drift++;
  }
  if (src !== before) {
    if (checkOnly) continue;
    writeFileSync(path, src);
    wrote++;
  }
}

if (checkOnly) {
  console.log(drift ? `\n${drift} region(s) have drifted from ${CANON}` : "\nno drift");
  process.exit(drift ? 1 : 0);
}
console.log(`\n${wrote} file(s) rewritten. Run: node scripts/check_signals.mjs`);
