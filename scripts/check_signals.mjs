/* Suite arc 1.1-1.3 - checks the signal seam across Anexacta.
 *
 * All three engines are extracted into ES modules, so every check IMPORTS the
 * real code and runs it. Nothing is scraped and nothing is re-evaluated out of a
 * string. Each tool's page and worklet.js import the same signals.js, so there is
 * no second copy to disagree with, and what is left to ask is whether the modules
 * behave and whether a pasted copy has crept back in.
 *
 * The inline path below is kept for a tool that is not extracted - a new member,
 * or one mid-extraction. It evaluates a worklet as a template literal before
 * parsing it, because reading the raw text is what let Spolium ship a worklet
 * that threw on every construction while its tests passed.
 *
 * Usage:  node anexacta/scripts/check_signals.mjs [tool ...]
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
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

const BLOCK_START = "/* ---------- signal sources - suite arc 1.1 ----------";
const BLOCK_END = "/* ---------- end signal sources ---------- */";
const CODE_START = "function mulberry32(s){";

function blocks(src) {
  const out = [];
  let from = 0;
  for (;;) {
    const i = src.indexOf(BLOCK_START, from);
    if (i < 0) break;
    const j = src.indexOf(BLOCK_END, i);
    if (j < 0) throw new Error("signal block at offset " + i + " has no end marker");
    out.push(src.slice(i, j + BLOCK_END.length));
    from = j + BLOCK_END.length;
  }
  return out;
}
const codeOf = (block) => block.slice(block.indexOf(CODE_START));

function pageScript(src) {
  const re = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  const found = [...src.matchAll(re)].map((m) => m[1]);
  if (!found.length) throw new Error("no inline <script> found");
  return found[found.length - 1];
}

function workletSource(src) {
  const key = "WORKLET_SRC=`";
  const at = src.indexOf(key);
  if (at < 0) return null;
  const i = at + key.length - 1;
  let j = i + 1;
  while (j < src.length) {
    if (src[j] === "\\") { j += 2; continue; }
    if (src[j] === "`") break;
    j++;
  }
  if (j >= src.length) throw new Error("unterminated WORKLET_SRC template literal");
  return vm.runInNewContext("(" + src.slice(i, j + 1) + ")");
}

function parses(code, label) {
  try { new vm.Script(code, { filename: label }); return true; }
  catch (e) { console.log(`        ${e.message}`); return false; }
}

/* ---------- behaviour, run against whatever provides the API ---------- */
function behaviour(api, label) {
  const { makeSignalBank, voiceSeed, makeFileSource, makeWaveSource } = api;

  const a = makeSignalBank(1234), b = makeSignalBank(1234), c = makeSignalBank(1235);
  const draw = (bank) => Array.from({ length: 64 }, () => bank.rnd());
  const seqA = draw(a), seqB = draw(b), seqC = draw(c);
  check(seqA.every((v, i) => v === seqB[i]), `${label}: one seed replays the same rnd stream`);
  check(seqA.some((v, i) => v !== seqC[i]), `${label}: a different seed draws a different stream`);
  check(seqA.every((v) => v >= 0 && v < 1), `${label}: rnd() stays in [0,1)`);
  check(Array.from({ length: 256 }, () => makeSignalBank(7).rnd(2, 5)).every((v) => v >= 2 && v <= 5),
    `${label}: rnd(lo,hi) stays in range`);

  const n = makeSignalBank(99).noise;
  const vals = Array.from({ length: 4000 }, (_, i) => n(i * 0.017));
  check(vals.every((v) => v >= -1 && v <= 1), `${label}: noise(x) stays in [-1,1]`);
  check(Math.max(...vals) - Math.min(...vals) > 0.5, `${label}: noise(x) actually varies`);
  const jumps = vals.slice(1).map((v, i) => Math.abs(v - vals[i]));
  check(Math.max(...jumps) < 0.2, `${label}: noise(x) is continuous, not hash (max step ${Math.max(...jumps).toFixed(3)})`);
  check(n(0) === 0 && n(5) === 0, `${label}: noise is zero at integer lattice points`);
  check(makeSignalBank(99).noise(3.25) !== makeSignalBank(100).noise(3.25),
    `${label}: a different seed gives a different field`);

  check(voiceSeed(1, 440, 0) === voiceSeed(1, 440, 0), `${label}: voiceSeed is stable for one voice`);
  check(voiceSeed(1, 440, 0) !== voiceSeed(1, 441, 0), `${label}: voiceSeed separates pitches`);
  check(voiceSeed(1, 440, 0) !== voiceSeed(2, 440, 0), `${label}: voiceSeed follows the patch seed`);
  check(new Set(Array.from({ length: 512 }, (_, i) => voiceSeed(1, 440, i))).size === 512,
    `${label}: 512 repeats of one key draw 512 distinct seeds`);

  // a file source reads what was analysed, and an empty slot reads 0
  const rec = { bands: Float32Array.from([0, 1, 0, 0, 1, 0]), follow: Float32Array.from([0.5, 1]),
                nBands: 3, nFrames: 2, frameRate: 10, logMin: Math.log2(100), bpo: 1,
                wave: Float32Array.from([0, 1, 0, -1]), waveRate: 4 };
  const f = makeFileSource(rec), w = makeWaveSource(rec);
  check(f(0) === 0.5 && Math.abs(f(0.1) - 1) < 1e-6, `${label}: file(t) reads the follower`);
  check(Math.abs(f(200, 0) - 1) < 1e-6 && f(100, 0) === 0, `${label}: file(hz,t) reads the band at hz`);
  check(f(-1, 0) === 0 && f(1e9, 0) === 0, `${label}: file(hz,t) is silent outside the grid`);
  check(Math.abs(w(0.25) - 1) < 1e-6 && w(-1) === 0 && w(99) === 0, `${label}: wave(t) reads samples, silent outside`);
  check(makeSignalBank(1, { file1: null }).file1(0.5) === 0, `${label}: an empty file slot reads 0`);
}

/* ---------- run ---------- */
const inlineCode = [];
const extracted = [];
for (const tool of tools) {
  const path = join(ROOT, tool, "index.html");
  if (!existsSync(path)) { console.log(`\n${tool}\n  SKIP  no index.html`); continue; }
  const src = readFileSync(path, "utf8");
  console.log(`\n${tool}`);

  const sigModule = join(ROOT, tool, "signals.js");
  if (existsSync(sigModule)) {
    // extracted: import the real thing
    const api = await import(pathToFileURL(sigModule).href);
    check(blocks(src).length === 0,
      `${tool}: index.html carries no inline copy of the block (it imports signals.js)`);
    const wk = readFileSync(join(ROOT, tool, "worklet.js"), "utf8");
    check(/import\s*\{[^}]*\}\s*from\s*["']\.\/signals\.js["']/.test(wk),
      `${tool}: worklet.js imports the same signals.js, so there is one copy`);
    check(blocks(wk).length === 0, `${tool}: worklet.js carries no pasted copy either`);
    /* Importing is a stronger check than parsing: it resolves the imports too,
       so a renamed export fails here rather than in the browser. worklet.js is
       the exception - it cannot run outside an AudioWorkletGlobalScope, so a
       ReferenceError for one of that scope's names means it parsed and linked,
       while a SyntaxError means it did not. */
    /* moire's counterpart to dsl.js is compiler.js - it compiles a whole weave
       into one function rather than parsing a grammar into partials. */
    const core = existsSync(join(ROOT, tool, "dsl.js")) ? "dsl.js" : "compiler.js";
    for (const f of ["signals.js", "analysis.js", core]) {
      let ok = true;
      try { await import(pathToFileURL(join(ROOT, tool, f)).href); }
      catch (e) { ok = false; console.log(`        ${e.message}`); }
      check(ok, `${tool}: ${f} imports cleanly`);
    }
    let wkVerdict = "did not throw at all";
    try { await import(pathToFileURL(join(ROOT, tool, "worklet.js")).href); }
    catch (e) {
      wkVerdict = e instanceof SyntaxError
        ? `SyntaxError: ${e.message}`
        : (/AudioWorkletProcessor|registerProcessor|sampleRate|currentTime/.test(e.message)
            ? null : `unexpected: ${e.message}`);
    }
    if (wkVerdict) console.log(`        ${wkVerdict}`);
    check(wkVerdict === null, `${tool}: worklet.js parses and links (only its audio-scope globals are missing)`);
    behaviour(api, tool);
    extracted.push(tool);
    continue;
  }

  // not extracted yet: the block is pasted, so check every copy agrees
  const found = blocks(src);
  check(found.length >= 1, `${tool}: carries the shared signal block (${found.length} copies)`);
  if (!found.length) continue;
  check(found.every((b) => codeOf(b) === codeOf(found[0])), `${tool}: its copies agree with each other`);
  inlineCode.push([tool, codeOf(found[0])]);

  check(parses(pageScript(src), `${tool}/page`), `${tool}: page script parses`);
  const w = workletSource(src);
  if (w == null) console.log(`  --    ${tool}: no WORKLET_SRC template literal`);
  else {
    check(parses(w, `${tool}/worklet`), `${tool}: worklet source parses as the browser gets it`);
    check(blocks(w).length === 1, `${tool}: the worklet carries the block too`);
  }
  const api = vm.runInNewContext(
    found[0] + "\n({mulberry32,hash32,perlin1,SIGNALS,SIGKEYS,makeSignalBank,voiceSeed,makeFileSource,makeWaveSource})");
  behaviour(api, tool);
}

/* cross-tool: an extracted tool's shared files must be byte-identical to
   aliquoto's, which is what makes hoisting them into one engine a move rather
   than a merge. */
if (extracted.length > 1) {
  console.log("\nextracted tools");
  const ref = extracted[0];
  for (const f of ["signals.js", "analysis.js"]) {
    const canon = readFileSync(join(ROOT, ref, f), "utf8");
    for (const tool of extracted.slice(1))
      check(readFileSync(join(ROOT, tool, f), "utf8") === canon,
        `${tool}/${f} is byte-identical to ${ref}/${f}`);
  }
}

/* the pasted copies must match the extracted canonical code */
if (inlineCode.length) {
  console.log("\ncross-tool");
  const canonPath = join(ROOT, "aliquoto", "signals.js");
  const canon = existsSync(canonPath)
    ? codeOf(readFileSync(canonPath, "utf8").slice(readFileSync(canonPath, "utf8").indexOf(CODE_START)) &&
        readFileSync(canonPath, "utf8"))
    : null;
  for (const [tool, code] of inlineCode) {
    if (canon) {
      const canonBody = canon.slice(0, canon.indexOf(BLOCK_END) + BLOCK_END.length);
      check(code === canonBody, `${tool}'s pasted copy matches aliquoto/signals.js`);
    }
  }
  console.log("  note  run sync_signals.mjs if a pasted copy has drifted");
}

console.log(`\n${failures ? failures + " FAILED" : "all checks passed"}`);
process.exit(failures ? 1 : 0);
