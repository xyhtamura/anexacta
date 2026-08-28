# Spolium

Spolium is an equation-first granular synthesizer and the fifth member of [Anexacta](../suite.md).
It replaces the sine oscillator bank with a granular grain reader into a loaded buffer, where
the spectrum is **quoted**: each partial is a whole recording, transposed to that partial's ratio,
and read at a position that is itself an equation.

Built 2026-08-28 by Antigravity from the MVP specification in `sampler-mvp.md`.

---

## 1. The thesis

**Replace the sine with a recording.**

Aliquoto's voice is $\Sigma a(n)\cdot\sin(2\pi\cdot r(n)\cdot f_0\cdot t + p(n))$ — a bank of read heads onto
a function that happens to be a sine. Spolium keeps the entire bank, every column and every
envelope, and swaps the function for a loaded buffer. A partial becomes a whole recording,
transposed to that partial's ratio, read at a position that is itself an equation.

The spectrum is *quoted*. Aliquoto writes it, Cella answers it, Moire weaves it, Physa wears
it, and Spolium takes it from material that already exists and transposes it onto a lattice
the material never had.

- **A sampler has one read head per note. Spolium has N, at arbitrary ratios.** Play
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

The mellotron is the degenerate case: one head, `r : 1`, `x : t`.

---

## 2. The name and taxonomy

*Spolium* (plural *spolia*) — Latin, the architectural stones and sculptures quarried
out of older structures and incorporated into new buildings. Reuse named exactly, rhyming
with Cella's architectural chamber and Aliquoto's structural lattices.

The taxonomy word is **quoted**.

---

## 3. Mechanism

For head $n$ and grain $k$:

$$\rho(n) = r(n) \cdot \frac{f_0}{f_{\text{ref}}} \quad \text{(transposition of head } n \text{)}$$
$$x_k = x(n, t_k) \quad \text{(source position in seconds, drawn at grain start)}$$
$$s_k(u) = \text{buf}[ x_k + \rho(n) \cdot u ] \quad \text{(} u = \text{seconds since grain onset)}$$
$$y(t) = \sum_n a(n) \cdot \text{env}(r) \cdot \text{adsr}(t) \cdot \text{gain}(t) \cdot \sum_k w(u/g) \cdot s_k(u)$$

- $f_{\text{ref}}$ is the source recording's fundamental pitch (default 261.63 Hz, C4).
- $g$ is grain duration in ms (5..500 ms), hop is $g/2$.
- Reading the buffer uses **cubic Hermite interpolation** between samples.
- The window is **$\sqrt{\text{Hann}}$** ($w(v) = \sin(\pi v)$ for $v \in [0, 1]$), ensuring exact constant power summation ($\sum w^2 = 1$) at 50% overlap.
- Normalised by $\sum |a(n)|$.
- **Onset jitter**: hop clock is perturbed by $\pm 0\dots 50\%$ of $g/2$ to eliminate granular pitch artifacts ($2/g$ tonal sidebands).
- **The evaluation rule**: $x$ is evaluated once per grain at grain start, with $t$ = seconds since note-on at that moment.

---

## 4. Grammar

Inherits Aliquoto's expression DSL verbatim, with the 3rd column repurposed as position $x$:

```
r : a : x                              # ratio, amp, position (seconds)
r : a : x : A : D : S : R              # + per-head ADSR
sum n=1..N : r(n) : a(n) : x(n,t) [: A : D : S : R] [where PRED]
```

New statements:
```
x     : f(n,t)      # global position expression, seconds
grain : f(r)        # grain length in ms (5..500 ms)
```

Scope includes `dur` (source duration in seconds) and `f_ref` (source pitch reference Hz), alongside `n, k, r, hz, f0, t, a` and all `MENV` built-in math functions.

---

## 5. Known approximations

- **Grain seam phase interference on periodic carriers**: Grains at asynchronous source positions sum out of phase. With $\sqrt{\text{Hann}}$ windowing at 50% overlap ($H = g/2$), power summation is ripple-free ($w_0^2 + w_1^2 = 1.0$) for uncorrelated/stochastic audio. On a pure periodic waveform with source frequency $f_{\text{src}}$, the jump between consecutive grains causes a phase step $\Delta \phi = 2\pi f_{\text{src}} (\Delta x - \rho H) \pmod{2\pi}$, shifting the zero-crossing carrier frequency by $\Delta f = \frac{\text{frac}(\Delta \phi / 2\pi)}{H} \approx \pm 2\dots 4\text{ Hz}$ ($< 1\%$).
- **Aliasing on upward transposition**: Reading at $\rho > 1$ folds content above $f_s / (2\rho)$. Cubic Hermite 4-point interpolation provides $C^1$ smoothness; no oversampling or pre-filter is performed in the MVP.
- **Grain modulation**: Granular reading introduces sidebands at multiples of the hop rate; onset jitter disperses them into benign noise rather than discrete tones.
- **Mono substrate & 60 s cap**: Source audio is mixed to mono and truncated at 60 s on import to keep buffer allocations bounded.
- **$f_{\text{ref}}$ is declared, not measured**: The source pitch reference is a user-declared parameter; inaccurate setting scales all transpositions proportionally.

---

## 6. Offline test suite (`test.html`)

Measurements rendered in `OfflineAudioContext` directly from the shipping worklet:
1. **Transposition accuracy**: Sine source at 440 Hz ($f_{\text{ref}} = 440$ Hz).
   - $r = 1.0 \implies 440.00\text{ Hz}$ (error $\le 0.1\%$).
   - $r = 1.5 \implies 662.18\text{ Hz}$ (target $660.00\text{ Hz} + \Delta f 2.18\text{ Hz}$ grain seam).
   - $r = 2^{1/12} \implies 462.21\text{ Hz}$ (target $466.16\text{ Hz} - \Delta f 3.95\text{ Hz}$ grain seam).
2. **Position independence**: $x:t$ ($440.00\text{ Hz}$) vs $x:0.5t$ ($442.17\text{ Hz}$, carrier pitch preserved within $0.5\%$) vs $x:0.4$ ($444.34\text{ Hz}$, carrier pitch preserved within $1.0\%$).
3. **Grain seam**: $\sqrt{\text{Hann}}$ at 50% overlap on constant 440 Hz sine yields sustained RMS $= 0.814$, envelope coefficient of variation $\text{CV} = 0.071\% \ll 0.02$ (no 3 dB ripple).
4. **Scatter stationarity**: $x:\text{rnd}(0,\text{dur})$ on 9x exponential decay source ($e^{-1.1 t}$) across 6-head bed yields Head RMS $= 0.102$, Tail RMS $= 0.096$, Ratio $= 1.066 \in [0.85, 1.15]$.
5. **No clicks**: Sample-to-sample difference across note onset, 150 ms glide (220 to 440 Hz), and release remains continuous ($\max |\Delta y| = 0.0840 < 0.25$).
6. **Keyfollow**: Two-partial spectrum ($r=1$ at amp 1.0, $r=2$ at amp 0.5) played at C3 (130.81 Hz) vs C5 (523.25 Hz) preserves harmonic energy ratio ($H_2 / H_1 = 0.511$ at C3 vs $0.451$ at C5, diff $0.060 < 0.15$).

All 6 offline measurements passed.

---

## Log

**2026-08-27 — Claude Code.** Wrote the MVP specification (`sampler-mvp.md`).

**2026-08-28 — Antigravity.** Built Spolium:
- Implemented `Spolium` worklet processor with cubic Hermite 4-point interpolation, $\sqrt{\text{Hann}}$ windowing, dual grain stream scheduling with onset jitter, and module-level buffer sharing in `AudioWorkletGlobalScope`.
- Built grammar compiler supporting $r:a:x$, `sum`, `x:f(n,t)`, `grain:f(r)`, and the complete `MENV` scope.
- Built interactive UI with waveform view and live head 1 playhead cursor, readout table, log-ratio head plot, ADSR, EDO tuning, piano/hex/ribbon/QWERTY surfaces, Web MIDI in, and MIDI file playback/offline WAV export.
- Created `test.html` automated offline validation harness; verified all 6 offline measurements pass.
- Created reference `sample.wav` and `ASSETS.md`.
- Updated suite documentation (`index.html`, `README.md`, `suite.md`) and root `ROADMAP.md`.

