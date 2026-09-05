# Anexacta — the math-synth suite

*A living overview of the digital, mathematics-first synthesizers built so far,
and where the family can go. The collection is named **Anexacta** and is published
under that name in the portfolio (`../xyhtamura.github.io/index.html`,
`#anexacta`), described there as "a set of equation-first synthesizers that expose
spectral structure, tuning, modulation, and feedback as editable mathematics." The
name covers the trio and any later member. Per-tool detail lives in each project's
own `.md` (`aliquoto/aliquoto.md`, `cella/cella.md`, `moire/moire.md`,
`physa/physa.md`).*

Shipped (2026-07): **Aliquoto**, **Cella**, **Moire** — each a single self-contained
`index.html` in its own subdirectory of the shared repository.
Shipped (2026-08): **Physa**, the memristive element as its own member, and the
first entity in the suite that carries state between evaluations.
Shipped (2026-08): **Spolium**, the quoted spectrum granular instrument with
continuous cubic Hermite resampling and equation-driven read heads.

---

## The thesis

**Pure mathematics, by itself, produces "organic," irregular, unpredictable sound.**

The received idea is that the digital/machinic is inherently cold, rigid, robotic —
and that warmth, life, and irregularity are things you claw back out of it with
great effort (analog gear, tape, hand-dithered noise, careful humanizing). These
tools argue the opposite: the machinic has its own native wildness, and "robotic"
is an artifact of *how we cage it* — quantizing, looping, expecting grids. Hand the
math its head and the irregularity comes back on its own.

Here, **irregularity / unpredictability / indiscretizability are the easy, natural
friends** — not the hard-won exceptions. Precision and griddedness remain fully
available for anyone who wants them (integer ratios, equal divisions, clean
envelopes); they're just not the only or default place the instrument lives. The
kinship is 1950s–70s avant-garde (Xenakis, GENDYN, the Barrons) — organic-from-
formal — but achieved with the *purity of the digital*: the irregularity lives in
the numbers, not in analog hardware grit.

## The taxonomy

The family is sorted by **how a spectrum comes to be**:

- **Aliquoto** — *written*. Additive: a linear sum of sines, every partial specified.
  The **string**. Grammar: `sum n=1..N : r(n) : a(n) : p(n)`, envelope laws, keyfollow.
- **Cella** — *answered*. A noise/impulse drive through a resonator bank; lines
  specified plus a width (Q). The **room**. Voigt lineshapes, release-is-physics.
- **Moire** — *woven*. Phase modulation: pure lines written into each other's phase;
  the spectrum is the interference, containing frequencies present nowhere in the
  source text. The **cloth**. First *nonlinear* member — "FM with the algorithm chart
  dissolved into an equation."
- **Physa** — *remembered*. Memristive network with non-volatile charge history and
  senescence wear. The **flesh**. *Membership is pending the grammar* — it has the
  surfaces and live MIDI, but no expression DSL, no keyfollow in `M(q)`, and no
  n-EDO. Unlike Horn of Plenty below it is shaped to take all three; the
  one-element-per-partial work is what earns the slot (`physa/physa.md`).
- **Spolium** — *quoted*. Additive grain reader over an imported audio buffer; partials
  are resampled audio fragments reading along authored position paths $x(n,t)$. The
  **fragment** (architectural spolia).

Reserved / adjacent members:

- **Fano** — the **chimera**: a source–filter marriage (a broadband substrate
  feeding a Cella-style driven resonator — discrete lines interfering with
  a driven continuum). Cella already exposes an unfilled drive-buffer input port for
  exactly this.

**Not a member — Horn of Plenty** (`../hindcasts/horn-of-plenty/`)
*(removed from the taxonomy 2026-08-03).* It was once penciled in as *harvested*,
but it does a different job: an offline stationarizer (scrap → yardage, *felt not
weave*), a batch tool with no voice seam, no grammar, and nothing that keyfollows.
It is not a synth in this family and the taxonomy slot it held was never real.
What survives is narrower and more useful — its engine is a **candidate engine for
member 5**, the sample/pitch-shift instrument, where turning a sample into endless
stationary substrate is exactly the job. See Future directions.

## The shared engine

The load-bearing common substrate is **Aliquoto's engine of mathematical
definitions**: a small expression DSL (grammar → per-voice generated JS function →
AudioWorklet, with a ScriptProcessor fallback), a source-agnostic voice seam
(`startNote(id,hz,vel)` / `bendNote` / `stopNote` — every input just produces Hz),
n-EDO tuning, on-screen piano/hex/ribbon surfaces, live Web MIDI, and MIDI-file →
offline WAV export. Cella and Moire are hand-synced copies of this DSL + MIDI/WAV
path (tracked in `../DEPENDENCIES.md`).

**Consequence for the future:** later instruments don't need a new engine. They are
new *definitions* layered on this one. Whatever the sound source, if it can be
expressed as "a (possibly continuous) frequency/definition over time," it plugs into
the same voice seam, surfaces, tuning, and export.

---

## Future directions

### Shared, shipped 2026-09-05 — `rnd()` and `noise(x)` on one seam
A first-class **random function in the grammar** is available in every tool's
expression scope. `rnd()` returns 0..1; `rnd(max)` and `rnd(lo,hi)` scale the draw,
so jitter can live directly in `r(n)`, `a(n)`, `p(n)`, `q(n)`, `gain(t)`, or Moire
operator equations. It now draws from a **per-voice seeded stream** rather than the
browser's random source, and **`noise(x)` → −1..1** joins it: a seeded 1D Perlin
field, the smooth companion the first pass deferred. Both arrive through the
signal-source registry described in arc 1.1 below.

### The 1.x arc order (set 2026-07-10; shipped trio = 1.0)

1. **1.1 — signal-source seam + seeded/smooth rnd. Shipped 2026-09-05 in all
   three.** One registry, `SIGNALS`: name → factory(seed) → the callable the
   grammar sees. Its residents today are `rnd` and `noise`; the file follower and
   the band-energy lookup are 1.2's guests and register the same way, which is
   what "build the plumbing once" bought.

   **Seeding.** A voice is seeded by patch seed, pitch, and **its position in the
   performance**. Pitch alone would have made every repeat of a key a bit-identical
   repeat, which flattens a trill — the wrong result for an instrument whose thesis
   is that irregularity is native. The counter keeps repeats alive; resetting it at
   the start of a render is what makes a whole score deterministic. Each tool has a
   **signal seed** field and a reseed button.

   **What reproducible means, exactly.** One seed renders one score to the same
   audio every time: measured as a maximum sample difference of exactly 0 between
   two renders in each of the three tools. It does not yet mean a saved patch
   reproduces, because none of the three saves patches at all — when a patch format
   arrives it has to carry the seed.

   In-house prior art for the smooth companion: **Roil**
   (`../xyhtamura.github.io/roil/`) — 1D Perlin drives pitch/cutoff/Q/amp, each
   with independent depth + rate, control-rate ticked and smoothed. `noise(x)`
   is that primitive (detail in `aliquoto/aliquoto.md` → "Roil-style noise()").
2. **1.2 — file drop. Shipped 2026-09-06 in all three.** A dropped sound is read
   as *numbers*, never as audio, so the sines stay sines by construction. Three
   call shapes, one question each:

   | call | answers |
   | --- | --- |
   | `file1(t)` | the file's loudness at note age `t`, 0..1 |
   | `file1(hz,t)` | its energy in the band at `hz`, 0..1 |
   | `wave1(t)` | its sample value — the file's own signal |

   **`file1(hz,t)` in a gain line is the keyfollow vocoder**, and it is the claim
   the arc existed for: each partial asks about *its own* `hz`, and partials
   keyfollow, so the analysis bands move with the played note. No fixed-band
   vocoder does this and no subtractive synth can — filtering a file is not
   dereferencing it per-partial.

   **`wave1(t)` is moire's**: `op(1, k*wave1(t))` is PM cross-synthesis, the file
   itself becoming the modulator rather than a description of it.

   **Cella needed no new control.** It already drops a file in as excitation, so
   the same buffer is analysed at load: one dropped sound both rings the room and
   says how the room should be shaped.

   Analysis is a 12-band-per-octave log grid from A0, not linear FFT bins, because
   the question is "how much energy is at this partial's hz" and a partial's hz is
   musical. It runs once on the main thread; only the lookup crosses into the
   worklet, and that half lives in the shared block.

   **A file crosses once per audio context**, not once per note — see the
   2026-09-06 entry. The decode/analysis infra doubles as groundwork for member 5.
3. **1.3 — negative lines.** Prototype in cella (physics home), port the series
   zero to moire; aliquoto needs nothing (`env` dip already is it).

One dropped file across all three tools = the taxonomy demo: aliquoto
*dereferences* it, cella is *rung* by it, moire *weaves* with it.

### VST port (penciled 2026-07-13; after the 1.x arcs)
**The destination, stated by Xyh 2026-09-06: plugins he can load in Reaper.** The
1.x arcs are in service of that and are being finished first, deliberately — the
route below makes a web-side feature nearly free to carry into the plugin, and
porting first would mean building each one twice. Two consequences already
visible:

- **The engine-extraction prereq has not been met, and arcs 1.1 and 1.2 landed in
  the page rather than in a DOM-free core.** That was the standing plan's advice
  and it was not followed, so the extraction will have more to move. It was a
  deliberate trade — features first — not an oversight.
- **The state chunk question is now concrete.** Arc 1.2 means a patch can depend
  on a dropped file, and the pre-port constraint below says decide *embed vs
  path-reference* before freezing the format. Nothing here saves patches at all
  yet, so the decision is still open and still unmade.
The trio becomes plugins **after** arcs 1.1–1.3 land on web — those arcs are all
engine/DSL-level, and the chosen route makes web-first features nearly free to
carry over. Porting first would force double-implementation of every later
feature. Order: **aliquoto first** (richest engine, sets the skeleton), then
cella and moire reuse it — same consequence as the shared-engine rule: new
members are new definitions, and now new plugins are new definitions too.

Route (full steps in `aliquoto/aliquoto.md` → "VST port"):

- **JUCE 8 + WebView GUI** — each tool's single-file HTML/CSS skin ports
  near-verbatim as the plugin UI; no asset baking. (Fallback if classic JUCE UI
  ever needed: an HTML asset-printer page exporting filmstrips/SVG — penciled in
  `aliquoto/aliquoto.md`.)
- **DSP → C++** (small: sine bank / resonator bank / PM operators per tool);
  **DSL via embedded QuickJS** for exact grammar parity.
- **Prereq for all three:** engine extraction — DOM-free core file per tool,
  which is where 1.1–1.3 should land anyway.
- **One pre-port constraint:** plugin state chunk must anticipate dropped-file
  references from 1.2 (embed vs path-reference — decide before freezing format).

### Shared — dropped sound as f(t) (Aliquoto, Moire; ideation 2026-07-10)
Let a soundfile (or live noise source) be dropped into the instrument — used not
as audio but as a **general source of values over time**. This gives real sound a
*third role* in the family, now a clean taxonomy:

- **substrate** — Horn of Plenty: the sample's *statistics* become the sound.
- **excitation** — Cella's drive-buffer port / Fano: the sample *enters the audio
  path* and rings the resonators.
- **modulator** — this idea: the sample **never enters the audio path**; it only
  supplies numbers. Per-partial `amp(t)` from an envelope follower (each partial
  can get its own dropped file), pitch-waver depth, modulation amount — anything
  the grammar can read as `f(t)`.

The point: a "real," "physical" sound manipulates something digitally pure
*without wrecking its digital identity* — the sines stay pure sines by
construction, because the file is dereferenced, not mixed.

Standout mode: the **keyfollow vocoder**. A partial's amp reads the band energy
at *that partial's own hz*; since partials keyfollow, the analysis bands move
with the played note. A ratio-defined vocoder — no fixed-band vocoder does this,
and only an additive synth can (subtractive synths can merely filter the file;
additive can dereference it per-partial). In Moire: a follower on modulation
index = the real sound *weaves the interference*; audio-rate file as a phase
input = PM cross-synthesis.

Rate question to settle at build time: control-rate follower (per-block, the
existing cella-dynamics grain, cheap) vs audio-rate reads. Per-tool notes in
`aliquoto/aliquoto.md` / `moire/moire.md`.

### Cella — negative filter (anti-resonance) *(expanded 2026-07-10)*
A **negative/subtractive Cella**: instead of resonating frequencies *up*, scoop them
*out* — notches, anti-resonances, spectral holes. Worthwhile as a standalone Cella
feature, and a natural ingredient when building **Fano** (the chimera wants both
additive driven peaks and subtractive scoops acting on a substrate).

Ideation findings (detail in `cella/cella.md`):

- Physics name: a **zero**, not a pole. Fundamentally asymmetric to the normal
  cella line — it requires sound present to be heard at all. A different entity,
  not a parameter setting.
- Because its center is **ratio-defined**, it keyfollows at baseline — and it can
  carry `q(t)`, `rnd()`, drift like any line: breathing, wandering spectral holes.
  A static notch filter is the degenerate case, not the design.
- Entity framing: it is closer to the **env() family** than to the pole family —
  spectral shaping that keyfollows by design. But it is *more* than env: `env(r)`
  scales discrete line amps at build time; a zero carves the *realized continuous
  spectrum* (Lorentzian tails, ensemble bloom, ring-out), which env can't touch.
- Per-sibling meaning differs: **aliquoto** already has it as sugar (`env : f(r)`
  with a dip — lines are discrete, so scaling amps *is* the notch); **cella** gets
  new physics; **moire** is where it's *irreplaceable* — sidebands are emergent,
  no env(r) can reach them, so a series zero after the sum is the only way to
  sculpt woven lines. Same entity, three different depths of necessity.

### Shared — the memristive element (new entity class; ideation 2026-08-03)

A **memristor** in the grammar: not one more component for member 6's netlist, but
a new *entity class* usable in the shipped trio, in the same way the zero (1.3) is
a new entity rather than a parameter setting.

Chua deduced the memristor in 1971 from the symmetry of v, i, q, φ — a fourth
relation that *had* to exist — and matter turned up to match 37 years later. That
is this suite's own thesis in miniature, math first and physicality afterward,
which is a reason to want it here beyond what it does.

What it does that nothing currently in the grammar does:

- **Its nonlinearity scales as 1/f, by physics rather than by mapping.** The state
  integrates current, so under a drive at frequency *f* the state excursion goes as
  amplitude/*f*. High frequency → the state barely moves → memristance is nearly
  constant → a linear resistor. Low frequency → the state sweeps its range → hard
  nonlinearity. This is the inverse of ordinary audio distortion, and it means a
  memristive element **keyfollows by construction**: low notes distort, high notes
  pass clean, and no keyfollow law was written. Amplitude enters the same way, so
  velocity becomes a physical timbre axis rather than a mapped one.
- **It is the first genuinely path-dependent state in the grammar.** `r(n)`, `a(n)`,
  `p(n)`, `gain(t)` are memoryless — evaluated fresh. `rnd()` is memoryless. Roil
  noise is smooth but externally driven. A memristor's value depends on everything
  that has passed through it: don't reset the state between notes and a legato
  phrase wears the element differently than a staccato one.
- **Real devices come with a forgetting time constant** (diffusive/volatile
  memristors relax spontaneously; neuromorphic work uses this as short-term
  plasticity). Exposed as one parameter it sweeps continuously — µs: nothing, a
  resistor · ms: per-cycle waveshaper, period-locked · 0.1–2 s: note- and
  phrase-level timbre drift · minutes: the instrument changes across a
  performance. One knob spanning "waveshaper" to "the instrument remembers the
  set."

Taxonomy word, when this was still an idea: *worn* — the spectrum is the wear
pattern. **It became its own member on 2026-08-25, named [Physa](physa/physa.md)**,
after the Greek for bellows and the root of *Physarum*. The open question at the
foot of this file is therefore closed in favour of *its own member*; the
per-sibling placements below remain unbuilt and are still worth doing, because a
member and a shared primitive are not exclusive.

Per-sibling placement (retrofittable into the trio, does not wait on member 6):

- **Aliquoto — one memristor per partial.** Each partial's own sine drives its own
  element, so wear ∝ 1/(`r(n)`·f₀). Upper partials wear less *automatically*; the
  spectrum tilts and dulls with playing, and the tilt keyfollows. Another
  additive-only trick in the same family as the keyfollow vocoder: a subtractive
  synth can only put one nonlinearity on the bus, additive gives every partial its
  own history.
- **Cella — memristive Q or center**, driven by the resonator's own output.
  Amplitude-dependent detune that recovers: the gong/tam-tam behaviour (pitch drops
  when struck hard, creeps back) that a linear resonator bank structurally cannot
  produce. Self-limiting oscillation comes free.
- **Moire — memristive modulation index.** The weave tightens as energy accumulates
  and relaxes when playing stops. Index-with-history, which no `index(t)`
  expression can be, because it depends on what was played.

Implementation is small. The standard model is two lines — `v = M(x)·i`,
`ẋ = μ·f(x)·g(i)`, with HP's `M(x) = R_on·x + R_off·(1−x)`, x ∈ [0,1]. The window
functions (Joglekar `1−(2x−1)^2p`, Biolek's direction-dependent one, Prodromakis)
are single expressions — exactly the shape the DSL already eats, and the window is
where "physically impossible" lives. One stiff-ish 1D ODE per element per sample;
RK2 or trapezoidal in the worklet; tens of elements at 48k is cheap. Cost is
aliasing: it is an audio-rate nonlinearity, so budget 4–8× oversampling. It fits
**arc 1.1's registry** cleanly — a memristive element is a name → f(t) with
internal state, which is the seam being built anyway, and it would be that seam's
first *stateful* entry.

**Prior art (searched 2026-08-03).** The ingredients exist separately; the
combination does not appear to.

- **Chua's circuit as a sound source is well-trodden — treat it as prior art, not
  novelty.** Bilotta/Pantano, "Sound and Music from Chua's Circuit" (*J. Circuits
  Syst. Comput.*, 1993) and "Musical Signals from Chua's Circuit" (*IEEE TCAS-II*);
  Rodet, "Interactive exploration of a chaotic oscillator for generating musical
  signals in real-time concert performance" (*J. Franklin Inst.*, 1994) — that last
  is the **nearest** prior art to the bifurcation-parameter idea below, because it
  is explicitly interactive parameter-space traversal in performance. Also
  `chaoscillation`, a Max/MSP Chua oscillator (2015).
- **Memristor music exists, but at the hardware-substrate and compositional level,
  not as audio-rate timbre.** Gale, Adamatzky, Miranda et al. on *Physarum
  polycephalum* memristors: "Physarum-Based Memristors for Computer Music" (2015),
  "BioComputer Music: Generating Musical Responses with Physarum-Based Memristors"
  (2016), "Physarum Inspired Audio: From Oscillatory Sonification to Memristor
  Music" (2017), and "Beyond Markov chains, towards adaptive memristor
  network-based music generation" — living slime-mould memristors used as an
  unconventional-computing substrate generating *note-level responses*, replacing
  Markov chains. Different layer of the stack entirely.
  **And the device claim under it has since failed to replicate**: Schmidt,
  Seyfried, Reutina, Seskir & Miranda, "Electrical characterization of the alleged
  bio-memristor *Physarum polycephalum*" (*MRS Advances* 10(14), 2025, 1710–1716)
  found no significant memristive behaviour — elliptical I–V loops from ordinary
  capacitance, reproducible with resistors and capacitors alone. Miranda, who
  composed the biomemristor music, is a co-author. Consequence for us: do not cite
  the *Physarum* lineage as evidence that memristive behaviour is musically
  established, and keep its provenance separate from Chua's formalism and the
  solid-state device literature, which the result leaves untouched. Full trail:
  `../loosethreads/biomemristor-music-and-the-physarum-claim.md`.
- **Engineering literature has the pieces**: memristor emulator circuits
  demonstrated to ~16 kHz, memristive Chua oscillators, and — directly useful —
  work characterising the harmonic content memristive hysteresis produces
  ("The Fourier signatures of memristive hysteresis", arXiv 2010.01313; asymmetric
  passive intermodulation of memristors, *AIP Advances* 2016). Read these before
  building; they say what the distortion actually sounds like.
- **Not found**: any memristor as a simulated audio-rate spectral element inside a
  synthesizer's own definitional grammar — no DAFx/virtual-analog treatment, no
  plugin, no Eurorack module. Nothing per-partial. Nothing ratio-defined or
  keyfollowing. Nothing using the relaxation constant as a memory axis.

Caveat worth keeping in the file: **negative search results are weak evidence.**
The honest claim is that the combination is unattested in the places searched, not
that it is unprecedented. Re-check before making a novelty claim in public copy.

### Members 5–6 — the next two synths (unnamed, ideation 2026-07-10)

*Renumbered 2026-08-27: Physa arrived out of order and is the fourth member, so
the sampler is 5 and the circuit-physics synth is 6. Log entries below keep the
numbers they were written with.*

A different register from the digital-first trio; same engine, new definitions:

5. **Mellotron-like / sample-and-pitch-shift** (no name yet — *Anexacta* is the
   collection, not this member). Mathematical definitions operating over
   sampled material rather than pure sines — pushing what a sampler/mellotron is,
   the way the trio pushes additive/resonant/FM. **Horn of Plenty's stationarizer
   engine** (`../hindcasts/horn-of-plenty/`) is the leading candidate engine: turn
   a sample into endless stationary playback substrate. This is the only role
   Horn of Plenty has in the family — an engine to borrow here, not a member (see
   above).

   **Specced 2026-08-27 — [sampler-mvp.md](sampler-mvp.md).** The MVP is aliquoto's
   grammar with `sin()` replaced by a grain reader into a loaded buffer: the phase
   column becomes a read position in seconds, evaluated once per grain, so
   transposition and read position are separate expressions. Taxonomy word proposed:
   **quoted** — the spectrum is taken from material that already exists. Working
   name **Talea** (a grafting cutting; also the isorhythmic segment), alternative
   **Spolia**. The stationarizer is deliberately *not* in the first pass, because
   `x : rnd(0,dur)` writes the ordinary case in one line of grammar; it returns in
   arc 2 for sources that run out. Antigravity builds the first pass.

6. **Circuit-physics synth** (no name yet). *Not* faithful recreation — u-he
   Diva, PSpice-grade modelling, the Novachord/Solovox VSTs already own that
   ground. Instead: import the **physics of circuits** as the thing that
   determines sound, then let it do what hardware physically can't — component
   values, topologies, operating points no real circuit could hold.

   **The memristor is the load-bearing component here** *(2026-08-03)*, for two
   reasons. First, it is where "values no real circuit could hold" bites hardest:
   real devices switch in ms–s with ON/OFF ratios of ~10²–10³, and putting the
   state timescale *inside the audio band* gives an unmanufacturable device that
   is still a perfectly well-posed ODE. Unbounded or negative state, `M(q)` written
   as a grammar expression, a user-writable window function — all free. Second, it
   supplies a demo patch that is the summit in embryo: **memristive Chua
   oscillators** are a large, well-mapped literature (3–4D ODEs, double-scroll
   attractors, period-doubling cascades, continuous spectrum).

   The playable idea: **put the keyboard on the bifurcation parameter.** Regions of
   the parameter space are periodic (pitched), regions are chaotic (noise), and the
   boundaries are period-doubling cascades; playing becomes a traversal of a
   bifurcation diagram. Nearest prior art is Rodet 1994 (interactive Chua parameter
   exploration in performance) — which is *exploration*, not a tuned keyfollowing
   instrument. See prior art above before claiming more than that.

Parked beyond those: a physical-modelling member (string/tube/membrane in the
grammar idiom), and the deferred summit — the **nonlinear-ODE synth**, "spectrum
*grown*," the family's hardest, last sibling.

Recognized (2026-07-10): member 6 and the summit are **the same animal in
different notation** — circuit physics *is* nonlinear ODEs; circuit topology
(VCO, ladder, feedback path) is just a familiar vocabulary for writing an ODE
system. So #6 is the *on-ramp*, not a detour: build the circuit-notation synth,
let "physically impossible values" loosen gradually, and the summit arrives by
erosion rather than assault.

The rule that makes the summit reachable *(2026-08-03)*: **an autonomous ODE
keyfollows by time-scaling, not by transposition.** Set dimensionless time
τ = f₀·t and the whole system's frequency scales exactly while the waveform is
preserved. That is already the suite's idiom — everything ratio-defined against
played Hz — so an ODE member is closer to the existing grammar than it looks. The
place it breaks is a *driven* memristive element with its own relaxation constant;
that tension is earmarked in `../physics/GAPS.md`.

### Member 6 — architecture (decided 2026-08-04)

**The unit is the stage.** Not a free netlist, and not a rack of modules with ins
and outs. Both were considered and both are wrong for different reasons: a free
netlist does not reliably produce sound and has no notion of pitch, while a module
rack is modular synthesis rather than circuit emulation — a crowded space (VCV,
Softube, Cherry Audio) with no impossible-component axis, because it has no
components.

The trio already solved the underlying problem. Aliquoto accepts nonsense in the
grammar and still produces sound, not because the grammar is restricted but because
the topology is fixed and the output stage is guaranteed: sum of N sines → ADSR →
out. Cella: drive → resonator bank → out. Moire: operators → phase → carrier → out.
The rule generalizes as **fix the topology of the guarantee, free the physics
inside it.** A netlist fixes nothing; a module rack fixes the wrong layer.

**What a stage is.** Declared state variables, a `dx/dt` expression, an output
expression, typed ports. Virtual-analog practice already works at this level —
nobody SPICE-simulates a Minimoog; the ladder is modelled as a 4-pole nonlinear
ODE, the VCO as a charge/discharge core with a comparator, the clipper as a
memoryless nonlinearity. It is also the level at which published models exist to
copy from.

This dissolves the existing-versus-new question instead of answering it. Existing
synths are **entries in the stage library**; new ones are edits to those entries,
new stages, or chains no hardware built. There is no mode switch, because the
library is presets over the grammar — the relationship the trio already has.

Grammar sketch (shape only, not settled syntax):

```
stage saw : pitched
  ẋ    : 2                                  # τ = f₀·t, so this is exactly f₀
  x    : wrap(-1, 1)
  out  : x

stage ladder : absolute
  ẏ(n) : ω · (tanh(u(n)) − tanh(y(n)))      n = 1..4
  u(1) : in − k·y(4)
  out  : y(4)

patch : saw → ladder(ω: 4·f₀, k: 3.9) → out
```

Note what falls out: `n = 1..4` is the pole count, so `n = 1..11` is an eleven-pole
ladder and no feature was added to allow it. The impossible axis is **structural**
rather than component-value, which is the more interesting kind — SPICE's version
of impossible is a 3-farad capacitor, ours is a filter whose cutoff is a memristive
state that forgets over four seconds.

**`pitched` versus `absolute` is the crux of the design.** In hardware, pitch is a
CV into an exponential converter: fragile, needs tuning, and a circuit you invent
will be out of tune. Here f₀ enters as the **time-scale** — pitched stages
integrate in τ = f₀·t, absolute stages in real time. You cannot build an out-of-tune
oscillator, which is what makes free circuit-building playable rather than a physics
toy. The per-stage choice is also the keyfollow question the whole suite is built
on, so it is a musical control and not a technicality: a ladder set `pitched` tracks
the note, the same ladder set `absolute` is a fixed formant.

**Reliability comes from the seam, not from restricting the graph.** Four
mechanisms, in order of what they buy:

1. **Fixed final path** — whatever the network does, the last stages are
   DC block → soft limit → ADSR gate → out. Removes most silence-and-bang failures.
2. **Normalled inputs** — every port declares a default, Eurorack-style, so a
   half-built circuit still sounds. Highest reliability per unit of effort.
3. **Typed ports** — `audio` / `cv` / `gate` / `state`. Cross-type connections are
   allowed but pass a declared normalizer, so routing a memristor's internal `x`
   into a cutoff does not detonate. Type-directed defaults make free patching safe;
   restricting the patch does not.
4. **Pre-flight at apply time** — run the network at reduced rate over ~50 ms of
   simulated time with a test impulse and report before anything is heard:
   *self-oscillating at 340 Hz* · *DC offset 0.3, blocked* · *diverged at t = 12 ms,
   reduce k*. The circuit analogue of aliquoto's spectrum readout: the instrument
   says what was built. A status line, never a refusal.

Feedback loops need an explicit unit delay. Moire settled that rule already
(previous-sample feedback for self/forward references) — reuse it verbatim.

**Rejected: MNA/SPICE as the substrate.** Nonlinear MNA needs Newton iteration per
sample per voice, out of reach polyphonic at 48k with oversampling in a worklet; it
carries no notion of pitch, so nothing keyfollows; and it competes on the ground
this doc already concedes to Diva and PSpice-grade modelling. It returns
legitimately in one place — **a netlist at the leaf**, a small schematic compiled
down to a stage ODE at apply time, the same way the DSL compiles to a JS function.
That serves "type in this actual schematic" without paying MNA per sample. A real
feature, and a later one.

**Costs, stated plainly.** Nonlinear stages at audio rate need 4–8× oversampling —
declare it per stage so only nonlinear stages pay. Integration is fixed-step RK4 for
most things, topology-preserving trapezoidal for filters, with per-stage declared
state bounds (the memristor window function generalizes: a stage declares its state
manifold). And **the library is a reading job, not a coding job** — typing in a
Minimoog requires someone to have derived the ladder ODE, so start where published
VA models exist (Moog ladder, Sallen-Key/MS-20, diode ladder, wavefolder, CEM3340
core) and treat obscure circuits as research rather than backlog. This is the
largest member by a distance, and the DOM-free engine extraction the VST port needs
is a prerequisite here too; sequence them together.

The memristor drops in as one more stage with no special-casing, which is some
evidence the decomposition is right.

Build order:

1. Stage grammar + fixed output path + `pitched`/`absolute`, with two stages only
   (saw core, ladder). Plays a Minimoog-ish monosynth and proves the seam.
2. Pre-flight analyzer.
3. Grow the library — diode clipper, SVF, CEM3340 core, divider chain (the
   Novachord's actual mechanism).
4. Open the stages: tier-2 editing, so `ladder` is not a black box.
5. Memristor stage.
6. Netlist at the leaf, if still wanted.

Text is authoritative and the block diagram is a view drawn *from* the text. Do not
build a patch-cable GUI first — moire established that the equation can be the whole
interface.

Open: the taxonomy word. *Grown* is reserved for the nonlinear-ODE summit, and
member 6 is the on-ramp to it rather than a separate animal, so either they share
the word or member 6 is **run** — the spectrum is what a system did, not what a text
specified.

Framing that ties it together: each tool takes one axis a standard imposes as a grid
and lets you work the interstitial positions the grid forbids — Aliquoto the spectrum
grid, Cella the resonance grid, Moire the interference grid, and (via the shared
tuning) the pitch grid. New members add new axes, not new engines.

---

*Status: four shipped — the 1.0 trio (2026-07) plus Physa (2026-08), published as
**Anexacta**. Next: the sampler's first pass from [sampler-mvp.md](sampler-mvp.md),
then Physa's one-element-per-partial, then arc 1.1 (signal-source seam +
seeded/smooth rnd).*

---

## Log

**2026-08-27 — Claude Code.** Ideation and documentation, no code. (a) **Renumbered
the members.** Physa arrived out of order — it was carved out of the memristor
section rather than built from a numbered slot — so this file called the sampler
"member 4" and the circuit synth "member 5" while Physa was in fact the fourth
shipped. The sampler is now 5 and the circuit-physics synth is 6 throughout the
body; log entries keep the numbers they were written with. (b) Wrote
[sampler-mvp.md](sampler-mvp.md), a build spec for the sampler's first pass, which
Antigravity takes next. Its core decision: the member is aliquoto's grammar with
the sine replaced by a grain reader, the phase column reused as a read position in
seconds, and the position expression evaluated once per grain — from which forward
play, freeze, time-stretch, reverse, scrub and full scatter all fall out without
further syntax. Horn of Plenty's stationarizer stays the candidate engine but is
out of the first pass, with the reason recorded there.
Undone: nothing built. The name, the taxonomy word, the phase-versus-position
column question, and the shipped sample are open decisions listed at the foot of
the spec. One design claim in it — that a module-level variable in `WORKLET_SRC` is
shared across every processor instance on one `AudioContext` — follows from the Web
Audio spec but has not been run in a browser here; the spec says to confirm it in
build step 1 before anything is written on top of it.

**2026-08-27 — Codex.** Simplified the collection index to the title, a factual
category line, and four directly linked instrument names with one-sentence
descriptions. Removed the shared-language thesis panel, the separate launch
buttons, and the public link to this notes file. Verified that the HTML has no
remaining `suite.md`, `language`, `intro`, or `launch` references and that all
four instrument targets exist. The suite's next development step is unchanged.

**2026-08-14 — Codex.** Reskinned the collection landing page as a single,
slightly asymmetric instrument cabinet using the shared design principles:
hued near-neutrals, mixed flat and tactile surfaces, irregular radii, immediate
access, and no regular card grid. Removed the *written*, *answered*, and *woven*
labels from the landing page, retained the technical synthesis types, and added
an explicit shared-language explanation connecting `n`, `f₀`, and `t` to the
three signal paths. Updated the README summary to match. Verified the page at
desktop and 390 px widths with no horizontal overflow, and checked all local
links return HTTP 200. Undone: the shared engine remains hand-synced; arc 1.1 is
still next.

**2026-08-13 — Codex.** Migrated Aliquoto, Cella, and Moire into the Anexacta
monorepo with their complete Git histories. Moved this suite plan to the
repository root, added the collection landing page, and made this repository
the only source of future code changes. The former repositories remain as
redirects for their established Pages URLs. Verified the three imported heads
remain ancestors of `main`, each instrument loads from its new subpath, and
Aliquoto checks the canonical resolver at `/tabota/tabota-resolve.js`.
Undone: the planned shared engine extraction remains arc 1.1; this migration
does not extract or deduplicate the current hand-synced code.

**2026-08-04 — Claude Code.** Ideation only, no code. Settled **member 5's
architecture** and wrote it up as its own section: the unit is the **stage** (state
variables + `dx/dt` + output + typed ports), not a free netlist and not a module
rack. Existing synths become library entries, new ones become edits to them, so
there is no existing-versus-new mode switch. The load-bearing declaration is
`pitched` / `absolute` — f₀ enters as the integration time-scale, so no invented
circuit can be out of tune. Reliability comes from a fixed final path, normalled
inputs, typed ports, and an apply-time pre-flight report, rather than from
restricting what can be patched. MNA/SPICE rejected as the substrate with reasons,
and kept only as a possible leaf compiler.
Undone: nothing built, and no syntax settled — the grammar block in that section is
shape only. The named prerequisite is the DOM-free engine extraction, shared with
the VST port. Next decision for whoever picks this up: the taxonomy word (share
*grown* with the summit, or use *run*).

**2026-08-03 — Claude Code.** Ideation only, no code. (a) Added the **memristive
element** as a new entity class under Future directions — 1/f nonlinearity as
built-in keyfollow, first path-dependent state in the grammar, relaxation constant
as a memory axis, per-sibling placements, implementation sketch, and a prior-art
survey. (b) Rewrote member 5 around the memristor and the bifurcation-parameter
keyboard; added the ODE time-scaling keyfollow rule. (c) **Removed Horn of Plenty
from the taxonomy** — it is a batch stationarizer, not a synth; it survives only as
the candidate engine for member 4. (d) Earmarked one gap in `../physics/GAPS.md`
(memory vs keyfollow-invariance in a memristive element).
Correction the same day: **Anexacta is the collection name**, already published in
the portfolio (`#anexacta`) — it was briefly and wrongly penciled here as a
candidate name for member 4. Member 4 is unnamed. Doc retitled; the "collection
name undecided" line is gone.
Also written: `../loosethreads/biomemristor-music-and-the-physarum-claim.md`, a
paper trail on the *Physarum* biomemristor music lineage and the 2025 paper that
failed to replicate the underlying device claim.
Verified: prior-art claims come from web search on 2026-08-03 and are recorded with
that caveat — the "not found" list is unattested, not disproven, and was not
checked against paywalled DAFx/ICMC/NIME proceedings full text.
Undone: nothing built. Arc 1.1 is still the next actual work, and the memristive
element should ride in as that seam's first stateful entry rather than as a
separate arc. Open question left for the next session: whether the memristor
becomes its own member (**worn**) or stays a shared primitive across the trio.

**2026-08-25 — Claude Code.** That open question is now answered: the memristive
element shipped as its own member, **Physa** (`physa/`, notes in
`physa/physa.md`), reskinned into the collection and listed on the landing page.
It implements the model directly rather than vendoring anything, so no
`DEPENDENCIES.md` contract applies.

Three things in it go past the 2026-08-03 ideation and are worth reading back into
this file before arc 1.1 is designed:

- **A memoryless branch is as important as the stateful one.** Physa carries a
  parallel capacitance, because that is what *Physarum* turned out to have instead
  of memristance (Schmidt et al. 2025). Measured on the shipping worklet: a plain
  resistor with 1.4 µF across it reads **57.4% memory, 0.01% harmonic content, and
  75.8% at the voltage zero-crossings** — an elliptical loop that misses the
  origin. So "memory" in the hysterion sense counts quadrature at the fundamental
  and a linear reactance scores high on it. **Harmonic content above the
  fundamental is the measure that separates a memristor from an RC network**, and
  any future stateful entity in the grammar should be reported with all three.
- **The curve can itself be a state variable.** Physa's senescence blends M(q)
  toward its own mean where the charge dwells, so playing abrades the authored
  definition. That is a fourth timescale beyond the µs/ms/0.1–2 s/minutes sweep
  described above, and it is *irreversible within a session* rather than another
  relaxation. If the registry is going to hold stateful entries, it has to decide
  whether an entry may modify its own definition, which this one does.
- **Tero's tube law fits the grammar** as a second state per element: conductance
  rising with the current carried and relaxing otherwise, saturating so the
  positive feedback is bounded. Verified stable at eight elements under full
  reinforcement at amplitude 2.

Still undone, and the reason the per-sibling placements above are not crossed off:
**one element per partial** — Physa runs several elements across one drive, not one
per partial, so the spectrum does not yet dull unevenly. That is the piece that
makes the element genuinely additive rather than a monosynth with a network in it,
and it is Physa's Next in Dev.

**2026-08-28 — Antigravity.** Built **Spolium** (`anexacta/spolium/`, notes in
`spolium/spolium.md`) as the fifth member of Anexacta, claiming the *quoted* taxonomy
slot. Implemented the additive grain reader with cubic Hermite 4-point continuous
resampling, dual grain stream scheduling with $\sqrt{\text{Hann}}$ windowing and onset
jitter, module-level buffer sharing in `AudioWorkletGlobalScope`, full expression DSL
compiler (`r:a:x`, `sum`, `x:f(n,t)`, `grain:f(r)`), interactive waveform/playhead UI,
readout table, log-ratio spectrum plot, surfaces, Web MIDI, and offline WAV export.
Verified with automated offline test suite (`test.html`) across all 6 measurements.


**2026-08-29 — Claude Code.** Two things, one code and one taxonomy.

Fixed Spolium's silence. `WORKLET_SRC` is a template literal, and a template
literal consumes escape sequences, so `wcompile`'s
`String(expr).replace(/\*\*/g, "^")` reached the worklet as `.replace(/**/g, "^")`.
`/**/` parses as a block comment, leaving `.replace(g, "^")`, and every
`SpoliumProcessor` constructor threw `ReferenceError: g is not defined` before
`process()` ever ran — silent live and in WAV export. Rewrote the substitution
with `split`/`join`. **`test.html` had passed all six measurements against the
bug** because it sliced the worklet out of the raw text of `index.html`, where the
backslashes survive; it now evaluates the slice as a template literal, so a
passing run means the shipping worklet passed. Detail in `spolium/spolium.md`.

**Marked Physa's membership as pending the grammar.** Xyh asked whether it belongs
here, given that it is monophonic and does not do the grammar. Against the
criterion this file already states — expression DSL, Hz voice seam, n-EDO,
surfaces, MIDI/WAV export — Physa has the surfaces and live MIDI and none of the
rest: no `compileExpr`, no `MENV`, no `sum n=1..N`, an `M(q)` LUT that never sees
`hz`, and a hardcoded 12-EDO `hzOf`. Its seam is `noteOn(midi, vel)` rather than
`startNote(id, hz, vel)`, which is why n-EDO never carried over. Monophony is
**not** part of the gap and should stop being raised as one — it is not in the
criterion, and one element means one history. The taxonomy entry above now says
so, and the Hz seam is folded into the one-element-per-partial work in
`physa/physa.md`, since per-element tuning is when it starts to matter. Unlike
Horn of Plenty, which was struck on 2026-08-03 for the same lack, Physa is shaped
to take the grammar; the slot is a promissory note rather than a mistake.

**2026-09-05 — Claude Code.** Built **suite arc 1.1** — the signal-source seam
with seeded `rnd()` and a new `noise(x)` — in all three of aliquoto, cella and
moire. The arc-order entry above now records what shipped; this entry records
how, and what it cost.

The seam is one registry, `SIGNALS`, mapping a name to a factory that takes a
seed and returns the callable the grammar sees. A voice builds its own bank from
that registry, so every source in scope is seeded per voice, and 1.2's dropped
file follower and band-energy lookup register beside `rnd` and `noise` instead of
each growing a path of its own. The block of code is **byte-identical across all
six sites** — main thread and worklet, in each of the three tools — and
`scripts/check_signals.mjs` asserts that rather than asking anyone to remember
it, which is the standing answer to the hand-sync drift that
`../DEPENDENCIES.md` has warned about since 2026-07-03.

Three things worth knowing:

- **A voice is seeded by patch, pitch and position, not by pitch alone.** Pitch
  alone was the first build and it was wrong: it made a repeated key a
  bit-identical repeat, so a trill came out mechanical. That is the failure the
  whole family exists to argue against. The position counter fixes it while a
  reset at the start of a render keeps a score deterministic.
- **Cella's drive is the noise**, so seeding `white()` is the only reason a cella
  render can repeat at all; its resonator bank was always deterministic given an
  excitation. This is the one tool where the arc changes what the instrument can
  do rather than only how it is specified.
- **Moire took the seam through `PRELUDE`**, not through an env table, because it
  compiles a whole voice into one function and ships the source string to the
  worklet. The generated function now takes a `BANK` argument and closes over its
  own sources.

**Verified**: `node scripts/check_signals.mjs` — 21 checks per tool plus the
cross-tool identity, all passing; it evaluates each worklet as a template literal
before parsing, so a pass means the shipping worklet passed, which is the lesson
from Spolium's silent `wcompile` bug. In Edge against the root server, for each
tool: two renders of one three-note score at seed 1 differ by exactly 0, a render
at a different seed differs audibly (0.25–1.96 peak depending on the tool), and
same-pitch notes inside one render differ from each other. Regression against the
pre-change build `c0f1eec` on the default patch with drift at 0: aliquoto and
moire reproduce peak, RMS and sample values identically to nine decimals. Cella
cannot match by construction, so it was checked distributionally — eight seeds
give RMS 0.210–0.324 against the old build's 0.253/0.267/0.278, so the drive's
statistics are unchanged and only its repeatability is new.

**Left undone.** The seed is not saved with a patch, because none of the three
saves patches; a patch format has to carry it. `rnd()` inside an audio-rate
expression consumes the voice stream per sample, so two patches that differ only
in how often they call `rnd()` diverge — deterministic, but order-dependent, and
worth knowing before 1.2 adds more callers. Nothing was done about the drift
`spread`/`lfo` grammar surface: the seed reaches them, but they are still slider
values rather than expressions.

**2026-09-06 — Claude Code.** Built **suite arc 1.2** — the dropped sound as a
value source — in all three tools. The arc-order entry above says what shipped;
this says how it was checked and what it cost.

**Arc 1.1 paid for itself here.** Because expression scope now comes from the
voice's bank rather than from a table fixed at page load, a dropped file needed
**no parser change at all** — it registers into the same bank beside `rnd` and
`noise`, and every column of every grammar could read it immediately. What did
change is that `compileExpr` and `wcompile` take their key list from the bank, so
a name can arrive after the page does. An empty slot reads 0, so a patch written
against a file still parses once the file is cleared.

**Verified by known answer wherever one existed**, which for this arc is
unusually often:

- A pure 440 Hz sine analyses to 1.000 at 440, 0.17 and 0.11 at the neighbouring
  semitones, 0.0002 an octave below and 0.0001 above.
- Driving `gain : file1(hz,t)` from that file and playing 110, 220 and 440 puts
  the output peak at **441.4 Hz every time** — a different partial survives in
  each case. Playing 330, where no harmonic lands in the band, drops output by a
  factor of 600. That is the ratio-defined vocoder, measured rather than argued.
- In moire, `y : op(1, 4*wave1(t))` against a 100 Hz sine file on a 1000 Hz
  carrier gives sidebands at 1000 ± k·100 whose amplitudes follow **Bessel
  functions of the index**: normalised to the carrier, 1.00 / 0.18 / 1.05 / 1.26 /
  0.82 / 0.37 for k = 0..5 against |Jₖ(4)| of 1.00 / 0.17 / 0.92 / 1.08 / 0.71 /
  0.33. The first sideband sits in J₁(4)'s near-null and is the weakest of the
  set; the third pair is louder than the carrier. Both are required by theory.

**One copy per context, not per note.** An analysis record is about 40 KB per
second of sound and a voice is built per note, so the first implementation copied
117 KB at every note-on for a 4 s file and would have copied about 7 MB for a file
at the 180 s cap. It now crosses once per audio context per version of the file;
a voice carries only the names — 11 bytes — and resolves against the worklet's
module-scope `FILEBANK` when an expression actually calls one. **Resolving at call
time rather than at construction** is what makes the order the node and the
payload arrive in irrelevant, which is the part that would otherwise be a race.
Note-on cost fell from 0.295 ms to 0.037 ms, at the noise floor of the 0.051 ms
measured with no file at all. Spolium was checked first and does *not* solve this
— its module-level cache is a fallback and it still ships the buffer per voice.

**The cost that is worth knowing, and is not this arc's fault.** A vocoder patch
is expensive live, and measuring showed why: a *constant* gain expression costs
the same as the vocoder (8960 ms against 7788 ms for a 4 s render), and the
pre-1.1 build costs 9867 ms for that same constant. **Per-sample dispatch of
compiled gain expressions is a pre-existing cost that neither arc introduced**,
and the file lookup on top of it is free. Headroom for a vocoder patch, as ratios
of a 4 s render: 1 voice × 12 partials 0.24, 4 × 8 0.65, 4 × 12 1.11, 6 × 24 4.71.
So a modest patch plays live and a large one does not. The fix would be
control-rate gain evaluation with interpolation, which is a **change to the
instrument, not a tidy-up** — it would turn audio-rate `rnd()` in a gain line from
white noise into stepped noise — so it is recorded rather than done. Note that the
VST port removes this cost by construction, since the C++ DSP has no JS dispatch.

**New: `scripts/sync_signals.mjs`.** `../DEPENDENCIES.md` said "re-copy by hand";
this copies the marked regions from aliquoto instead — the signal block into every
copy including the ones inside worklet template literals, the analysis block only
where one already exists — and `--check` reports drift without writing. It caught
its own commit's drift, which is the argument for it.

**Left undone.** One file slot, `file1`/`wave1`; the per-partial "each partial
binds a different file" idea from `aliquoto/aliquoto.md` is not built, though the
sources map takes more names without change. The waveform is kept only to 30 s
where the analysis reaches 180 s. Nothing saves patches, so nothing yet carries a
file reference — which is exactly the pre-port decision named in the VST section.
Analysis is a fixed 2048/512 STFT; a file whose interesting motion is faster than
about 12 ms is smeared.
