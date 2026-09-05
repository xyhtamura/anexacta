/* Suite arc 1.1 - checks the signal-source seam across Anexacta.
 *
 * Three things, none of which a passing page load would tell you:
 *
 *   1. Every copy of the shared source block is byte-identical. The DSL is
 *      hand-synced between aliquoto, cella and moire (DEPENDENCIES.md), and the
 *      main thread and the worklet each hold their own copy, so six sites can
 *      drift silently. A drifted copy means an exported WAV no longer matches
 *      what was played.
 *   2. Both the page script and the worklet source parse. The worklet is a
 *      template literal, so it is evaluated as one before parsing rather than
 *      read as raw text - reading the raw text is what let Spolium ship a
 *      worklet that threw on every construction while its tests passed.
 *   3. The sources behave: rnd is in [0,1) and repeats under one seed, noise is
 *      in [-1,1], continuous, and not constant.
 *
 * Usage:  node anexacta/scripts/check_signals.mjs [tool ...]
 *         node anexacta/scripts/check_signals.mjs            # all of them
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ALL = ["aliquoto", "cella", "moire"];
const tools = process.argv.slice(2).length ? process.argv.slice(2) : ALL;

let failures = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${msg}`);
  if (!ok) failures++;
};

/* ---------- extraction ---------- */

const BLOCK_START = "/* ---------- signal sources - suite arc 1.1 ----------";
const BLOCK_END = /\nfunction voiceSeed\([^\n]*\n/;

function blocks(src) {
  const out = [];
  let from = 0;
  for (;;) {
    const i = src.indexOf(BLOCK_START, from);
    if (i < 0) break;
    const rest = src.slice(i);
    const m = rest.match(BLOCK_END);
    if (!m) throw new Error("signal block at offset " + i + " has no voiceSeed terminator");
    out.push(rest.slice(0, m.index + m[0].length));
    from = i + m.index + m[0].length;
  }
  return out;
}

/** The page's own inline script (the last <script> with no src). */
function pageScript(src) {
  const re = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  const found = [...src.matchAll(re)].map((m) => m[1]);
  if (!found.length) throw new Error("no inline <script> found");
  return found[found.length - 1];
}

/** The worklet source as the browser sees it - the template literal evaluated. */
function workletSource(src) {
  const key = src.includes("const WORKLET_SRC=`") ? "const WORKLET_SRC=`" : null;
  if (!key) return null;
  const i = src.indexOf(key) + key.length - 1; // at the opening backtick
  let j = i + 1;
  while (j < src.length) {
    if (src[j] === "\\") { j += 2; continue; }
    if (src[j] === "`") break;
    j++;
  }
  if (j >= src.length) throw new Error("unterminated WORKLET_SRC template literal");
  const literal = src.slice(i, j + 1);
  return vm.runInNewContext("(" + literal + ")");
}

function parses(code, label) {
  try {
    new vm.Script(code, { filename: label });
    return true;
  } catch (e) {
    console.log(`        ${e.message}`);
    return false;
  }
}

/* ---------- behaviour ---------- */

function behaviour(block, label) {
  const api = vm.runInNewContext(
    block + "\n({mulberry32,hash32,perlin1,SIGNALS,SIGKEYS,makeSignalBank,voiceSeed})"
  );
  const { makeSignalBank, voiceSeed } = api;

  const a = makeSignalBank(1234), b = makeSignalBank(1234), c = makeSignalBank(1235);
  const draw = (bank) => Array.from({ length: 64 }, () => bank.rnd());

  const seqA = draw(a), seqB = draw(b), seqC = draw(c);
  check(seqA.every((v, i) => v === seqB[i]), `${label}: one seed replays the same rnd stream`);
  check(seqA.some((v, i) => v !== seqC[i]), `${label}: a different seed draws a different stream`);
  check(seqA.every((v) => v >= 0 && v < 1), `${label}: rnd() stays in [0,1)`);

  const scaled = makeSignalBank(7);
  const lohi = Array.from({ length: 256 }, () => scaled.rnd(2, 5));
  check(lohi.every((v) => v >= 2 && v <= 5), `${label}: rnd(lo,hi) stays in range`);
  const only = makeSignalBank(7);
  check(Array.from({ length: 256 }, () => only.rnd(3)).every((v) => v >= 0 && v <= 3),
    `${label}: rnd(max) stays in range`);

  const n = makeSignalBank(99).noise;
  const xs = Array.from({ length: 4000 }, (_, i) => i * 0.017);
  const vals = xs.map(n);
  check(vals.every((v) => v >= -1 && v <= 1), `${label}: noise(x) stays in [-1,1]`);
  check(Math.max(...vals) - Math.min(...vals) > 0.5, `${label}: noise(x) actually varies`);
  const jumps = vals.slice(1).map((v, i) => Math.abs(v - vals[i]));
  check(Math.max(...jumps) < 0.2, `${label}: noise(x) is continuous, not hash (max step ${Math.max(...jumps).toFixed(3)})`);
  check(n(3.25) === makeSignalBank(99).noise(3.25), `${label}: noise(x) is a field, not a stream`);
  check(n(0) === 0 && n(5) === 0, `${label}: noise is zero at integer lattice points`);
  check(makeSignalBank(99).noise(3.25) !== makeSignalBank(100).noise(3.25),
    `${label}: a different seed gives a different field`);

  check(voiceSeed(1, 440, 0) === voiceSeed(1, 440, 0), `${label}: voiceSeed is stable for one voice`);
  check(voiceSeed(1, 440, 0) !== voiceSeed(1, 441, 0), `${label}: voiceSeed separates pitches`);
  check(voiceSeed(1, 440, 0) !== voiceSeed(2, 440, 0), `${label}: voiceSeed follows the patch seed`);
  check(voiceSeed(1, 440, 0) !== voiceSeed(1, 440, 1), `${label}: voiceSeed separates repeats of one key`);
  const spread = new Set(Array.from({ length: 512 }, (_, i) => voiceSeed(1, 440, i)));
  check(spread.size === 512, `${label}: 512 repeats of one key draw 512 distinct seeds`);
}

/* ---------- run ---------- */

const canon = [];
for (const tool of tools) {
  const path = join(ROOT, tool, "index.html");
  let src;
  try {
    src = readFileSync(path, "utf8");
  } catch {
    console.log(`\n${tool}\n  SKIP  no index.html at ${path}`);
    continue;
  }
  console.log(`\n${tool}`);

  const found = blocks(src);
  check(found.length >= 1, `${tool}: carries the shared signal block (${found.length} copies)`);
  if (!found.length) continue;
  check(found.every((b) => b === found[0]), `${tool}: its copies of the block agree with each other`);
  canon.push([tool, found[0]]);

  check(parses(pageScript(src), `${tool}/page`), `${tool}: page script parses`);
  const w = workletSource(src);
  if (w == null) console.log(`  --    ${tool}: no WORKLET_SRC template literal`);
  else {
    check(parses(w, `${tool}/worklet`), `${tool}: worklet source parses as the browser gets it`);
    check(blocks(w).length === 1, `${tool}: the worklet carries the block too`);
  }

  behaviour(found[0], tool);
}

if (canon.length > 1) {
  console.log("\ncross-tool");
  const [refTool, ref] = canon[0];
  for (const [tool, b] of canon.slice(1))
    check(b === ref, `${tool} block is byte-identical to ${refTool}`);
}

console.log(`\n${failures ? failures + " FAILED" : "all checks passed"}`);
process.exit(failures ? 1 : 0);
