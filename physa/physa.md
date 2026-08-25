# Physa

A charge-controlled memristor as the sounding element. Single-file browser
instrument, `index.html`, AudioWorklet, no build, no dependencies beyond web
fonts and KaTeX.

Fourth member of [Anexacta](../suite.md), and that suite's first **stateful**
entity: the other three evaluate their definitions fresh, this one carries
history. Built for the ESNMA 2026 argument — see
[loosethreads/active/ESNMA2026-abstract.md](../../loosethreads/active/ESNMA2026-abstract.md).

Formerly `worn`, at `F:\xyh\worn\`, an untracked folder outside any repository.
Renamed and moved in 2026-08-25.

---

## The name

*Physa* is Greek for bellows, and it is the root of *Physarum* — the slime mould
named for its sporangia. The reference is deliberate and it is the opposite of a
citation.

*Physarum polycephalum* was reported as a biological memristor in 2015 (Gale, de
Lacy Costello and Adamatzky), and roughly a decade of computer music was built on
that claim. In 2025 Schmidt, Seyfried, Reutina, Seskir and Miranda characterised
multiple specimens and found no significant memristance: elliptical I–V curves
produced by the organism's own capacitance, which they reproduced with resistors
and capacitors alone (*MRS Advances* 10(14): 1710–1716). Miranda had composed the
music. The paper trail is
[loosethreads/biomemristor-music-and-the-physarum-claim.md](../../loosethreads/biomemristor-music-and-the-physarum-claim.md),
and `suite.md` warns explicitly against citing that lineage as evidence.

So the name spends the organism's root without spending its claim, and the
**Mould** control puts the 2025 measurement on a dial. Anyone reading the name as
an endorsement is corrected by the instrument itself within about ten seconds.

Naming was run against
[principles/xyh-naming-calibration.md](../../principles/xyh-naming-calibration.md).
Rejected: anything from rutile or TiO₂, the actual HP device material, because the
page's central argument is that this is not a device — the name would have
contradicted the mechanism, which is the failure mode that note is built around.

---

## What it is

```
dq_e/dt = μ_e·i_e − q_e/τ        i_e = v·D_e/M(q)        i = (1/N)·Σ i_e + C·dv/dt
M(q)    = (1−w(q))·M₀(q) + w(q)·⟨M₀⟩        dw/dt = σ·|v·i|·(1−w)
```

One ODE per element over a shared substrate, plus a memoryless branch. The
instrument is **M₀(q)**, the memristance curve, written as an equation rather than
chosen from a list. `q` runs −1 to 1, `Math` is in scope.

The argument it embodies: Chua deduced the memristor in 1971 from the symmetry of
*v, i, q, φ* — it existed as a gap in a table before it existed as anything else.
Whether matter can realise the ideal element is disputed (Vongehr & Meng;
Pershin & Di Ventra's charge-only test). Those results constrain hardware.
**This is not a simulation of a device; it is the object in the territory where it
lives.** M(q) can be periodic in charge, discontinuous, anything matter would
refuse.

Three mechanics were added 2026-08-25 on Xyh's ask for biological behaviour,
"the decaying quality found in the RC mold":

- **Mould** — a capacitance in parallel with the element. It carries current and
  holds no state, so it contributes pure quadrature at the fundamental. The loop
  opens into an ellipse that misses the origin, nothing appears above the
  fundamental, and the memory reading climbs anyway. That combination is the 2025
  *Physarum* result, reproducible on the dial.
- **Senescence** — the curve is a state variable. Playing abrades it: where the
  charge dwells, M(q) blends toward its own mean, so the played stretch loses its
  shape and becomes an ordinary resistor. Irreversible within a session, unlike τ.
  Resets on reload; **Fresh substrate** clears it deliberately.
- **Colony** — several elements across one drive over one shared substrate, with
  Tero's tube law: an element carrying more current thickens and carries more
  still, an idle one thins back. Saturating, so the positive feedback is bounded.

Together the first two do something the page did not plan for and is worth
keeping: **playing the instrument wears it toward the thing Physarum actually
was.** Senescence drives the element toward memorylessness and the Mould dial
supplies the capacitance, so the false positive is the instrument's own
end state rather than an external comparison.

## Verified 2026-08-25

All figures measured by rendering the shipping worklet in an `OfflineAudioContext`
and taking a DFT at harmonics of the fundamental. The harness is
[test.html](test.html) beside this file: it **extracts the worklet source out of
`index.html` at run time**, so it cannot drift from what ships, and it asserts
`offset + window <= buffer.length` before believing any zero. Open
`http://localhost:8000/anexacta/physa/test.html` and press Run. All checks pass as
of this entry.

Windows are Hann, 0.4–1.0 s after note-on unless stated. Defaults: μ = 10⁶,
τ = 2 s, HP curve, amplitude 1, AGC off, 48 kHz.

**Keyfollow, with no keyfollow rule written anywhere:**

| Drive | 55 Hz | 110 | 220 | 440 | 880 |
|---|---|---|---|---|---|
| Harmonic % | 29.90 | 4.54 | 0.76 | 0.18 | 0.04 |

About a quarter per octave from 110 up. The state integrates current, so its
excursion goes as charge per cycle and therefore as 1/f. Low notes come out dirty,
high notes pass nearly clean, and nothing in the code says so.

**The 55 Hz figure disagrees with the one recorded 2026-08-24 (16.14%), and the
disagreement is now explained.** At 55 Hz the charge sweeps most of the domain and
the harmonic content becomes hypersensitive to μ:

| μ | 3×10⁵ | 6×10⁵ | 1×10⁶ | 2×10⁶ |
|---|---|---|---|---|
| Harmonic % at 55 Hz | 1.63 | 16.47 | 29.90 | 65.71 |

A factor of 6.7 in μ moves it by a factor of 40. At 110 Hz the same μ range moves
it from 0.29% to 4.54%, far less steeply. The charge does **not** reach the clamp
(measured range −0.686 to 0.937 over a 2 s render), so this is the curvature of
the nonlinearity rather than clipping. The old 16.14% corresponds to μ ≈ 6×10⁵.
Whether the earlier session measured at a different μ or the earlier harness was
wrong is **not resolved** — that harness is the one with a known history of
reading past the end of its buffer. Either way the page no longer quotes 55 Hz as
a property; it quotes it as a setting, and says so.

The 110–880 Hz figures reproduce 2026-08-24 closely (4.27 / 0.77 / 0.19 / 0.04),
so the keyfollow claim itself is unaffected.

**Level dependence** — velocity is a physical timbre axis, not a mapped one:

| Amplitude | 0.25 | 0.5 | 1 | 2 |
|---|---|---|---|---|
| Harmonic % | 0.20 | 0.86 | 4.54 | 18.13 |

**Wear within a held note**, harmonic % at t = 0.1 / 0.6 / 1.5 / 2.2 s:

| τ | | | | |
|---|---|---|---|---|
| 20 ms | 5.39 | 5.39 | 5.39 | 5.39 |
| 500 ms | 4.98 | 4.73 | 4.61 | 4.58 |
| 3 s | 4.87 | 4.34 | 3.77 | 3.50 |
| off | 4.85 | 4.23 | 3.47 | 3.05 |

Reproduces 2026-08-24 within a few tenths of a point. τ is a choice between an
element that wears while you hold it and one that reaches equilibrium at once.

**The mould, and what the analysis panel does with it.** Constant M(q) = 1200 with
1.4 µF in parallel, at 110 Hz:

| | memory | harmonic | pinch |
|---|---|---|---|
| plain resistor | 0.01% | 0.01% | 0.00% |
| memristor (HP curve) | 3.79% | 4.13% | 0.00% |
| resistor + 1.4 µF | **57.42%** | **0.01%** | **75.77%** |

The third row is the Schmidt et al. signature and it is the reason the
**harmonic** readout was added. Memory as hysterion defined it — energy in Fourier
coefficients no memoryless device can produce — counts quadrature at the
fundamental, so a linear capacitance scores very high on it. That is not a defect
in the measure: a capacitor genuinely has state. It is a defect in reading
"memory" as "memristance". Harmonic content above the fundamental is what
separates them, and it is zero for any linear reactance.

The closed form for that row is `a₁/b₁ = ωCM`, giving memory = 57.4%. Measured
57.42%. The capacitive share also rises in exact proportion to pitch (measured
8.00× across three octaves), which is the inverse of how the element behaves —
so the mould takes over at the top of the keyboard exactly where the memristor
stops distorting.

**Senescence.** Half-life 4 s at the default curve and drive gives 50.64% peak
wear after 4 s. Wear is local, not global: a 3 s half-life over a 6 s render on
the periodic curve reaches 96.61% at the busiest bin against 30.11% mean. Harmonic
content falls as it wears (1.13% → 0.78%). Two things hold by construction and are
asserted: with senescence off, nothing wears and the timbre is stable to within
0.01 points; and **wear on a constant curve is bit-for-bit a no-op** (max sample
difference 0.0), because blending a constant toward its own mean changes nothing.

**Colony.** Six elements, spread 0.75 decades, reinforcement 0.7: tube thickness
diverges to [1.68, 1.67, 1.64, 1.56, 1.48, 1.93] and every charge stays inside the
domain. With reinforcement at 0 every tube stays at exactly 1.

**Headroom.** Across five configurations at amplitude 2 — including eight elements
at full reinforcement, and 20 µF of mould — peak output never exceeds 1.0 and the
sustained level settles to the 0.25 AGC target within 0.006. The 1.0 is the soft
limiter's asymptote (`0.9 + 0.1·tanh(...)`) and is a bound, not clipping.

## Bugs found by measuring

Four were found 2026-08-24 and are kept here because each was invisible by
inspection and the page would have *sounded plausible* with three of them still in.
The fifth was found this session.

1. **The memristor was cancelling itself out.** Output was written as `i*M(q)` to
   normalise away the large resistance scale — but `i = v/M(q)`, so `i*M(q)` is
   exactly `v`. The instrument emitted the bare drive sine with the element
   perfectly removed. Fixed by scaling with a *constant* reference resistance.
2. **Port messages are not reliably delivered before the first `process()` call in
   an `OfflineAudioContext`.** Initial state arrives through `processorOptions`,
   which is guaranteed at construction. The realtime path was never affected, so
   this would have looked fine in the browser and failed every offline test.
3. **Default μ was 10⁴, about two orders too low.** Charge swing was 0.007 of the
   domain, so the element sat in a nearly linear patch and produced 0.02%
   harmonics. It ran, it made a tone, and it was doing essentially nothing.
4. **Output was scaled by mean(M), not min(M).** Since output is `v·Rref/M(q)`, a
   mean reference lets the gain reach mean/min — 40× on the HP curve — clipping
   hard at full wear. Now bounded by construction.
5. **The hysteresis loop was captured with a systematic half-slot phase bias**
   *(found 2026-08-25)*. The loop is sampled onto a 256-slot phase grid so it is
   one cycle at any pitch. Several samples fall in one slot and the last one wins,
   which lands systematically near the top of the slot — so assuming each slot sat
   at its nominal phase skewed every reading by about half a slot and reported
   memory where there was none. Caught because the capacitive quadrature scaled by
   7.07× across three octaves where theory demands exactly 8. The worklet now
   stores each sample's own phase alongside it. After the fix: 8.00×, the plain
   resistor's memory reading fell from 0.03% to 0.01%, and the RC case moved from
   59.11% to 57.42% against a closed-form 57.4%.

And one process note carried forward: a **stale cached page** once produced a
false negative that read as a broken AGC. Append a cache-busting query string when
re-testing after an edit; a plain reload of the same URL is not enough.

## Known approximations

- **The senescence half-life is nominal, and the page says so.** The derivation
  assumes a stationary charge. The charge is not stationary — it sweeps a wide
  stretch of the domain, so the deposit reaching any one bin is diluted by roughly
  the ratio of swept width to kernel width. Measured at **42×** for the default
  curve and drive, and that factor is compiled in as `SWEEP_DILUTION`. It is
  accurate where it is calibrated and drifts elsewhere: a wider sweep spreads the
  wear and slows it. A version that deposits per unit `|dq|` rather than per unit
  time (Archard's wear law) would remove most of the dependence and make wear
  scale with cycles rather than seconds — considered and not built, because it
  makes the time label frequency-dependent instead.
- **The decimation filter is approximate.** 8× oversampling with a Hann-weighted
  average over the substeps — a real lowpass, but not a designed half-band FIR.
  The aliasing floor is unmeasured. `suite.md` budgets 4–8× for this element, so
  the oversampling factor is right; the filter is the weak part.
- **`new Function` on the M(q) input.** Fine for a local single-user page, and the
  reason the curve can be an arbitrary expression. Worth noting before this is
  ever hosted anywhere that takes untrusted input. Note that it is now hosted:
  Anexacta is a published Pages repository, so this is a live consideration rather
  than a hypothetical one.

## Left undone

- **Per-partial elements — the colony that matters.** What ships is several
  elements across *one* drive. What `suite.md` asks for is one element per
  *partial*, each wearing at its own rate, so the spectrum dulls unevenly and the
  instrument becomes genuinely additive rather than a monosynth with a network in
  it. That needs additive synthesis, which this page does not have, and it is the
  single largest remaining piece.
- **No aesthetic verdict, and no screenshot.** Xyh has heard it and confirmed the
  level problem is fixed. The reskin of 2026-08-25 has been verified by
  measurement and by reading the DOM, but **not seen** — the browser pane has not
  been displayed in any of the three sessions, so `requestAnimationFrame` never
  runs and the live readouts and `--age` bloom cannot be observed under
  automation. The canvases were confirmed to paint by counting lit pixels with the
  draw functions called directly.
- **Cross-note memory is untested.** Wear *within* a held note is measured; the
  claim that the element arrives at each note already worn by the previous one is
  reasonable from the ODE but was not verified. Needs a scheduled note sequence.
  Senescence makes this more interesting and more worth doing.
- **The 55 Hz provenance question**, above.
- Monophonic. No preset browser beyond the nine built in, no save/recall, no MIDI,
  no envelope beyond a fixed 4 ms attack and 250 ms release.

## Relation to the rest

- **Anexacta.** This is the memristive element of [suite.md](../suite.md), now
  built and now a member rather than a prototype. **Nothing is vendored in either
  direction** — Physa implements the model directly — so there is no
  `DEPENDENCIES.md` contract. If the other three members later take this code
  rather than re-deriving it, that changes.
- **hysterion.** Archived. Its two tests run live here on the note being played,
  and this session added the third that separates them. Neither imports the other.
- **[physics/GAPS.md](../../physics/GAPS.md)** § "Memory versus keyfollow-invariance
  in a memristive audio element" is directly visible here. The τ table is the
  two-timescale tension the gap describes: short τ gives a stable timbre and no
  cross-note memory, long τ gives cross-note memory and a timbre that drifts while
  you hold it. Senescence adds a third timescale on top and does **not** resolve
  the gap — it sidesteps it by making the slow drift permanent and local rather
  than reversible and global.

## Prior art — the earlier sweep was incomplete

`suite.md`'s search of 2026-08-03 concluded that memristive audio-rate synthesis
was unattested, while flagging that negative results are weak evidence. Rechecked
2026-08-24, and there is more than it found:

- Memristor music at note/control level is well established — Gale, Matthews, de
  Lacy Costello & Adamatzky, "Beyond Markov Chains" (arXiv:1302.0785), which is
  transition matrices over a 24-note range with no audio synthesis; and the
  Braund/Miranda body of work.
- Chua's circuit as a chaotic sound source dates to Bilotta & Pantano 1993 and
  Rodet 1994.
- Hardware memristor-emulator modules exist in analog synthesis practice.
- **There is a real engineering literature on memristor harmonic generation**,
  including emulator circuits presented explicitly as wave-shaping and generation
  circuits, and Fourier analyses of memristor harmonic weights. This is the part
  the earlier sweep missed, and it is the closest prior art at the signal level.

Still not found: a software instrument with a memristor model in the audio path
where **M(q) is the authored object**. But **do not build a novelty claim on
this.** The argument is about where the ideal memristor can be said to exist, not
about priority, and it is stronger without a claim that a reviewer could falsify
with one citation.

---

2026-08-24 — Claude Code — Built the MVP as `worn`: charge-controlled memristor in
an AudioWorklet, equation-first M(q) compiled to a 1024-point lookup table, wear
and relaxation controls, 25-key range, live M(q) curve with charge marker, scope.
Verified by offline render and DFT rather than by description. Found and fixed
four defects, one of which had the element cancelling itself out entirely, and one
test-harness error of my own that produced two false zero readings I reported
before catching. Nobody has listened to it yet, and the name is provisional.

2026-08-25 — Claude Code — Fixed the level behaviour Xyh reported: DC blocker,
slow AGC and soft limiter inside the worklet, with an Auto level switch to hear
the raw current. The Chrome/Firefox split was not a browser bug — the output was
simply 0.028 peak, and the volume leaps were the same 80:1 `1/M` swing seen from
the other end. Verified that the keyfollow and level-dependence figures survive
the gain stage, which is why the AGC detector is slow. Lost time to a stale cached
page reporting a false negative.

2026-08-25 — Claude Code — Absorbed the archived hysterion: its two tests now run
live on the note being played, with the I–V loop captured before the gain stage
and sampled on a phase grid so it is one cycle at any pitch.

2026-08-25 — Claude Code — **Renamed to Physa, moved into the Anexacta repository
as its fourth member, reskinned, and given three biological mechanics.** Decisions
were Xyh's: move in rather than cross-link; tarnish and wear crossed with bioart;
a Physarum-derived name; the full member kit; wear resets on reload.

Reskin follows [principles/xyh-design-calibration.md](../../principles/xyh-design-calibration.md)
and the fallbacks note — a bronze plate left somewhere damp with a culture on it.
Oxide interference runs amber → verdigris → violet on its own, which lands the
45/165/285 fallback triad without imposing it; *Physarum*'s own chrome yellow is
reserved for the memoryless branch, the mould dial and the wear it leaves. The
old page was a strict two-column grid of three equal cells, which is the lattice
the calibration note calls the killer; panels are now irregularly radiused organs
at unequal widths with sub-half-degree tilts. Display type is Averia Gruesa Libre
per the fallbacks note, with Space Mono shared with the other three members.

Mechanics added: the mould (parallel capacitance), senescence (the curve as a
state variable), and a colony under Tero's tube law. A third loop measure,
harmonic share above the fundamental, was added because it is the one that
separates a memristor from an RC network — without it the mould's capacitance
reads as 57% memory and the panel cannot tell you it has been fooled.

Wrote [test.html](test.html), which extracts the worklet from `index.html` at run
time so the tests cannot drift from what ships. All checks pass. It caught a real
defect (the loop-capture phase bias, #5 above) and it caught my own senescence
calibration being 42× out. Three of the first run's four failures were wrong
assertions in the test rather than faults in the page, which is worth recording:
the capacitive ratio and the limiter ceiling were both behaving exactly as the
algebra demands and I had written the wrong expectation.

Also resolved the 55 Hz keyfollow discrepancy against 2026-08-24 — see above; the
figure is μ-hypersensitive and the page now presents it as a setting rather than a
property.

**Undone:** per-partial elements, the thing that would make this additive, are
still not built and are now the Next in Dev. Nobody has looked at the reskin; the
browser pane has not been displayable in any session, so there is still no
screenshot and no aesthetic verdict on the new surface.
