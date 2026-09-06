/* Copy the hand-synced regions from aliquoto, which is canonical, into the tools
 * that have not been extracted yet.
 *
 * Aliquoto's engine now lives in ES modules, so its signal block is `signals.js`
 * and there is exactly one copy of it: the page and the worklet both import it,
 * and drift between them is no longer representable. Cella and moire still carry
 * the block inline, twice each, so they still need copying into - which is what
 * this does, and what it will stop needing to do as each is extracted.
 *
 * What travels is the CODE, from the first function to the end marker. Each file
 * keeps its own header comment, because the comment says something different in
 * a module that is imported than in a block that is pasted.
 *
 * Usage:  node anexacta/scripts/sync_signals.mjs [--check] [tool ...]
 *         --check reports drift and exits 1 without writing.
 *
 * Run check_signals.mjs afterwards - this moves text, it does not test it.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const CODE_START = "function mulberry32(s){";
const SIG_END = "/* ---------- end signal sources ---------- */";
const AN_START = "const AN_FFT=";
const AN_END = "/* ---------- end sound analysis ---------- */";

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const named = args.filter((a) => !a.startsWith("--"));
const tools = named.length ? named : ["cella", "moire"];

function span(src, start, end, what) {
  const i = src.indexOf(start);
  if (i < 0) return null;
  const j = src.indexOf(end, i);
  if (j < 0) throw new Error(`${what}: found "${start}" with no end marker`);
  return { i, j: j + end.length, text: src.slice(i, j + end.length) };
}

/* Canonical text comes from the extracted modules where they exist, and from
   aliquoto's index.html where they do not - so this keeps working mid-extraction. */
function canonical(file, start, end, what) {
  const modPath = join(ROOT, "aliquoto", file);
  if (existsSync(modPath)) {
    const s = span(readFileSync(modPath, "utf8"), start, end, what);
    if (s) return s.text;
  }
  const s = span(readFileSync(join(ROOT, "aliquoto", "index.html"), "utf8"), start, end, what);
  if (!s) throw new Error(`no canonical ${what} found`);
  return s.text;
}

const REGIONS = [
  { name: "signal sources", file: "signals.js", start: CODE_START, end: SIG_END, everyCopy: true },
  { name: "sound analysis", file: "analysis.js", start: AN_START, end: AN_END, everyCopy: false },
];
for (const r of REGIONS) r.text = canonical(r.file, r.start, r.end, r.name);

let drift = 0, wrote = 0;
for (const tool of tools) {
  const path = join(ROOT, tool, "index.html");
  if (!existsSync(path)) { console.log(`  --    ${tool}: no index.html`); continue; }
  let src = readFileSync(path, "utf8");
  const before = src;
  for (const r of REGIONS) {
    let n = 0, changed = false, from = 0;
    for (;;) {
      const i = src.indexOf(r.start, from);
      if (i < 0) break;
      const e = src.indexOf(r.end, i);
      if (e < 0) throw new Error(`${tool} ${r.name}: copy at ${i} has no end marker`);
      const j = e + r.end.length;
      if (src.slice(i, j) !== r.text) changed = true;
      src = src.slice(0, i) + r.text + src.slice(j);
      from = i + r.text.length;
      n++;
      if (!r.everyCopy) break;
    }
    if (n === 0) { console.log(`  --    ${tool}: no "${r.name}" region, left alone`); continue; }
    console.log(`  ${changed ? "sync" : "ok  "}  ${tool}: "${r.name}" (${n} cop${n === 1 ? "y" : "ies"})${changed ? " updated" : " already matches"}`);
    if (changed) drift++;
  }
  if (src !== before && !checkOnly) { writeFileSync(path, src); wrote++; }
}

console.log("\n  note  aliquoto is extracted: its signal block is signals.js, imported by\n" +
            "        both the page and worklet.js, so it has one copy and cannot drift.");

if (checkOnly) {
  console.log(drift ? `\n${drift} region(s) have drifted from aliquoto` : "\nno drift");
  process.exit(drift ? 1 : 0);
}
console.log(`\n${wrote} file(s) rewritten. Run: node scripts/check_signals.mjs`);
