# aliquoto

**Additive dequantizer — the spectrum before the synth.**

A pure additive sine synthesizer built to push additive synthesis toward its monstrous
conclusion. Partials may sit at *any* ratio of the fundamental — integer, fractional,
irrational, prime, or **below** the fundamental (subharmonic). The spectrum is written
as **mathematics** (summations, envelopes, conditionals) rather than drawn or dialed,
and the math is kept visible, not hidden inside an engine.

*aliquoto* = **Aliquot** + **koto**: exact parts of a whole, made playable as a resonant spectral instrument.

*aliquot* = a part contained in a whole an exact number of times (a divisor/multiple);
also the *aliquot strings* of pianos and harps that ring in sympathetic overtones.

Sibling to **Cycla** (`../../tabota/cycla/builder/index.html`): Cycla is a tuning of *meter*
(recursive subdivision); aliquoto is a tuning of *timbre* (the sum of sines). Same
counter-poetics — both work the interstitial positions a standard grid disallows
(12-TET for pitch, integer harmonics for timbre).

---

## Name and aesthetic direction

Working name: **aliquoto** — **Aliquot** plus **koto**. It should feel like an instrument that does not quite exist yet: spectral arithmetic as a plucked/resonant object, not a generic synth plugin. Keep **Aliquot** as the mathematical root, but let the final `o` make it sound playable, physical, and a little uncanny.

Current device identity: The skin should read as a cursed bathypelagic Mathematica notebook running on a TI calculator: passive-matrix, slightly transflective LCD green as the substrate; dark pixel-ink graphics and controls in the foreground; dense symbolic readouts; exacting firmware labels; notebook-like `In[]` / `Out[]` affordances where they help.

Design rules for the light skin:

- **LCD first.** The background is not “white mode”; it is green calculator substrate, sunlit, stained, low-contrast, and a little mineral.
- **Dark ink foreground.** Spectra, waveforms, controls, keys, and table glyphs should feel printed into or rising out of the LCD, not glowing neon.
- **High nerd density.** Prefer small labels, status chips, parser/compiler language, table readouts, exact units, and symbolic notation over decorative explanation.
- **Modern affordances, old device soul.** Keep it usable: clear buttons, hover/focus states, legible controls, responsive layout. The cursed part should come from the math/device logic, not from making it hard to use.
- **Pacific abyss, lightly.** Hint through bathymetric, oceanographic, pressure-depth, sonar, and firmware language. Avoid obvious horror decoration; keep the surface clinical, technical, and wrong by implication.


---

## Philosophy

The raw spectral material of additive synthesis is interesting *in its own right*,
before any synthesizer-ish processing. So:

- **The equation is the interface.** You type spectra; the tool renders the LaTeX,
  plots the envelope, and tabulates every computed partial (the `ƒ math` card).
- **The core stays pure.** No FM, no filters, no unison, no fx. Those belong downstream
  in an external chain. aliquoto only makes sines and sums them.
- **Dequantize.** Arbitrary ratios, subharmonics, inharmonic and irrational series,
  time-varying frequencies, and per-partial drift exist to escape the integer-harmonic lattice most additive
  synths are locked to.

Every voice evaluates live as a summation of dynamic, enveloped sines:

$$y(t) = \sum_{n} e_n(t) \cdot a(n) \cdot \sin\big(2\pi \cdot r_n(t) \cdot f_0 \cdot t + p(n)\big)$$

---

## Quick start

Open `index.html` in a modern browser (Chrome/Edge/Firefox). Click **▶ enable audio**,
then play with the on-screen keys, your QWERTY row (`a s d f …`, `z`/`x` shift octave),
or a MIDI controller. Type a spectrum in the **Y=** box and press **apply** (Ctrl+↵).

No build step, no dependencies to install — fonts and KaTeX load from CDN.

---

## The spectrum grammar

Each non-empty line is one statement. `#` starts a comment. `:` is the field
separator everywhere (hence `iff(...)`, never ternary `?:`).

### `partial` — one sine
```
r : a : p°                     # ratio, amp, phase (a=1, p=0 default)
r : a : p° : A : D : S : R     # + per-partial ADSR (7 fields exactly)
```
`r` may be any constant expression (`phi`, `pow(2,7/12)`) **or contain `t`**
(`t+1` = ratio rises from 1) — an `r(t)` partial is *dynamic* (see semantics).
`a` may NOT contain `t` (error says: use gain/env) — `a` is **a_max**.

### `sum` — a series
```
sum n=1..N : r(n[,t]) : a(n) : p(n) [: A : D : S : R] [where PRED]
```
`N=inf|∞|*` clamps to the **Σ ceiling** control (truncated infinite sum).
Multiple indices `sum n=1..N k=1..M : ...` = product/lattice spectrum.
`where PRED` filters index combinations. Optional 4 ADSR columns after phase.

### `env` — spectral envelope (r-domain)
```
env : f(r)          # multiplies every partial's amp; hz/f0 also in scope
env : f(t,...)      # if it contains t it becomes a gain line (time-domain)
```

### `gain` (aliases `shape`, `ampenv`) — time-domain amplitude
```
gain : f(t,r,hz,f0,a)     # replaces the voice master ADSR for these partials
```

### `adsr` — pitch-mapped envelope shapes
```
adsr : A(r) : D(r) : S(r) : R(r)    # per-partial ADSR as functions of ratio
```

### Variables in scope
`n,k,…` (indices) · `r` (this partial's ratio) · `hz` (= r·X) · `f0` (= X, the
`X pitch Hz` keyfollow reference) · `t` (seconds since note-on; only where noted).

### Functions / constants / operators
`prime fib rnd sin cos tan exp log sqrt pow abs mod clip01 adsr(t,a,d,s,r)` ·
conditionals `iff(c,a,b) odd even step between clamp not` · comparators
`< > <= >= == != && ||` (1/0) · consts `pi e phi tau` · power `^`.
`rnd()` returns 0..1; `rnd(max)` and `rnd(lo,hi)` scale that random draw.

---

## Architecture map (for future sessions)

Single file, `index.html` (~1500 lines). Key state + seams:

- **`buildPartials(text,ceil,f0ref)`** — grammar → `{parts,meta}`. Each partial:
  `{pid, ratio, amp, phase, adsr?, dyn?{r:{expr,vars,vals}}, gains?[]}`.
  **`pid`** is the stable identity: `s{line}:{indexTuple}` (sum-born),
  `l{line}` (literal-born), `a{seq}` (graphically added).
- **`applyGrammar()`** — reparse → prune stale non-`add` OVR entries + SEL →
  `applyOverrides()` (mutates/filters/adds partials from `OVR`) → redraw/readouts.
- **`OVR` Map** (pid → `{add?, removed?, ratio?, amp?, phase?, adsr?, rExpr?, gainExpr?}`)
  — the live graphic-edit layer over the grammar. Survives re-apply; bake commits it.
- **Selection shell** — `TOOL` (`select`/`move`/`place`), `SELMODE`
  (`replace`/`+` include/`-` exclude, Shift/Alt override), `SEL` Set of pids, marquee,
  ring aura; `move` = select-then-drag, axis-locked (y = scale group a_max,
  x = transpose group ratios by common factor); `place` treats `+` as add and
  `-` as delete-one-point (`replace` is idle); Delete/Backspace = remove selection;
  `restore removed` chip undoes removals (they live only in OVR, outside text-undo).
- **`bakeSelectiveGraphic()`** — commits OVR to grammar text: literal-born
  override rewrites its line; removed literal deletes its line; sum-born
  override/removal appends `where !(n==k)` to its sum (composes with existing
  `where` via `&&`); modified/added partials append as literals under
  `# — baked overrides —`; `r(t)`/`gain(t)` overrides can't flatten → kept live
  ("N dynamic override(s) kept live"). No overrides → full flatten.
- **Undo/redo** — grammar-text snapshots only (preset/bake/normalize/import);
  typing uses native textarea undo. OVR state is NOT in the undo stack.
- **Audio** — `WORKLET_SRC` AudioWorklet per voice (phase-exact, per-partial ADSR
  fast path, shared gain exprs, drift, a-rate `f0` param = time-varying pitch);
  oscillator-bank fallback. Voice seam: `startNote(id,hz,vel)` / `bendNote` /
  `stopNote` — every input (piano/QWERTY/MIDI/hex/ribbon/tabota) just produces Hz.
- **Note model = Tabota.** `noteToEvent`/`eventToNote`/`performanceDoc` encode
  voices as realizable Tabota Events (`chronological · frequency`, pitch in Hz,
  glides as `from/to`); spectrum rides in `payload` (aliquoto's paddy). Doc shape:
  `{payload, score:[{frame,events}]}` — **`score`, not `events`, at root.**
- **`.tabota` import** — vendored `tabota-resolve.js` (classic script, stamped
  with source commit; strips the one `export`; loads from `file://`).
  `resolvedToNotes()` plays the determinate fragment; background hash check vs
  `/tabota/tabota-resolve.js` shows a "resolver ✱" chip (notify-only). No MIDI
  anywhere in the Tabota path.
- **Tuning** — `TUNING.edo` n-EDO, `stepToHz(step)=A4·2^((step+edo·oct)/edo)`.
- **Surfaces** — piano (retuned) / isomorphic hex (QWERTY rows z…/a…/q…/1… map
  isomorphically) / continuous ribbon (x=log-Hz drag-glide, no key/MIDI map);
  multitouch, pointerId-keyed.
- **ƒ math modal** — KaTeX live equation, env plot, TI-TABLE, live tabota doc.

Verify caveat: `preview_screenshot` can hang (CSS animation keeps renderer
non-idle) and canvas width can read 0 in headless eval — test via
`preview_eval` + injected `SM` dimensions where pixel-scaled.

---

## Roadmap

### Graphic spectrum editing (next arc — binlod-ported)
1. ~~**Selection shell**~~ — **done.** SPECTRUM toolbar: `select`/`move`/`place` tool chips,
   selMode `replace`/`+`/`-` (+Shift/Alt override), `all`/`none`, undo/redo
   (`↶`/`↷`, Ctrl+Z / Ctrl+Shift+Z outside the textarea — native textarea undo still
   handles free typing). Select tool: click a partial to select it (never moves it);
   click+drag empty space = marquee; selected partials get a ring aura. Move tool:
   click/drag a partial first applies the same selection mode, then immediately moves
   the selected partial/group; click+drag empty space = the same marquee behavior. Each
   partial carries a stable `pid` (grammar line + index tuple) so selection survives
   re-`apply` where the identity still resolves. Undo/redo covers program-driven
   rewrites (preset load, bake, normalize, `.tabota` spectrum-adopt) — plain typing
   uses the textarea's own native undo.
2. ~~**Override panel**~~ — **done.** A card docked under the global Voice/ADSR
   sliders and above drift, shown only
   when something's selected ("nothing selected edits globals" — the sidebar's grammar
   text + Voice/ADSR/drift controls). Fields: `ratio`, `a_max`, `phase°`, ADSR
   `A`/`D`/`S`/`R` (+ a mini envelope graph of the first selected partial's shape),
   `r(n,t)` override, `gain(n,t)` override, and a `drift↯` chip (fills `r(n,t)`
   with a per-partial pitch-drift template). Multiple selected → mixed values show blank
   (tabota contextual-editor pattern); editing writes to every selected partial.
   Blank a field + commit (Enter/blur) clears just that override, falling back to
   the global formula on the next apply. Editing one ADSR field freezes the other
   three at their *current effective* values (global or already-overridden) rather
   than resetting them. Overridden partials get a small magenta square badge over
   their spectrum dot; the readout reports live override state as added / modified /
   removed counts. Overrides are
   keyed by each partial's `pid` (grammar line + index tuple) in an `OVR` map,
   reapplied after every grammar re-`apply` (and pruned when a pid no longer
   resolves) — so they survive re-eval, and flow straight into today's bake/`partialLine`
   (a fully-overridden partial already bakes as a 7-field literal `r:a:p:A:D:S:R` line).
3. ~~**Bake v2**~~ — **done.** `⤓ bake` is now *selective*: a partial carrying an
   override becomes a literal line; untouched sums stay sums. A literal-sourced
   override rewrites its own line; a sum-sourced override adds a `where !(n==k)`
   exclusion to that sum (composing with any existing `where`) and appends the
   partial as a literal under a `# — baked overrides —` marker (placed after any
   `env`/`adsr`/`gain` lines so those don't re-touch it). With no overrides at all,
   bake still full-flattens as before. An `r(n,t)` override **now bakes** — its
   expr is index/`r`/`f()`-substituted to a pure `t`-function (see 3a) and emitted
   as a literal `expr : a : p` line, so per-partial motion survives bake. Only
   `gain(n,t)` overrides stay **kept live** ("N dynamic override(s) kept live") —
   there's no per-partial-`gain` literal syntax yet (8th field vs `gain@id` still open).
   - **Override editing got richer too:** the panel's numeric fields are now number
     spinners with arrows + wheel-nudge (Shift = ×10 step). For a **multi-selection**,
     `ratio` and `a_max` disable (an absolute number is ambiguous across a group) —
     instead, with the `move` tool you **drag the group in the spectrum**:
     vertical = scale all `a_max` together (relative spread preserved), horizontal =
     transpose all ratios by a common factor (intervals preserved). The gesture is
     axis-locked (first move decides x or y). Drags write to `OVR`, so they carry the
     "modified" badge and bake like any override.
   - ~~**Override expression vocabulary (`n` / `r` / `f()`)**~~ — **done (2026-07-04).**
     The `r(n,t)` and `gain(n,t)` override fields see more than `t`:
     - **`n`** (and any other sum index name, e.g. `m`) — this partial's index value.
       `n+sin(t+1)` = LFO pitch wobble on one partial; blank `n` drops it to fundamental.
     - **`r`** — this partial's base ratio, for relative modulation: `r*(1+.01*sin(t))`.
     - **`f(x)`** — the partial's **global ratio formula** evaluated at index `= x`.
       `f(n)` = its own ratio; `f(t)` = a continuous sweep through the same curve;
       `f(n)*f(t)`, `f(sin(t))` etc. compose. Only defined for a **single-index sum
       whose ratio has no `t`** — else the field errors (`f() needs a single-index
       sum` / `f() unavailable: global r(n,t) already depends on t` / `f() needs a
       partial from a sum` for literals).
     Mechanism: `n`, `r`, and `f()` are all **constant per partial**, so they're
     substituted numerically at commit (`idxBindings`/`substVars`/`expandF` — `f()`
     is a balanced-paren macro inlining the stored `idx.rE`). The stored override
     expr stays symbolic (panel shows `f(n)*f(t)`); each partial resolves to its own
     numbers, so a multi-selection with one expr auto-decorrelates by `n`. Result is
     a pure `t`-function → **zero worklet change and it bakes** (see 3). `gain` gets
     `n`/`f()` substituted but keeps `t,r,hz,f0,a` live (runtime supplies them).
     Sum partials now carry `idx:{vars,vals,rE}` from `buildPartials` to feed this.
     drift↯ chip = one-click template `r*2**(15*sin(tau*3*t+n)/1200)` (15¢, 3 Hz;
     `+r` phase when no `n`). Still open: callable `f` isn't yet a true runtime fn
     (no `f(n)` when global r has `t`); no per-partial gain-bake syntax.
4. ~~**Graphic add/remove**~~ — **done.** `place` + click places a live synthetic
   partial (x→ratio, y→a_max), selects it, and stores it as an override entry until
   bake. `place` - click on a partial removes that one point. Delete/Backspace
   outside text fields still removes the current selection as live override state:
   existing grammar partials become invisible `{removed:true}` entries, while
   newly-added unbaked partials are simply un-added. Readout names invisible state
   explicitly (`1 removed`, `2 added`) so removal has feedback even though the partial
   disappears. Bake commits adds as literals, literal removals as deleted lines, and
   sum removals as `where !(...)` exclusions.
   *(Post-review fixes 2026-07-02: plural labels no longer produce "removeds";
   dead pre-graphic `bakeSelective()` deleted — `bakeSelectiveGraphic()` is the
   only bake; added a `restore removed` toolbar chip, since removed partials are
   unselectable and live outside the text-scoped undo — previously irreversible.)*
5. **Move snapping** — snap modes for move drags (free / harmonic / EDO / prime).
   (Single + group x/y drag already live; this adds quantized targets.)
6. **Extras** — solo/mute selection audition · group ops (scale amps, transpose ·k,
   stretch ^k, scatter ±¢) · copy-selection-as-grammar · ADSR hover ghost.

### Dropped sound as f(t) — sound-as-modulator (ideation 2026-07-10, unbuilt)
Drop a soundfile / noise source; it becomes a **value source over time** in the
grammar, never audio. Suite framing (see `../suite.md`): real sound as *modulator*,
third role beside substrate (Horn of Plenty) and excitation (Cella drive/Fano).
The sines stay pure sines by construction — the file is dereferenced, not mixed.
Aliquoto-specific notes:

- **Per-partial `amp(t)`** from an envelope follower; each partial may bind a
  different dropped file. Slots into the existing multiply order as another
  gain-like factor (`a · env(r) · adsr(t) · gain(t) · file-follower`) — or just
  as a new function in `gain(t)` scope.
- **Keyfollow vocoder mode:** partial's amp = band energy at *its own* `hz` in
  the file. Partials keyfollow → analysis bands move with the played note. A
  ratio-defined vocoder; unique to additive (subtractive can only filter the
  file, additive dereferences it per-partial).
- **General f(t):** same follower value usable in `r(n,t)` (pitch waver depth),
  drift amount, anything with `t` in scope.
- Grammar sketch (decide at build): dropped files get names in expression scope,
  e.g. `file1(t)` = follower value, `file1(hz,t)` = band energy at hz. Rate:
  per-block (cella-dynamics grain) is likely enough; audio-rate is a later call.
- Negative-filter suite idea (see `../suite.md`) needs nothing new here: an
  `env : f(r)` with a dip already *is* the keyfollowing notch, because aliquoto's
  lines are discrete.

### Roil-style `noise()` — folds into suite arc 1.1 (penciled 2026-07-13)
In-house prior art: `../xyhtamura.github.io/roil/` — single-osc Web Audio toy,
1D Perlin noise drives four params (pitch within a bounded range, filter cutoff,
Q, amp), each with independent **depth + rate**, ticked at rAF, smoothed via
`setTargetAtTime(…, 0.01)`. Its noise handling is exactly the "smoothable/
band-limited companion to `rnd()`" that arc 1.1 asks for.

Plan: add seeded 1D Perlin **`noise(x)` → −1..1** to `MENV` (identical fn on
main thread and in the worklet; per-note seed for reproducibility). Then
Roil-parity is pure grammar, no engine change beyond the one function:

- pitch drift, decorrelated per partial (beats Roil's single osc):
  `sum n=1..24 : n*(1+.01*noise(2*t+n*13)) : 1/n`
- amp noise: `gain : clip01(.19*(1+.87*noise(34.8*t)))`
- Roil's filter/Q noise has no target here (no filter, by design). Spectral
  analogue: `gain : clip01(1-.5*abs(noise(t))*r/16)` — a "breathing lowpass"
  carved by amp-vs-ratio, keeping the core pure.
- QoL: give the `drift↯` chip a noise-based template variant beside the sine one.

Osc-path tick is 33 ms ≈ Roil's rAF tick — control-rate parity is fine.

### VST port (penciled 2026-07-13; aliquoto first, cella/moire reuse skeleton)
Sequencing decision: **web arcs first (1.1 → 1.2 → 1.3), then port.** Everything
in those arcs is engine/DSL-level; on the WebView+QuickJS route below, features
added on web carry into the plugin at ≈ zero extra cost — only the small C++
sine-bank port grows. Porting first would mean double-implementing every later
feature (web + C++). Only pre-port design constraint: the state chunk must
anticipate sample references once file-drop (1.2) exists — decide **embed vs
path-reference** for dropped files before freezing state format. The cella zero
(1.3) is pure DSP and ports trivially whenever.

Order of work:

1. **Engine extraction** (prereq; a web-side win regardless): partial model,
   ADSR, drift, voice alloc, worklet DSP in one DOM-free file. Arcs 1.1–1.3
   should land in this core, not the page.
2. **Framework: JUCE 8 + WebView** (`WebBrowserComponent` hosts real HTML/CSS/JS
   as the plugin GUI) — the existing UI ports near-verbatim, params sync over the
   JS bridge. The "CSS problem" disappears on this route. Alternatives: iPlug2
   (also web UI, lighter, thinner docs), Cmajor (fastest prototype, young).
3. **Worklet DSP → C++** (~100 lines: sine bank, per-partial ADSR, drift LFO).
4. **DSL in C++:** embed QuickJS/duktape for exact `compileExpr` semantics —
   formulas eval at note-start/control-rate only, perf fine. (exprtk = faster
   but grammar parity must be re-verified.)
5. **Param model:** fixed automatable floats (master, ADSR×4, drift×2, X ref,
   Σ ceil); grammar text + OVR + preset bank = state chunk, not params.
6. **Drop** WebMIDI, .mid player, WAV export — host owns those.
7. **Validate:** `pluginval`, test Reaper + Ableton + FL.

**Asset printer (fallback only, if classic JUCE UI instead of WebView):**
an HTML/CSS/JS page that renders each control state and exports assets —
knob/slider **filmstrips** (N rotation frames stacked vertically, JUCE
convention), 9-slice panel textures, @1x/@2x, via `canvas.toBlob` or Playwright
screenshots. Better: export **SVG** — JUCE `Drawable` loads it natively, and the
LCD skin is flat CSS gradients, which compress to SVG cleanly and stay
resolution-independent. Not needed on the WebView route.

### Then (carried forward)
Scala `.scl/.kbm` import · quartertone split-key piano · performance presets
{surface + tuning + range} · per-note X evaluation (timbre as function of pitch) ·
BroadcastChannel live bridge to TaBoTa Roll · resynthesis (FFT → grammar) ·
VST — see "VST port" section above.

### Language notes (current semantics)
Multiply order per partial: `a (a_max) · env(r) · adsr(t) · gain(t)`.
`r(t)` present → per-partial drift off (explicit motion supersedes random).
`gain`/`a(t)` present → voice master ADSR off (no double-envelope).
Open decision (still parked): literal syntax for a per-partial `gain(t)` so
dynamic overrides can bake (8th field vs `gain@id : f(t)`).

---

## Files

- `index.html` — the whole instrument (single file; the dev artifact).
- `index dark version.html` — the earlier dark spectral-bloom skin, kept as backup.
- `tabota-resolve.js` — vendored Tabota resolver (classic-script build; header
  stamp says which `../../tabota/` commit it was copied from and how to re-vendor).
- `IntraNet.otf`, `Seona-DEMO.otf` — local display faces for the LCD skin.
- `aliquoto.md` — this file: roadmap, spec, and private LLM-facing documentation.

## Session state (2026-07-02)

Instrument is **solid and feature-complete for this arc**: grammar (t-dynamics,
per-partial ADSR, gain, keyfollow) · selection/override/bake graphic editing
(phases A–D) · n-EDO tuning + piano/hex/ribbon surfaces · Tabota-native note
model + `.tabota` import · naked-math card. Development wrapped here by choice;
next arcs live in the roadmap above (move snapping + extras 5–6, then the
carried-forward list).

## Log

**2026-08-13 — Codex.** Imported Aliquoto into the Anexacta monorepo without
squashing its history. Updated the live resolver freshness check to the stable
same-origin path `/tabota/tabota-resolve.js`; the vendored resolver remains
unchanged. Updated suite and workspace-relative documentation links. Verified
the new `/anexacta/aliquoto/` route and the resolver request through the shared
root server. Undone: resolver freshness remains notify-only, as before.

## 2026-09-05 — Claude Code — suite arc 1.1: the signal-source seam

Aliquoto is the canonical copy of the seam; cella and moire were hand-synced from
it, and `../scripts/check_signals.mjs` asserts the three stay byte-identical.

- `rnd()` keeps its grammar surface exactly and changes underneath: a per-voice
  mulberry32 stream instead of `Math.random()`.
- `noise(x)` is new — seeded 1D Perlin, −1..1, zero at integer lattice points.
  This is the "Roil-style `noise()`" section below, built. The patterns it
  penciled work as written: `sum n=1..24 : n*(1+.01*noise(2*t+n*13)) : 1/n` gives
  per-partial decorrelated pitch drift, and `gain : clip01(.19*(1+.87*noise(34.8*t)))`
  gives amp noise.
- `compileExpr(expr,vars,bank)` and `wcompile(expr,vars,bank)` take an optional
  voice bank whose entries shadow `MENV`/`WENV`. All three synthesis paths — the
  worklet, the live oscillator fallback, and the offline export — build one bank
  per voice from the same seed, so an export matches what was played.
- `wcompile`'s `**` substitution is now `split`/`join`. It was a regex inside a
  template literal, the same shape as the bug that silenced Spolium; the worklet
  source now contains no backslashes at all.
- New UI: a **signal seed** number field and a reseed button under per-partial
  drift.

**Verified** in Edge against the root server: two offline renders of a three-note
score at seed 1 differ by exactly 0; seed 2 differs by 0.49 peak; the three
same-pitch notes inside one render differ from each other by 0.47–0.56. Against
the pre-change build `c0f1eec`, the default patch with drift 0 reproduces peak,
RMS and sample values identically to nine decimals. Console clean.

**Left undone**: the seed is not saved with a patch (nothing here saves patches);
`rnd()` at audio rate consumes the voice stream per call, so call order matters.

## 2026-09-06 — Claude Code — suite arc 1.2: the dropped sound, and the vocoder

The "Dropped sound as f(t)" section below is built, in the modulator role it
describes. `file1(t)` is the follower, `file1(hz,t)` the band energy, `wave1(t)`
the sample value. The file never enters the audio path.

The grammar sketch in that section asked to "decide at build" between `file1(t)`
and `file1(hz,t)`; both shipped, distinguished by argument count, which turned out
to need no decision. The **rate** question it raised — control-rate follower
against audio-rate reads — was settled by measuring, and the answer is that it was
the wrong question: the lookup is free at audio rate, and the cost that matters is
the per-sample dispatch of *any* compiled gain expression, which predates both
arcs. See `../suite.md` for the numbers.

**The keyfollow vocoder works and is measurable.** With a file whose only energy is
at 440 Hz and `gain : file1(hz,t)`, playing 110, 220 or 440 puts the output peak at
441.4 Hz every time — a different partial survives in each case — and playing 330,
where no harmonic lands in the band, drops output by a factor of 600.

Analysis is main-thread only and lives between markers so `../scripts/sync_signals.mjs`
can hold it in sync with the copies in cella and moire. Aliquoto is canonical for
both marked regions.

**Left undone**: one file slot rather than one per partial; the waveform is kept to
30 s against the analysis's 180 s; a 2048/512 STFT smears motion faster than ~12 ms.
