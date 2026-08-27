# Sampler member — MVP specification

*Written 2026-08-27 by Claude Code, for Antigravity to build the first pass.
Status: unbuilt, unnamed. When the member is named, move this file to
`<name>/<name>.md` and keep the log at its foot.*

The suite's fifth member, and the one [suite.md](suite.md) has carried as
"member 4 — mellotron-like / sample-and-pitch-shift" since 2026-07-10. It is the
first member whose material comes from outside the file.

---

## 1. The thesis

**Replace the sine with a recording.**

Aliquoto's voice is `Σ a(n)·sin(2π·r(n)·f₀·t + p(n))` — a bank of read heads onto
a function that happens to be a sine. This member keeps the entire bank, every
column and every envelope, and swaps the function for a loaded buffer. A partial
becomes a whole recording, transposed to that partial's ratio, read at a position
that is itself an equation.

That is the new axis, stated the way the other four state theirs: **the spectrum
is *quoted*.** Aliquoto writes it, Cella answers it, Moire weaves it, Physa wears
it, and this one takes it from material that already exists and transposes it onto
a lattice the material never had.

What it does that a sampler cannot:

- **A sampler has one read head per note. This has N, at arbitrary ratios.** Play
  one key and the recording sounds at 1×, at 3/2×, at √2×, at 1/7×, each with its
  own amplitude and its own envelope. Additive synthesis where every partial is a
  recording of something.
- **Read position and pitch are separate expressions.** `x : t` plays forward.
  `x : 0.4` freezes. `x : 0.5*t` is half speed at unchanged pitch.
  `x : rnd(0,dur)` is a scatter that never repeats. None of these change the
  transposition.
- **Position keyfollows like everything else.** `hz`, `f0`, `r`, `n`, `t` are all
  in scope in the position expression, so where a head reads can depend on which
  note is played and on which partial it is.

The mellotron is the degenerate case: one head, `r : 1`, `x : t`. It should be one
line of grammar, and it should be one of the presets.

## 2. Naming — decide before the folder is created

Unnamed in every document. The suite's pattern is a Latin or Greek word carrying a
second meaning that names the mechanism (aliquot + koto; cella the inner chamber,
punning cello; moire the watered fabric; physa the bellows and the root of
*Physarum*). Two candidates fit:

- **Talea** — Latin, a cutting taken from one plant to graft onto another; also the
  repeating rhythmic segment of Ars Nova isorhythm. Both meanings are the
  instrument: material cut from elsewhere, and a segment that recurs.
- **Spolia** — the architectural fragments quarried out of older buildings and
  built into new ones. Reuse named exactly, and it rhymes with Cella's
  architecture.

**Talea is the default.** Build under `anexacta/talea/` unless Xyh says otherwise;
renaming a folder is cheap and nothing in this spec depends on the name.

The taxonomy word is **quoted**. *Harvested* died with Horn of Plenty on
2026-08-03 and should not come back — it named a batch tool, not a signal path.

## 3. Mechanism

One head `n`, one grain `k`:

```
ρ(n)   = r(n) · f₀ / f_ref            transposition of head n
x_k    = x(n, t_k)                    source position in seconds, drawn at grain start
s_k(u) = buf[ x_k + ρ(n)·u ]          u = seconds since this grain started
y(t)   = Σ_n a(n)·env(r)·adsr(t)·gain(t) · Σ_k w(u/g)·s_k(u)
```

- `f_ref` is the pitch the recording already is, a single control. `ρ = 1` when the
  played note equals it. This is the same keyfollow reference aliquoto exposes as
  **X pitch Hz**, doing a second job; relabel it **source pitch Hz** and default it
  to 261.63.
- `g` is grain length, `w` is the window, hop is `g/2`.
- Reading the buffer needs interpolation between samples: **cubic Hermite**, not
  linear. Linear interpolation on a transposed read is audible as a dull top end.
- **The window is √Hann, not Hann.** Grains at different source positions are
  mutually incoherent, so they sum in power rather than amplitude. At 50% overlap
  `Σ w² = 1` for √Hann and varies by 3 dB for Hann. Horn of Plenty's whole
  construction sits in the power domain for this reason; inherit it.
- Normalise the head sum by `Σ|a(n)|`, exactly as aliquoto's worklet does.

**The evaluation rule is the load-bearing semantic: `x` is evaluated once per
grain, at grain start, with `t` = seconds since note-on at that moment.** Every
useful behaviour falls out of that one rule, and no others are needed:

| grammar | behaviour |
|---|---|
| `x : t` | plays forward at natural speed |
| `x : 0.4` | freezes at 0.4 s |
| `x : 0.25*t` | quarter speed, pitch unchanged |
| `x : dur - t` | plays backward |
| `x : rnd(0,dur)` | full scatter — a stationary bed, written as one expression |
| `x : 0.4 + 0.05*sin(tau*t)` | scrub around a point |
| `x : n*0.2` | head n reads a different part of the file |
| `x : t + rnd(0,0.02)` | forward with jitter, the mild case |

The fifth row matters: **`rnd(0,dur)` is stationarization expressed in the
grammar.** Horn of Plenty's lesson is that periodic grain reuse is what the ear
catches and random reuse at the same rate is far less audible — so a random draw
needs no anti-repeat bookkeeping. That is why the offline stationarizer is *not* in
the MVP (see §10).

**Onset jitter is in the MVP, at one control.** Grains landing on an exact `g/2`
clock produce an audible tone at `2/g`. Jitter the hop by ±0…50% of `g/2` and it
goes away. This is one line of code and it is the difference between "a granulator"
and "material".

## 4. Grammar

Aliquoto's grammar verbatim — `partial`, `sum`, `env`, `adsr`, `gain`, `where`,
every function and constant in `MENV`, `rnd()`, the `#` comment, the `:`
separator — plus three lines and one column. Read
[aliquoto/aliquoto.md](aliquoto/aliquoto.md) § "The spectrum grammar" and treat it
as inherited, not re-specified here.

### The position column

```
r : a : x                              # ratio, amp, position (seconds)
r : a : x : A : D : S : R              # + per-head ADSR (7 fields, as aliquoto)
sum n=1..N : r(n) : a(n) : x(n,t) [: A : D : S : R] [where PRED]
```

**The third column is position, where aliquoto has phase.** Phase is meaningless
for a buffer read, and the column is worth more as position. This mirrors what
Cella did with its `q` column — same slot, different physics — so the precedent for
a column that means something different in one sibling already exists. Say so in
the notes file, so nobody later reads it as a porting mistake.

### New lines

```
x     : f(n,t)      # global position line, seconds; env-style, applies to every head
grain : f(r)        # grain length in ms, per head; r, hz, f0, n in scope
```

`grain : 90` is the default. `grain : 1200/r` gives short grains to high heads and
long ones to low, which is the granular analogue of constant-Q and is worth a
preset. Clamp to 5…500 ms, and say in the readout when a clamp bites.

### Scope

Everything aliquoto has — `n,k` indices, `r`, `hz`, `t`, `f0` — plus:

- **`dur`** — source length in seconds.
- **`f_ref`** — the source pitch control, so an expression can compute against it.

No other additions. Resist built-ins that an expression can already write.

### Worked examples, which are also the presets

```
# mellotron — one head, plays forward
1 : 1 : t

# additive of recordings — eight transpositions of one sample
sum n=1..8 : n : 1/n : t

# frozen chord, each note reading a different second of the file
sum n=1..5 : pow(2,n*7/12) : 1/n : n*0.7

# stationary bed — the Horn of Plenty case, in one line
sum n=1..12 : 1 : 1 : rnd(0,dur)
grain : 45

# subharmonic drone, slow forward read
sum n=1..6 : 1/n : 1/n : 0.15*t
grain : 220
```

The readout table should show `n`, `r`, `ρ`, `hz`, `x(0)`, `grain`, `a`, so what
the grammar computed is visible — the job aliquoto's TI-TABLE does.

## 5. Engine — what to copy, what changes

Copy `aliquoto/index.html` as the base. It has the richest grammar and the gain
infrastructure; Cella and Moire are hand-synced copies of the same DSL, so nothing
is gained by starting from either.

**Carried across unchanged.** These are the shared engine, and the reason this
reads as a sibling rather than a new app:

- `MENV`, `compileExpr(expr,vars)`, and the whole expression path.
- `buildPartials(text, ceil, f0ref)` → rename to `buildHeads`, same shape,
  same `pid` scheme.
- The voice seam: `startNote(id,hz,vel)` / `bendNote` / `stopNote`. Every surface
  produces Hz and nothing else. Do not modify it.
- `TUNING` — n-EDO, `stepToHz`, A4 reference, octave shift.
- Surfaces: retuned piano, isomorphic hex, continuous ribbon, QWERTY, multitouch
  keyed by `pointerId`.
- Web MIDI in, with the `onstatechange` rehook, velocity, pitch bend, CC64.
- `.mid` file load → play, and → offline render → WAV export. `scheduleVoice(v, at,
  dur, {ctx, dest, forceWorklet, pool, parts})` already accepts an
  `OfflineAudioContext`; it needs one addition, below.
- Voice ADSR, master, Σ ceiling, drift.

**Changed.**

1. **The processor.** `class Additive` becomes the grain reader. `processorOptions.
   parts` becomes the head list; the per-sample inner loop replaces
   `Math.sin(this.ph[k])` with a buffer read. The `f0` a-rate param, the
   `stop`/`release` port protocol, `penv` and `ads` all stay as they are.

2. **How the buffer reaches the worklet — read this before designing around it.**
   Aliquoto creates one `AudioWorkletNode` per note. Posting a multi-megabyte
   buffer per note is not viable, and it is not necessary either: **every
   `AudioWorkletProcessor` on one `AudioContext` shares a single
   `AudioWorkletGlobalScope`**, so a module-level `let SRC = null;` inside
   `WORKLET_SRC` is visible to all voices. Send the buffer once on file load,
   through any one node's port, and every later voice reads it for free.

   **The caveat that will bite during WAV export:** an `OfflineAudioContext` has
   its own worklet global scope. The offline render path must `addModule` *and*
   re-send the buffer to that context before scheduling any voice. Aliquoto's
   exporter has no such step; adding it is the one real change to `midiExport`.

   Reject `SharedArrayBuffer` — it needs COOP/COEP headers, which GitHub Pages does
   not serve, and the member has to work at `/anexacta/<name>/` unchanged.

3. **Mono substrate, capped length.** Mix the source to mono on load and cap it at
   60 seconds, stating both in the source card. Stereo doubles the memory for a
   substrate that gets panned per head anyway, and the cap keeps the per-voice
   copy honest. Both are MVP simplifications, not permanent ones.

4. **No fallback path.** Aliquoto keeps an oscillator-bank fallback for browsers
   without AudioWorklet. There is no cheap equivalent for a grain reader, and Physa
   already ships worklet-only. Detect and say so plainly — *"needs AudioWorklet:
   use a current Chrome, Edge, Firefox, or Safari"* — and do not build a
   `ScriptProcessor` version.

5. **Polyphonic**, unlike Physa. Voice pool of 8; the pool exists so heads × grains
   stays bounded. Report voices in use in the readout.

## 6. File loading

- Drop zone plus a file input. `decodeAudioData` handles wav/mp3/ogg/flac/m4a; do
  not write a decoder.
- Resample to the context rate on load, mix to mono, cap at 60 s, normalise to
  −1 dBFS peak.
- Draw the waveform with a cursor showing where head 1 is reading right now. This
  is the panel that makes the instrument legible — Physa's I–V loop does the same
  job.
- **In memory only, for the MVP.** Do not embed audio in presets and do not write
  to IndexedDB. Aliquoto's VST section flags *embed versus path-reference* as a
  decision that must be made before the state format is frozen; nothing here should
  pre-empt it. A preset stores grammar and controls, and names the file it expects.
- Ship one small sample so the page is playable on first open, and record its
  provenance and licence in an `ASSETS.md` beside it. Root
  [ASSETS.md](../ASSETS.md) governs: a freely licensed source, or one Xyh recorded.
  Nothing else.

## 7. Capability parity — the ask, itemised

| Capability | In MVP | Note |
|---|---|---|
| Expression DSL, full `MENV` | yes | inherited verbatim |
| `sum` / `where` / multi-index | yes | |
| `env`, `gain`, `adsr` lines | yes | multiply order unchanged |
| Per-head ADSR (7-field line) | yes | |
| `rnd()` | yes | and it does more work here than anywhere else |
| n-EDO tuning | yes | |
| Piano / hex / ribbon / QWERTY | yes | the ribbon matters — pitch and read rate slide together |
| Web MIDI in, bend, CC64 | yes | |
| `.mid` load → play | yes | |
| `.mid` → offline WAV export | yes | needs the buffer re-send, §5.2 |
| Polyphony + voice ADSR | yes | 8 voices |
| Presets | yes | the five in §4 |
| Readout table + equation card | reduced | table yes; KaTeX render optional |
| Drift | yes | free — it is a ratio perturbation |
| Graphic editing, `OVR`, bake | **no** | aliquoto-only, large, and not what makes this a member |
| `.tabota` import | **no** | aliquoto-only |
| Offline stationarizer | **no** | §10 |
| Multiple simultaneous sources | **no** | the grammar leaves room; one buffer in the MVP |

## 8. Interface

Follow Physa's shell — newest, written in this repository, and it already solves
the layout. Cards:

1. **Source** — drop zone, waveform with read cursor, duration, source pitch Hz,
   a *fresh sample* button.
2. **Grammar** — textarea, `apply` (Ctrl+↵), error line naming the offending line
   number, preset chips.
3. **Heads** — the readout table, plus the heads plotted on log-ratio ×
   amplitude the way aliquoto plots partials. Clicking a row solos that head.
4. **Voice** — ADSR, master, glide, Σ ceiling, grain jitter, voice count.
5. **Tuning and surface** — EDO, A4, octave, surface picker.
6. **MIDI** — status chip, `.mid` load, play, WAV export.

Copy is governed by [WRITING_VOICE_AGENT.md](../WRITING_VOICE_AGENT.md): say what a
control changes and what an action will do. The skin is Xyh's call and is not
specified here; whatever it becomes, the collection index entry has to read as one
of five.

## 9. `test.html` — required, and it gates the first pass

Physa's `test.html` renders the shipping worklet in an `OfflineAudioContext` and
measures it, and it caught real bugs. Same harness here, with these measurements.
**The first pass is not done until these run and their numbers are recorded in the
notes file.**

1. **Transposition accuracy.** Source = a 440 Hz sine. A head at `r : 1` with
   `f_ref = 440`, played at 440, must read back 440 Hz within 0.1%. Then `r : 1.5`
   → 660 and `r : 2^(1/12)` → 466.16. This is the measurement that proves the
   resampler.
2. **Position independence.** `x : t` versus `x : 0.5*t` on the same sine must
   measure the **same** pitch. If half speed drops the pitch, position and
   transposition are still coupled and the design is not implemented.
3. **Grain seam.** Source = a constant-amplitude sine. Render 2 s and report the
   RMS envelope's coefficient of variation. √Hann at 50% overlap should hold it
   under 0.02; Hann will show the 3 dB ripple, which is the fastest way to catch
   the wrong window.
4. **Scatter stationarity.** Source = a synthetic signal 9× louder at head than
   tail. With `x : rnd(0,dur)`, the head/tail RMS ratio over 4 s of output should
   land near 1.0. Horn of Plenty measured 0.98 with env CV ≈ 0.08 on the same test;
   that neighbourhood is the target.
5. **No clicks.** Maximum absolute sample-to-sample difference across a note,
   through note-on, glide and release. A discontinuity shows here before it shows
   in the ear.
6. **Keyfollow.** The same grammar played at C3 and C5 must produce spectra whose
   relative partial amplitudes match within a stated tolerance.

## 10. Deliberately not in the first pass

- **The offline stationarizer.** [suite.md](suite.md) names Horn of Plenty's engine
  (`../hindcasts/horn-of-plenty/`) as the leading candidate engine for this member,
  and it stays that. It is out of the MVP because `x : rnd(0,dur)` already covers
  the ordinary case, and the winnow/sow/flatten chain earns its cost only on sources
  that *run out* — a decaying source that a uniform random read makes quiet-heavy.
  That is arc 2: a pre-pass producing a second buffer, selectable per head as the
  thing `x` reads into. Do not attempt it in the first pass.
- **Multiple sources.** The grammar leaves the slot (`src : name`); do not build it.
- **A `pos()` built-in with an anti-repeat window.** Needed only for short sources
  where the random draw collides audibly. Measure before building.
- **Spectral or phase-vocoder transposition.** Granular is correct for this
  instrument and is what the grammar describes. A phase vocoder would change what
  `x` means.

## 11. Known approximations, to be declared in the notes file

Physa's `## Known approximations` section is the pattern. At minimum:

- **Aliasing on upward transposition.** Reading at ρ > 1 folds content above
  `sr/(2ρ)`. Cubic Hermite interpolation is the only mitigation in the MVP — no
  oversampling, no pre-filter. Loud at ρ > 2 on bright material.
- **Grain modulation.** Any granular reader adds sidebands at multiples of the hop
  rate. Jitter scatters them; it does not remove them.
- **Mono, 60 s cap.** §5.3.
- **`f_ref` is declared, not measured.** A wrong `f_ref` transposes everything by a
  constant factor and nothing warns.

## 12. Build order

1. File load → decode → mono → waveform, and the worklet global-scope buffer
   handoff. Prove it by playing one head at `1 : 1 : t` from the keyboard.
2. The grain reader: window, hop, jitter, cubic interpolation, `ρ`. Run `test.html`
   measurements 1, 2, 3, 5.
3. Grammar: `buildHeads`, the position column, the `x` and `grain` lines, the
   readout table, error reporting.
4. Surfaces, tuning, MIDI in, polyphony, voice ADSR, glide.
5. `.mid` load → play → offline WAV export, with the buffer re-send.
6. Presets, the heads plot, skin, collection index entry.
7. `test.html` measurements 4 and 6, notes file, ROADMAP and suite entries.

Steps 1–3 are the member. Steps 4–5 are inherited code being wired up. If the first
pass stops early, stop after 3 and say so.

## 13. Housekeeping the first pass owes

Per [AGENTS.md](../AGENTS.md):

- `<name>/<name>.md` — the notes file, with a dated signed entry: what changed,
  what was verified and how, and what is left undone.
- [ROADMAP.md](../ROADMAP.md) — the Anexacta **Mechanism** line gains a fifth
  instrument and its count changes; **Next in Dev** is replaced, not left standing.
- [README.md](README.md) — the member list and the repository-structure block.
- [index.html](index.html) — a fifth `<article>` matching the four at lines
  258–285.
- [suite.md](suite.md) — a log entry, and the taxonomy section gains the fifth word.
- [DEPENDENCIES.md](../DEPENDENCIES.md) — only if something is vendored. If the
  member implements everything directly, say "no contract applies", as Physa did.
- `<name>/ASSETS.md` — if a sample ships with it.
- **One agent per project folder.** This spec was written from outside the folder;
  Antigravity takes `anexacta/` when it starts, and nothing else edits that folder
  until the first pass is committed.

## 14. Open decisions for Xyh

1. **The name.** Talea, Spolia, or something else. Default is Talea, and the folder
   can be renamed later.
2. **The taxonomy word.** *Quoted* is proposed. It has to sit beside written,
   answered, woven, worn.
3. **Position in the phase column**, versus a fourth column with phase kept as a
   dead slot. The spec takes the column; the alternative preserves aliquoto line
   compatibility, which nothing currently needs.
4. **The shipped sample** — what it should be, and whether one ships at all.

---

## Log

**2026-08-27 — Claude Code.** Wrote this spec. No code. Read `aliquoto/index.html`
(grammar, `WORKLET_SRC`, voice seam, tuning, MIDI and WAV paths), `aliquoto.md`,
`cella.md`, `physa.md`, `suite.md`, and `hindcasts/horn-of-plenty/horn-of-plenty.md`
before writing it. Renumbered the members in `suite.md` in the same sitting: Physa
is the fourth, this is the fifth, the circuit-physics synth is the sixth.
Undone: nothing is built, the name is not settled, and the four decisions in §14
are open. The one design claim that has not been tested against a running browser
is §5.2 — that a module-level variable in `WORKLET_SRC` is shared across every
processor instance on one context. It follows from the spec and is the standard way
to do this, but step 1 of the build order should confirm it before the rest is
written on top.
