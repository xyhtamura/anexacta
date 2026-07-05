# moire

**Phase-modulation dequantizer — the spectrum as interference.**

Fourth sibling. Aliquoto writes a spectrum into silence; cella writes it onto
noise; **moire never writes it at all** — it writes two (or forty) pure lines
into *each other's phase*, and the spectrum is what happens where they cross.
Sidebands: lines you did not write, at positions bred from the ones you did.

*moire* = **moiré**, the interference pattern — watered silk, two regular
weaves pressed together producing a pattern neither weave contains. The name
names the fabric (aliquoto the string, cella the room, moire the cloth), and
the pun runs deep: Horn of Plenty's manifesto is *felt, not weave* — it
destroys weave interference as a defect; moire is the sibling that makes weave
interference the entire instrument. Secondary shade: the Moirai, spinners of
thread.

Suite taxonomy — how a spectrum comes to be:

- **aliquoto** — *written*. Linear sum; every line specified.
- **cella** — *answered*. Linear response; lines specified plus width.
- **horn of plenty** — *harvested*. Statistics of a sample.
- **moire** — *woven*. Nonlinear; lines bred by phase-crossing written lines.

First **nonlinear** member: the first whose output contains frequencies that
appear nowhere in the source text.

---

## The lattice being broken

FM tradition (DX7 → FM8 / Operator / Dexed, unchanged in spirit since 1983)
quantizes more than people notice. Each quantization, named, is a moire feature:

1. **The algorithm chart** — 6 operators, 32 fixed routings. The core
   skeuomorphism of every FM synth since is not knobs but *boxes and wires*.
   Moire dissolves the chart: **the patch is a system of named equations.**
   Any directed graph, cycles included, written as math.
2. **Operator count** — fixed at 6 (or 4). Moire: parametric. A `sum` line is
   an operator *family* indexed by `n` — forty-operator FM in one line, the
   "algorithm" a formula over the index.
3. **Ratios** — coarse/fine knobs, integer-biased. Moire: any expression —
   `phi`, primes, subharmonic, negative, `r(t)`. Two incommensurate modulators
   give a quasi-periodic spectrum that never exactly repeats: literal moiré.
4. **Feedback** — the DX7 quantized it to an integer 0–7. Moire: any real
   coefficient, any loop, cross-feedback between named lines.
5. **The envelope object** — fixed stages bolted to each operator. Moire: it
   dissolves into math. `op(1, 8*exp(-3*t)*op(2))` is the classic FM pluck
   with no envelope object anywhere. Index-over-time is *the* expressive axis
   of FM; here it is just `t` in an expression.

Thesis sentence: **FM with the algorithm chart dissolved into an equation.**
Unshackled from the 1983 object model — committed to what a screen and a
compiler can do in 2026.

---

## Grammar

Line-oriented like the siblings; each non-empty line is a **named signal
equation**. `#` comments. The `y :` line (or the last line) is the output.
One sugar primitive:

```
op(r)        = sin(2π · r·f0 · t)
op(r, p)     = sin(2π · r·f0 · t + p)      # p = phase input, radians
```

Everything else is nesting and naming:

```
# 2-op pluck — index envelope is just math
y : op(1, 8*exp(-3*t) * op(2.01))

# named graph — the "algorithm" is the references
m : op(phi)
n : op(2, 4*m)
y : .6*op(1, 3*n + 2*m) + .4*op(1.5, m)

# operator family — impossible on any boxed FM synth
y : sum n=1..12 : op(n, (6/n)*op(n*phi)) / n

# feedback — self-reference reads the previous sample; coefficient unquantized
a : op(1, 1.7*a)
y : a
```

- **Feedback semantics:** any self- or backward-reference is an implicit
  one-sample delay (z⁻¹) — exactly what DX7 feedback always was, minus the
  0–7 ladder. Mutual loops allowed.
- **Scope:** `t` (seconds since note-on) · `f0` (played Hz via keyfollow) ·
  sum indices `n,k,…` · full MENV function/const table (ported verbatim:
  `iff odd even step between clamp mod prime fib …`, `pi e phi tau`).
- **PM, not FM** (decided): the DX7 was PM anyway; PM is drift-free and
  cleaner math. A true-FM `fm()` primitive (phase = integral of frequency) is
  a possible later addition, noted not planned.
- `where` on sums carries over from the sibling grammar.

## Engine

- **One generated function per voice.** Topo-sort the equation lines, unroll
  `sum` families at compile time, emit a single flat JS function
  `(t, f0, state) → y` — feedback references read/write a state array. One
  `new Function` per apply; zero per-sample interpretation, no operator
  objects at runtime. The anti-skeuomorphism goes all the way down.
- Same AudioWorklet + mini-compiler pattern as cella (`wcompile`/`WENV`
  transfer near-verbatim); same `FallbackCella`-style ScriptProcessor fallback
  (Chrome/Firefox lesson already learned); same enableAudio gesture hardening.
- **Aliasing, honestly:** deep PM sprays wide sidebands past Nyquist. Plan: a
  2× oversampling toggle in the worklet (integrate at 2·sr, halfband down).
  v1 may ship without it; if so the limitation is documented, not hidden.
- Voice seam unchanged: `startNote(id,hz,vel)` / `bendNote` / `stopNote` —
  piano / hex / ribbon / MIDI / MIDI-file all just produce Hz.

## Convenience layer (low floor, high ceiling)

The grammar is the ceiling. The floor (decided: keep it low, but it stays a
nerd instrument at heart):

- **ADSR sliders** as convenience, cella-style — gates the output when no
  line owns its own time-shape; any `t`-math in the grammar supersedes it
  (aliquoto's `formulaOwnsEnv` pattern).
- **I× — global index multiplier.** The one-knob brightness/character lever,
  direct analog of cella's Q×: scales every `op`'s phase-input depth.
  Log-scaled slider (Q× lesson). I×0 = every voice collapses to its carriers
  (pure additive — the aliquoto limit!); I× large = chaos-adjacent shriek.
  One knob sweeps written → woven.
- **Drift — the instability lever.** Suite-consistent `depth¢ / rate Hz` pair
  wandering each op's ratio (per-op random offset + slow sine, the
  cella/aliquoto mechanism verbatim). In moire this is FM-native in a new way:
  drifting ratios make the *interference pattern itself* crawl — the two
  gratings sliding across each other, which is what moiré does in the world.
  Candidate second lever, decide during build: **index shimmer** (slow wander
  on modulation depth = brightness breathing) — maybe fold into the same
  drift section as a third slider, maybe defer.
- **Presets carry the floor:** each one-line-comprehensible, each showing one
  power (pluck / bell / family / feedback / incommensurate pair / drift).

## The display inversion

Aliquoto and cella plates *declare* the spectrum — they draw intent. Moire
cannot: the spectrum is emergent. So the plate **listens** — a live FFT
analyzer of the instrument's own output. First suite member whose display
measures instead of draws. (Bessel ghost-overlay of predicted sideband
positions was considered and cut from v1 — analyzer only, decided.)

Consequence, accepted: **no graphic spectrum editing.** There is nothing to
drag — a sideband is not an object. The selection/OVR/bake shell, the
override panel, the place tool: none of it transfers. The equation is the
entire interface. First sibling where that is true.

## What transfers / what doesn't

| transfers near-verbatim | does not transfer |
|---|---|
| expression DSL (`compileExpr` + MENV) | selection / OVR / bake shell |
| worklet + in-worklet mini-compiler pattern | override panel |
| piano / hex / ribbon surfaces + n-EDO tuning | plate hit-testing & partial dots |
| enableAudio hardening + fallback engine | Q column (no Q here; I× is the macro) |
| MIDI-file import → audition → offline WAV export | ensemble/Voigt (cella-specific physics) |
| drift mechanism (rnd + sine LFO per element) | |

DEPENDENCIES.md: moire becomes the third copier of the aliquoto expression
DSL — same hand-synced-copy pattern as cella, add the edge when code exists.

## Skin seed (park until design session)

The sibling that stops apologizing for being a screen. Interference is native
to displays: scanline moiré, aperture-grille beat fringes, two drifting
gratings. Watered-silk material + CRT-interference light. No wood, no brass,
no boxes — the skin made of the artifact every other instrument suppresses.
Display name **Moiré**, folder/code `moire`.

## Build order (v1 spine)

1. Grammar → codegen: parse named lines + `sum` unroll + topo-sort + z⁻¹
   feedback state; emit one function per voice. Golden test: `y : op(1)` must
   equal aliquoto's single sine (the I×0 / carrier-only degeneracy —
   load-bearing invariant, like cella's γ=0 test).
2. Worklet voice around the generated function; ADSR-as-convenience gate;
   I× macro; fallback engine.
3. Analyzer plate (FFT of own output, log-ratio axis styled like the sibling
   plates so the family resemblance holds even though the meaning inverted).
4. Surfaces + tuning + MIDI-file→WAV lift.
5. Drift (+ decide index-shimmer).
6. Presets + oversampling toggle.

## Status

**Prototype spine started (2026-07-05), single self-contained `index.html`.**
Working: named PM equations (`name : expr`, `y : expr` output), `op(r,p)`,
finite `sum n=.. : expr where PRED` unrolling, previous-sample feedback for
self/forward references, shared sibling expression helpers/constants, generated
per-voice JS function, AudioWorklet voice with ScriptProcessor fallback, ADSR
gate, log-scaled global `I x`, per-operator drift, live FFT analyzer plate,
piano/hex/ribbon surfaces, EDO tuning, QWERTY play, and six presets.

Deferred from the v1 build order: oversampling, and any graphic spectrum editing
(intentionally absent unless the concept changes). *(The earlier "no Web MIDI"
note was a misread of the Tabota **score-path** decision — 12-TET+bend is refused
in the composed/score path, not in live playing; both siblings play live MIDI, so
moire does too. Live Web MIDI shipped, see below.)*

**Reskin + engine pass (2026-07-05).** Skin moved off the hacker-terminal seed
onto **suminagashi / layered water** (user pivot; no CSS animation, no regular
grids). Sibling skeleton adopted: header top, **side panel left 392px** (grammar
first), analyzer plate + surface on the right — moire is the odd sibling where
*the equation is the whole interface*, so grammar-top-left fits it best. Display
font **Oceanus Light** (`./Oceanus Light.ttf`, local @font-face), Space Mono for
code (sibling continuity). Palette is intentional now: the **soap-film / oil-slick
interference series** (magenta·cyan·gold·green·violet — the colors the named
phenomenon actually makes), *reserved for where the math is alive* (FFT trace,
active notes, the "on" state); structural chrome stays ink + bone. Two procedural
**suminagashi SVG sheets** (deterministic `mulberry` RNG, static, no animation)
injected as `--sumi-ground` / `--sumi-membrane` — two different marbling patterns
layered = the moiré-between-sheets thesis in the skin itself; both are placeholder
stand-ins for a real texture the user will drop into the same `url()` slots. Plate
idle draws a *static* interference figure (animation removed); plate background is
two crossed detuned gratings = a static moiré, not a grid.

Engine fixes verified in-browser (preview_eval): **(1)** carrier phase now
integrates a per-op accumulator `PH[i] = (PH[i] + 2π·r·f0·dt) % 2π` instead of
`sin(2π r f0 t)` — the old stateless t-multiply accrued phase error linear in note
age whenever r or f0 varied (drift lied and worsened with age; glide/`r(t)`
chirped). Worklet/fallback pass `dt`, state carries `ph`. Golden `y : op(1)`
unaffected (still 1 op, still a pure sine). **(2)** I×0 reachable — slider bottom
snaps to hard 0 = every op collapses to its carrier = the pure-additive (aliquoto)
limit; label reads "carrier". **(3)** `prime()`/`fib()` with constant args
constant-folded at compile (balanced-paren scan) so the audio thread never runs
trial-division per sample; dynamic args (`prime(S[i])`) kept live. Confirmed:
prime-comb body folds `prime(1)/8`→`2/8`, dynamic call survives.

**UI pass 2 (2026-07-05).** (a) **Live Web MIDI input** added (user override of the
original no-Web-MIDI stance) — `initMIDI`/`onMIDI`, header `midiChip`; device notes
route through `midiToHz` (retuned into current EDO, keeps the conceit), pitch-bend →
`bendNote` (±2 semis), voice ids `w{ch}_{note}`. Can't unlock AudioContext from a MIDI
message (no gesture) → nudges "click page". Verified: noteOn→voice@440, +2-semi
bend→493.88 Hz, noteOff clears. (b) **Presets → dropdown** (`<select id=presetSel>`,
sibling idiom) replacing the button grid. (c) **Grammar cheatsheet** below the writer —
moire-correct (op(r)/op(r,p), named lines, feedback, sum families, scope, I×0); note the
user's pasted example was *cella's* partial:a:p:Q grammar, which moire does not have, so
it was rewritten. (d) **KaTeX math HUD over the analyzer** (`ƒx` toggle, `#mathHud`): the
patch rendered as equations — each `op(r,p)`→`sin(2π·r·f0·t+p)`, nesting shows the
modulation chain, `sum`→Σ. This is moire's "what modulates what" view — equations, not a
box-and-wire graph (rendering the dissolved algorithm chart as a graph would reintroduce
the boxes the concept rejects). `compileProgram` now also returns parsed `lines` for the
texifier. Verified: nested pluck → nested sin, sum → Σ bounds, HUD shows 2 KaTeX lines.
(e) **Piano restyled to real keys** (kept dark-on-dark): full-height rounded base keys +
overlaid shorter near-black caps on 12-EDO accidentals (silhouette reads without changing
per-column hit mapping); active = iris. (f) **Hex packing fixed** — was sparse (hexes
~0.32 of full-width cells); now close-packed pointy-top (h-step √3·rad, v-step 1.5·rad,
odd-row offset), and `surfaceStepFromEvent` hex branch rewritten to nearest-center pick so
clicks match the drawn layout. All three surfaces draw error-free.

**MIDI file → live audition / offline WAV — DONE (2026-07-05).** Ported from
cella: self-contained SMF parser (`parseMIDI`, no lib), live audition via
`startNote`/`stopNote` timers, offline export via `OfflineAudioContext`
(`renderMidiOffline` → `downloadWav`, worklet-only). *Not verbatim* — moire's
voice had no scheduling, so the worklet gained sample-accurate `startAt`/`relAt`
(via `currentFrame`) baked into `processorOptions`; default 0/∞ keeps the
realtime path unchanged. A 12-TET `.mid` is retuned through the current EDO
(suite conceit). Verified: 2-note SMF parses (C4@0, G4@0.5, right velocities),
offline render non-silent (peak 0.19) with RMS tapering to zero after the
scheduled releases — confirms `startAt`/`relAt`. Live Web MIDI added in UI pass 2
(above). DEPENDENCIES.md: moire is now the third hand-synced copier of the
aliquoto expression DSL + the cella MIDI/WAV path — edge still to be added.

**Texture + control skin (2026-07-05).** User supplied two real tileable textures
in `/moire/`: `bina.jpg` (Philippine **Binakol** — indigo/cream whirl weave with red
warp lines; the woven optical interference the instrument is named for) and
`sumi.svg` (B/W **suminagashi** marble; note it's a base64 **raster PNG wrapped in
SVG**, not vector — recolor via CSS blend/filter, not by editing paths). Placement,
kept deliberately subtle: **bina** on the left control panel (~8% visibility, shown
through the near-opaque membrane gradient `rgba(217,223,230,.93)` over `url(bina.jpg)`
at 320px tile — a woven "control cloth"; replaced the procedural `--sumi-membrane`
placeholder there); **sumi** ghosted into the body ground via `body::before`
(`filter:invert(1) brightness(1.5) contrast(.82); mix-blend-mode:screen; opacity:.06`)
so the white-bg scan reads as pale marble on dark water — a second ink sheet over the
procedural rings (two sheets = the moiré). `.shell` gets `position:relative;z-index:1`
above the fixed `::before`. Both files load 200, verified. Controls skinned in the
dark-on-dark + oil-slick language: **sliders** (`appearance:none`) = carved dark
groove + radial oil-slick "interference pearl" thumb (webkit + moz, incl.
`-moz-range-progress`); **scrollbars** = dark channel + oil-slick thumb (webkit
`::-webkit-scrollbar*` + firefox `scrollbar-color`), applied to html/.side/textarea/
.mathHud/select; **dropdowns** (`select{appearance:none}`) = custom violet oil-slick
chevron + iris hover/focus. `--sumi-membrane` is now generated-but-unused (harmless).

**DX7-homage color pass (2026-07-05).** User found the analyzer trace palette
(azure/aqua/gold/pink) arbitrary; wanted it to lean oil-slick *and* nod to the DX7
front-panel button colors. New signal palette vars `--dx-emerald #1fa981` (teal-
emerald) / `--dx-corn #5f74e0` (cornflower-indigo) / `--dx-amber #e8b25a` (peachy
gold) / `--dx-tomato #e14b30`. Repointed everything that visualizes signal to it:
FFT trace gradient + glow, output meter, ribbon surface. **Idle analyzer now blank**
— removed the decorative static-wave curves; before audio the plate shows only its
frame (faint gratings + octave gridlines), verified by canvas pixel sample (max luma
43, zero bright pixels). **Tomato on the panic button** (was a washed peach — now a
hot red drawstop) + error box border/bg + `--danger` retuned to tomato. **Slider
thumbs → DX7 data-entry fader caps**: squat dark rectangular slug (13×21) with a
bright amber indicator stripe across the middle (webkit + moz), replacing the round
oil-slick pearl. Presets: user added ~10 (beating cloth, glass rain, phase organ,
quasi tide, fate braid, prime lattice, barber weave, odd aperture, low mirror, …);
added 4 more (struck bell, sub choir, cross weave = mutual z⁻¹ loop, harmonic
ladder) — **19 total, all compile clean** (verified by loading each through the
dropdown).

**SHIP-READY (2026-07-05).** User: "feels good enough to ship." Final polish pass:
presets `<select>` pulled to the **top** of the left panel (sibling idiom); header
title/tag realigned (bottoms flush, `baselineGap 0`, `align-items:flex-end`, h1
clamp lowered to 2.7rem, `.top` top-pad 17px so the title isn't jammed against the
screen edge); tag rewritten literal — *"a phase-modulation (FM) synthesizer you
program by writing equations"*; keyboard-hint pills were forcing horizontal
overflow (long `.chip` `white-space:nowrap` in a rigid 3-col grid) → `.keyboard`
now `flex-wrap` with wrapping chips, panel `scrollWidth-clientWidth = 0`. All
verified in preview at 1280px.

**Index-shimmer decision:** goes in the **drift section** (a third slider =
slow wander on modulation depth = brightness breathing) when built — user is happy
with the current design for now, so it is **deferred, not dropped**. Resolves that
open question.

Current shape is the intended v1: grammar + KaTeX equation HUD as the whole
interface, oil-slick/suminagashi skin, live FFT plate, piano/hex/ribbon + QWERTY +
Web MIDI + MIDI-file→WAV, ADSR/I×/drift convenience, EDO tuning, six presets.
Real remaining arcs (all parked, none blocking ship): oversampling toggle,
op-art/Binakol structural accents (own session), real suminagashi texture (user
sources; drops into the `--sumi-*` slots), `fm()` true-FM primitive, per-line
stereo routing, index-shimmer slider, DEPENDENCIES.md edge for the DSL/MIDI copies.

## Open questions

RESOLVED this session:
- **Keyboard shape** — kept moire's **canvas** surfaces (piano/hex/ribbon), did
  NOT port the siblings' DOM `buildKeyboard()`. Piano restyled to real-key look
  (dark-on-dark caps), hex close-packed. User happy. Not a DOM port.
- **Index shimmer** — → drift section (third slider), deferred (user happy with
  current design). Not dropped.

Still open (none blocking ship):
- Real suminagashi texture: user to source/make; drops into `--sumi-ground` /
  `--sumi-membrane` `url()` slots, zero code change.
- Oversampling in v1 or documented-deferred?
- Per-line output routing (stereo spread of carriers) — v1 mono like cella?
- `fm()` true-frequency-modulation primitive — ever?
- Skin: op-art (50s Riley/Vasarely) + Philippine Binakol as structural accents
  (borders/thumbs/active states) — considered, not yet built. Own session.

---

*spine: two threads cross; the cloth remembers a pattern neither thread knows.*
