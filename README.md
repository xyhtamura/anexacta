# Anexacta

Anexacta is a collection of equation-first browser synthesizers. Each member
uses the same mathematical-definition language for ratios, envelopes, time,
tuning, and keyfollow, then applies it to a different signal path:

- **Aliquoto** writes spectra as additive partials.
- **Cella** excites ratio-defined resonant modes.
- **Moire** produces spectra through phase-modulation interference.
- **Physa** drives a charge-controlled memristor whose memristance curve is
  written as an equation. It is the collection's first stateful member: the other
  three evaluate their definitions fresh, this one carries history.

Open `index.html` for the collection page or open any member's `index.html`
directly. The repository is build-free and can be served from the shared
workspace root at `http://localhost:8000/anexacta/`.

## Repository structure

```text
anexacta/
  index.html
  suite.md
  aliquoto/
  cella/
  moire/
  physa/
```

The three original Git histories were imported without squashing. New source
work belongs in this repository. The former `aliquoto`, `cella`, and `moire`
repositories remain only to redirect their established GitHub Pages URLs. Physa
was written here and has no prior repository; it moved in on 2026-08-25 from an
untracked sibling folder where it was named `worn`.

`physa/test.html` renders the shipping worklet offline and measures it. Open it at
`http://localhost:8000/anexacta/physa/test.html` and press Run after changing
anything in that instrument's signal path.

Suite-wide direction and shared-engine decisions live in [suite.md](suite.md).
Per-instrument implementation notes remain beside each instrument.
