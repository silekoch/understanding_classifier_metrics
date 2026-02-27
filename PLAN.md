# The ROC & PR Playground — Master Build Plan

## Vision

The single best interactive resource on the web for deeply understanding classifier
evaluation metrics. A student who spends 30 minutes here should walk away able to
reason about ROC curves, PR curves, thresholds, and deployment trade-offs as
naturally as reading a scatter plot.

Two entry points, both must be world-class:

1. **Playground (default landing)** — immediate, tactile, zero-friction exploration.
   Drag a threshold, watch everything react. Change distributions, see how curves
   morph. No tutorial required to start learning.

2. **Guided Tour (opt-in)** — a carefully scaffolded 10-chapter learning path
   (chapters 0–9) that reveals concepts one at a time, with narrative, scenarios,
   prediction prompts, and exercises. Each chapter unlocks new controls and views.

## Design Philosophy & Visual Identity

**Aesthetic direction: scientific editorial — think *Distill.pub* meets
*Bret Victor*.** Clean, spacious, typographically rich. Every chart hand-tuned
for clarity — no default chart-library chrome. Motion is purposeful:
distributions slide, curves draw themselves, the threshold needle sweeps.
The whole thing should feel like a beautifully typeset interactive textbook,
not a dashboard or homework assignment.

**Typeface pairing:** A distinctive serif for headings and narrative text
(e.g. Newsreader, Lora, or Fraunces) + a monospaced font for numbers, labels,
and code-like output (e.g. JetBrains Mono or IBM Plex Mono). This gives it an
academic-yet-modern feel that differentiates it from every generic "ML tutorial."

**Color system (colorblind-safe, tested with Sim Daltonism):**
- Positive class (TP/FN): saturated teal `#0D9488`
- Negative class (TN/FP): warm amber `#D97706`
- Threshold indicator: vivid red-orange `#EF4444`
- Background: warm off-white `#FAFAF5`
- Text: near-black `#1C1917`
- Subtle grid/axis lines: `#D6D3D1`
- Operating point dot: white fill + dark stroke (high contrast on any curve)

The positive/negative pairing must be distinguishable in all common forms of
color vision deficiency. Teal vs. amber passes deuteranopia and protanopia
simulation. Verify with actual tooling before shipping.

---

## Design Principles

### 1. The Insight Chain

Every design decision serves this chain of understanding:

```
Distributions → Threshold → Confusion Matrix → Rates (TPR/FPR/Precision/Recall)
    → ROC point → ROC curve → AUC
    → PR point → PR curve → AP
    → Prevalence (ROC invariant, PR changes — the key insight)
    → Calibration (do the scores mean what they say?)
    → Costs + Constraints → Optimal threshold → Deployment decision
    → Drift → Why today's threshold may fail tomorrow
    → Uncertainty → How much to trust all of the above
```

Each link must be visually and interactively obvious. If a student can't point to
the visual that explains any link, the design has failed.

### 2. One Mental Model

Every view is a projection of the same underlying objects: **scores, labels,
and a threshold.** The distribution plot shows scores. The confusion matrix
counts what the threshold does to them. The ROC and PR curves show what happens
as you sweep the threshold. The calibration plot shows whether scores mean what
they claim. There is no separate "ROC world" — it's all one world, projected
differently.

### 3. Immediate Tactility

The first 10 seconds must allow meaningful interaction. A visitor drags the
threshold, and distributions, confusion matrix, ROC, and PR all react at 60fps.
No loading screens, no onboarding modals, no "click here to start." The tool
teaches by reacting, not by explaining.

### 4. Truth-Preserving Visuals

Avoid "pretty" animations that hide real discontinuities. If the ROC curve has
a step, show the step. If the PR curve has a discontinuity at recall=0, show it.
Use smooth curves only where the underlying math is smooth (parametric models).
Empirical curves should look empirical — the jaggedness IS the information.

### 5. Explain with Invariants

Anchor understanding on things that DON'T change. ROC is invariant to prevalence.
ROC is invariant to calibration (any monotone score transform). These invariants
are the deepest insights and the hardest to learn. The tool must make them
viscerally obvious by letting students change prevalence/calibration and watch
ROC hold still while PR and the deployment card shift.

### 6. Ground in Reality

The tool must bridge theory and practice. Real classifiers output probabilities
in [0,1], and those probabilities have characteristic shapes depending on the
model family. A student who only sees Gaussian distributions will be unprepared
for `model.predict_proba()`. The tool must expose them to realistic score
distributions from the models they will actually use.

---

## Content & Microcopy System

The difference between a demo and a learning tool is the words. Every
interaction should be accompanied by just enough text to make the insight land.

### Dynamic "What You're Seeing" Captions

A single sentence below each visualization that summarizes what just happened.

**The problem with continuous updates:** during slider dragging, all numeric
views (metric tiles, confusion matrix counts, curve positions) update at 60fps
— numbers are small and scannable even while changing. But a natural-language
sentence that re-renders at 60fps is an unreadable, flickering mess.

**Solution: two-layer feedback.**

1. **Metric tiles and confusion matrix counts** update continuously during
   drag. These are the "real-time" feedback channel — monospace numbers that
   are easy to scan even while they change.
2. **The caption sentence** fades to low opacity the instant dragging begins.
   Once the slider has been still for ~200ms (or on pointer-up), the caption
   fades back in with a **delta-based summary** describing the change:
   - "Moving threshold from 0.67 → 0.52: +23 TP, +89 FP, −89 TN, −23 FN."
   - "The operating point moved up-right: higher sensitivity, but at the
     cost of more false alarms."
   The reference point resets each time a new drag begins.

This ensures: continuous numeric feedback during interaction (from elements
already designed for rapid updates), and a readable, useful text insight on
release — precisely when you have a moment to read it.

Example captions (generated from state, not hand-written):
- Distribution plot: "At this threshold, 423 negatives fall to the right
  (false positives) and 67 positives fall to the left (false negatives)."
- After a drag: "Lowering the threshold from 0.67 to 0.52 caught 23 more
  true positives but added 89 false positives."
- ROC: "AUC = 0.87. Current operating point: TPR 0.84, FPR 0.11."

Captions use scenario-specific vocabulary when a scenario is active (see below).

### Prediction Prompts (Tour Only)

Before key interactions in the guided tour, ask the student to predict:
"Before you drag the threshold left — will precision go up or down?"
The student selects an answer, THEN drags, THEN sees the reveal. Research
shows prediction-before-observation dramatically improves learning retention.

### Hover Definitions

Non-intrusive tooltips on metric names and axis labels. Hover "Precision" →
"Of all cases predicted positive, what fraction are truly positive?"
Never force reading — the tooltips appear only on hover/focus and disappear
on mouseout. Available in both playground and tour modes.

### Scenario-Specific Vocabulary

When a scenario preset is active, replace generic terms with domain terms:
- Medical screening: "positive" → "sick", "negative" → "healthy",
  "false positive" → "unnecessary biopsy", "false negative" → "missed diagnosis"
- Fraud detection: "positive" → "fraudulent", "negative" → "legitimate",
  "false positive" → "blocked legitimate transaction"
- Content moderation: "positive" → "violating", "negative" → "benign",
  "false positive" → "wrongly removed post"

This mapping is data-driven (each scenario preset includes a `vocabulary` object)
so it's trivial to extend.

### Collapsible Math

For users who want formulas, provide collapsible "Show the math" sections:
- AUC derivation from the Wilcoxon-Mann-Whitney statistic
- Iso-cost line slope derivation
- Bayes' rule for calibration posterior
- PR curve transformation under prevalence shift

These are NEVER shown by default. They're there for the student who wants to
go deeper, not for the student who needs to build intuition first.

---

## Critical Architectural Decisions

### 1. Value-First Ordering

The phases in this plan are ordered by **pedagogical impact**, not by
architectural elegance. Phase 0 ships the three highest-leverage features
(confusion matrix, FP/FN region shading, PR curve) in the current single-file
architecture. The Vite migration and module extraction follow in Phase 1.

Rationale: the three Phase 0 features have zero technical dependency on the
architectural migration. They need only `computeOperatingPoint()` (which
exists), histogram bins (which exist), and a PR computation (which is
structurally identical to the existing ROC computation). Building them in
the current architecture means they can ship in days, not weeks.

The tradeoff: Phase 0 adds ~300–400 lines to app.js, which must be
refactored during Phase 1. This is a small cost compared to the benefit
of early user feedback and immediate pedagogical improvement.

### 2. Build System: Vite (Phase 1)

The current zero-tooling IIFE will be migrated to Vite in Phase 1, after
the core features ship. Vite is the right choice:
- Zero-config, ESM-native
- `?worker` imports for bootstrap computation (Phase 5)
- Vitest for unit testing core math
- Dev server with HMR for fast iteration
- Single-file production build for easy deployment

### 3. State Architecture: Reactive pub/sub (Phase 1)

The current flat mutable singleton with `renderAll()` works for Phase 0
but will not support bidirectional cross-view linking (Phase 2). Design
during Phase 1:

```
state.subscribe('threshold', callback)  — views register interest
state.set('threshold', value)           — triggers all subscribers
state.batch(() => { ... })              — group updates, single render
```

All views (ROC, PR, distributions, confusion matrix) subscribe to state changes.
No view ever reads state directly during render — it receives the relevant slice
via its callback. This makes adding new linked views trivial.

Phase 0 features are built with the current `renderAll()` pattern. The
migration to pub/sub in Phase 1 is mechanical: each render function becomes
a subscriber, and `renderAll()` is replaced by `state.set()`.

### 4. Prevalence is a deployment parameter, NOT a data generation parameter

This is the single most important conceptual distinction in the tool.
Architecturally:

- `nPerClass` controls how many samples are generated (evaluation data).
  The ROC curve is computed from these. Changing nPerClass does NOT change
  prevalence in any meaningful way — it's a sample size control.
- `prevalence` (π) is a deployment parameter. It does NOT change the ROC curve.
  It DOES change: the optimal operating point under costs, the deployment card
  counts, and the PR curve. It is introduced in Phase 3.
- The UI must make this crystal clear: "ROC is the same regardless of prevalence.
  That's its superpower — and its limitation."

### 5. Interpolation methods become an optional advanced layer

The current app's focus on triangle/power/hull/Gaussian interpolation comparison
is technically interesting but pedagogically secondary. Starting in Phase 0:
- Interpolation toggles move to an "Advanced: Interpolation Methods" collapsible
- The default ROC view shows only: empirical curve, diagonal baseline, threshold dot
- This declutters the default experience and centers the fundamental concepts

### 6. Two worlds of score distributions: unbounded and [0,1]

The current app generates scores on (-∞, +∞). This is useful for understanding
ROC theory, but real classifiers output probabilities in [0,1]. The tool must
support both worlds:

**Existing "theory" families** (unbounded scores):
- Gaussian, log-normal, Student-t, mixture, zero-inflated, uniform, exponential
- These are the current presets. They remain valuable for exploring how
  distribution shapes affect ROC curve geometry.

**New "realistic model" families** (scores in [0,1], added in Phase 1):

- **Beta(α, β) per class** — the Swiss army knife for [0,1] scores.
  By varying α and β, this single family can model:
  - U-shaped / overconfident (α<1, β<1): DNN, Naive Bayes
  - Bell-shaped / compressed (α>1, β>1): Random Forest
  - Uniform (α=1, β=1): random classifier
  - Skewed toward 0 or 1: well-separated classes
  - Parameters: α₀, β₀ (negative class), α₁, β₁ (positive class)

- **Logit-normal** (sigmoid of Gaussian) — what logistic regression produces.
  - score = sigmoid(μ + σ·z) where z ~ N(0,1)
  - Reuses existing Gaussian sampling infrastructure + sigmoid transform
  - Natural [0,1] support
  - Parameters: μ₀, σ₀, μ₁, σ₁ (of the latent Gaussian before sigmoid)

**Model archetype presets** use these families with parameters tuned to match
the characteristic output shapes of real model families:

| Preset | Family | Neg Parameters | Pos Parameters | Teaches |
|--------|--------|----------------|----------------|---------|
| Logistic Reg. (strong) | logit-normal | μ=−2, σ=1 | μ=2, σ=1 | Well-calibrated, good separation |
| Logistic Reg. (weak) | logit-normal | μ=−0.3, σ=1 | μ=0.3, σ=1 | Calibrated but low AUC |
| Random Forest | beta | α=5, β=2 | α=2, β=5 | Compressed scores, underconfident |
| XGBoost (tuned) | beta | α=0.8, β=3 | α=3, β=0.8 | More spread than RF |
| Deep Net (uncalibrated) | beta | α=0.3, β=5 | α=5, β=0.3 | Sharp U-shape, overconfident |
| Deep Net (temp-scaled) | beta | α=1.5, β=4 | α=4, β=1.5 | Same ranking quality, better calibration |
| Naive Bayes | beta | α=0.1, β=2 | α=2, β=0.1 | Severely overconfident |

When a [0,1] family is active, the distribution plot x-axis locks to [0,1]
and the label changes from "Score" to "Predicted Probability."

### 7. Calibration is tractable with synthetic data

Calibration might seem like a separate problem domain, but with [0,1]
score families this concern dissolves. Since we generate data
from known class-conditional densities f₀(s) and f₁(s), we can compute
the **true posterior** analytically:

```
P(y=1|s) = π·f₁(s) / [π·f₁(s) + (1−π)·f₀(s)]
```

For Beta distributions, f₀ and f₁ are closed-form. For logit-normal,
numerically computable. This means we can show a reliability diagram
(calibration plot) that compares what the score says against what
the true probability is — no approximation, no binning artifacts.

The key insight calibration teaches: **ROC and AUC are calibration-invariant.**
Any monotone transformation of scores preserves the ROC curve. AUC tells you
about ranking quality. Calibration tells you whether "0.8" means "80% likely."
A model can have superb AUC and terrible calibration. Students must see this.

Calibration connects naturally to the prevalence (π) parameter:
the true posterior depends on π, so changing deployment prevalence changes
what "well-calibrated" means. This ties the calibration view directly into
the Decision Lab (Phase 3).

### 8. No external visualization libraries

Stay with hand-rolled SVG. The current rendering code is clean and performant.
Benefits: zero bundle bloat, full control over every pixel, no API churn.
A thin rendering utility layer (`viz/svg.js`) will be extracted from the
current code during Phase 1.

---

## Phase 0: Core Pedagogical Features (Current Architecture)

**Goal**: Ship the three highest-impact features immediately, in the current
single-file architecture. No build system, no refactoring — just add the
features that transform the tool from "ROC interpolation comparison" to
"classifier evaluation playground." All work happens in the existing app.js,
following the existing `renderAll()` pattern.

### 0.1 Confusion matrix visualization

**This is the highest-leverage single addition.**

- Live 2×2 grid below the distribution plot
- Cells color-coded to match distribution regions:
  TP (teal), FP (amber-red), TN (amber-green), FN (teal-muted)
- Cell size proportional to count (area-encoded, not just numbers)
- Shows both raw count AND rate in each cell (e.g., "423 (84.6%)")
- Updates instantly as threshold changes
- Derived rates shown beneath: TPR, FPR, Precision, Recall, Specificity, F1
- Implementation: new `drawConfusionMatrix()` function, added to `renderAll()`.
  Data comes from the existing `computeOperatingPoint()` which already returns
  `{tp, fp, tn, fn, tpr, fpr, precision}`.

**Deferred to Phase 2**: click-to-highlight linking (clicking a matrix cell
highlights the corresponding distribution region). This bidirectional
interaction benefits from reactive state. The display-only matrix is already
enormously valuable.

Why first: the confusion matrix is the conceptual bridge between "threshold on
distributions" and "point on ROC curve." Without it, students see two disconnected
visualizations. With it, the causal chain is complete:
**threshold → regions on distributions → counts in matrix → rates → point on curves**

### 0.2 Distribution plot enhancements: FP/FN/TP/TN region shading

**Make the trade-off literally visible.**

- Shade the area right of threshold under negative distribution as FP
  (amber, semi-transparent)
- Shade the area left of threshold under positive distribution as FN
  (teal-muted, semi-transparent)
- TP and TN regions also subtly shaded with their respective colors
- These regions directly correspond to confusion matrix cells — same colors
- When threshold moves, regions update instantly

Implementation: extend the existing `drawDist()` function. For each histogram
bin, determine which side of the threshold it falls on and apply the
appropriate fill color. This adds ~40–60 lines to the function.

As you lower the threshold, the FP region grows and the FN region shrinks.
This is the single most important visual for building threshold intuition.

### 0.3 PR curve view

- New `computePrPoints()` function: walk sorted data (same structure as
  `computeRocPoints()`), tracking precision and recall at each threshold
- New `drawPr()` function: renders the PR curve in a new SVG panel
- Show current operating point on PR curve (linked to same threshold)
- Show random baseline (horizontal line at P/(P+N) — with equal class
  sizes this is 0.5; becomes dynamic when prevalence is added in Phase 3)
- Compute Average Precision (AP) via trapezoidal approximation
- Show AP in the metrics panel alongside AUC
- Layout: PR curve below ROC, or side by side if viewport permits

The PR curve uses the same threshold and data as ROC. Moving the threshold
slider updates both curves simultaneously via the existing `renderAll()`.

### 0.4 Draggable threshold handle on distribution plot

- The threshold is a vertical line with a **circular grab handle** on the
  distribution plot. The user grabs and drags it horizontally.
- Current threshold value displayed next to the handle
- Pointer cursor changes on hover to indicate draggability
- On drag: update `state.threshold`, update the slider, call `renderAll()`
- Keyboard accessible: left/right arrows move in small steps,
  Shift+arrows for large steps
- `touch-action: none` on the SVG area prevents scroll conflicts on mobile
- Replaces the separate slider as the primary threshold interaction
  (slider remains as a fallback/alternative)

This is a natural extension of the existing ROC-click-to-snap-threshold
interaction (`app.js:1199`), applied to the distribution plot.

### 0.5 UI adjustments

- De-emphasize interpolation: move interpolation checkboxes into the existing
  "Advanced Distribution Parameters" collapsible section (or a new
  "Advanced: Interpolation" collapsible). Default: all unchecked except
  empirical ROC.
- Default ROC view shows only: empirical curve, diagonal baseline,
  threshold operating point. Clean and focused.
- Update hero text: "Classifier Evaluation Playground" (or similar)
- Add the confusion matrix and PR curve panels to the layout

### 0.6 URL state encoding

- Serialize all controls to URL search params on every state change (debounced)
- On load, parse URL params and restore state
- This enables sharing from day one: professors assign scenarios, students
  share discoveries
- Lightweight: just `URLSearchParams` get/set, no library needed

### Definition of Done
- Confusion matrix displays TP/FP/TN/FN counts and rates, updates in real-time
- Distribution plot shows color-coded FP/FN/TP/TN regions matching matrix cells
- PR curve visible alongside ROC with shared threshold
- Threshold draggable directly on the distribution plot at 60fps
- Interpolation methods de-emphasized (collapsible, off by default)
- URL sharing works (copy URL → paste → same state)
- All existing presets and features continue to work
- A first-time visitor can understand the threshold/confusion-matrix/ROC/PR
  relationship within 60 seconds of playing, without reading any text

---

## Phase 1: Foundation & Architecture Migration

**Goal**: Migrate to solid architecture for future development. Same visual
output as Phase 0, but modular, testable, and extensible. Also add the
[0,1] distribution families needed for the calibration story.

### 1.1 Vite project setup
- `npm init`, add `vite` and `vitest` as dev dependencies
- Move `index.html` to project root (Vite convention)
- Convert IIFE in `app.js` to ES modules
- Directory structure:
  ```
  src/
    core/
      state.js          — reactive state with pub/sub
      data.js           — RNG, sampling, data generation (all families)
      metrics.js        — ROC computation, AUC, confusion matrix, PR, calibration
      distributions.js  — preset definitions (theory + model archetypes)
    viz/
      svg.js            — SVG element helpers (createEl, clear, drawAxes, addPath)
      roc.js            — ROC curve renderer
      pr.js             — PR curve renderer
      dist.js           — score distribution renderer
      matrix.js         — confusion matrix renderer
      calibration.js    — reliability diagram renderer (Phase 3)
    ui/
      controls.js       — input binding and sync
      tour.js           — guided tour engine (Phase 4)
    main.js             — entry point, wires everything together
  ```

### 1.2 Module extraction
- Move to `core/metrics.js`: `computeRocPoints`, `computePrPoints`,
  `computeAucTrapezoid`, `computeAucRank`, `computeOperatingPoint`
- Move to `core/data.js`: `mulberry32`, `sampleNormal`, `sampleScoreByPreset`,
  `generateData`, `meanSd`
- Move to `core/distributions.js`: `PRESETS`, `erf`, `normalCdf`
- Move to `viz/svg.js`: `createSvgEl`, `clear`, `drawAxes`, `linePathFromRoc`,
  `addPath`, `drawLegend`, `histogram`
- Move to `viz/roc.js`: `drawRoc`
- Move to `viz/pr.js`: `drawPr`
- Move to `viz/dist.js`: `drawDist` (with FP/FN region shading)
- Move to `viz/matrix.js`: `drawConfusionMatrix`

### 1.3 Reactive state
- Implement `createState(defaults)` returning `{ get, set, batch, subscribe }`
- Subscriptions are by key or `'*'` for any change
- `batch()` defers notifications until the batch function completes
- Port all current state reads/writes to use this
- Replace `renderAll()` with targeted subscriptions: each view subscribes
  to the state keys it depends on

### 1.4 New distribution families and model archetype presets

- **Beta sampler** in `core/data.js`:
  - `sampleBeta(rng, alpha, beta)` using Jöhnk's or rejection method
  - 4 parameters exposed: α₀, β₀ (negative class), α₁, β₁ (positive class)
  - Beta PDF `betaPdf(x, alpha, beta)` in `core/distributions.js` (needed
    later for calibration plot true posterior computation)

- **Logit-normal sampler** in `core/data.js`:
  - `sampleLogitNormal(rng, mu, sigma)` = `sigmoid(sampleNormal(rng, mu, sigma))`
  - Trivial to implement — one line wrapping existing Gaussian sampler
  - Logit-normal PDF for calibration: transform the normal PDF through
    the change-of-variables formula

- **Model archetype presets** in `core/distributions.js`:
  - Add all 7 archetype presets (see Architectural Decision 6)
  - Each preset specifies: `family: 'beta'|'logit_normal'`, per-class
    parameters, description, and `bounded: true` flag
  - The `bounded` flag tells the distribution renderer to lock x-axis to [0,1]

- **Preset categories** in `core/distributions.js`:
  - Presets organized into two groups:
    - "Distribution Shapes" (existing: Gaussian overlap, log-normal, etc.)
    - "Model Archetypes" (new: Logistic Regression, Random Forest, etc.)
  - Preset selector in UI shows both groups with optgroup labels

### 1.5 Tests
- Vitest unit tests for:
  - `computeAucTrapezoid` === `computeAucRank` for all presets (within 1e-10)
  - `computeRocPoints` returns monotonically non-decreasing TPR and FPR
  - `computeOperatingPoint` confusion matrix sums to total sample count
  - `computeRocPoints` starts at (0,0) and ends at (1,1)
  - `computePrPoints` returns valid precision/recall values
  - Each preset generates valid data (no NaN, finite values)
  - **Beta sampler**: output in [0,1] for all parameter combinations,
    mean ≈ α/(α+β) within sampling tolerance
  - **Logit-normal sampler**: output in (0,1), monotone in μ
  - **All model archetype presets**: valid data, correct bounds,
    AUC trap === AUC rank
  - **betaPdf**: matches known values, integrates to ≈1 numerically
- Run with `npx vitest`

### Definition of Done
- `npm run dev` serves the app with identical behavior to Phase 0 output
- All existing presets work as before
- New model archetype presets produce valid [0,1] data and correct ROC/AUC
- Distribution plot correctly locks x-axis to [0,1] for bounded families
- Preset selector shows two optgroups: "Distribution Shapes" and "Model Archetypes"
- `npm test` passes all math tests (including new sampler tests)
- Code is modular with clean imports
- Reactive state drives all view updates

---

## Phase 2: Playground Enhancements

**Goal**: Cross-view linking, metrics dashboard, and the interaction patterns
that make the tool feel like a single coherent instrument, not a collection
of separate charts.

### 2.1 Bidirectional cross-view linking

All views are projections of the same data. The linking must be bidirectional:

**Threshold linking (all views share one threshold):**
- Dragging threshold handle on distribution plot → all views update
- Clicking on ROC plot → threshold snaps to nearest operating point
  (already implemented — extend to PR plot)
- Clicking on PR plot → threshold snaps to nearest operating point
- Slider still works as fallback
- All views update synchronously at 60fps via state subscriptions

**Hover highlighting (any view highlights in all others):**
- Hover a confusion matrix cell → corresponding region in distribution
  plot glows + corresponding point/area on ROC/PR curves highlights
- Hover on ROC curve → threshold line moves to match that operating point,
  all other views update to show that threshold's state
- Hover on PR curve → same bidirectional update
- This cross-linking is the mechanism that makes the "one mental model"
  principle tangible. It's the single most important interaction pattern.

**Click-to-highlight on confusion matrix** (deferred from Phase 0):
- Click any cell → highlights the corresponding region in the distribution
  plot (the FP cell glows → the FP-shaded region in distributions pulses).
  This bidirectional link is a key aha-moment enabler.

### 2.2 Metrics dashboard

- Row of metric tiles: Accuracy, Precision, Recall, F1, Specificity,
  Balanced Accuracy, MCC — each with a number + small spark-bar
- All animate in sync with threshold changes
- Hover any metric name → tooltip with plain-English definition
  (e.g., Specificity: "Of all truly negative cases, what fraction did
  the model correctly identify?")
- **"Metrics vs. Threshold" mini chart**: small line chart showing how each
  metric varies across the full threshold range, with the current threshold
  marked as a vertical line. This reveals that metrics peak at different
  thresholds — there is no single "best" threshold for all metrics.
  Toggle on/off to reduce visual clutter.

### 2.3 Pairwise AUC animation
**The best feature for building probabilistic intuition about AUC,
and it requires minimal code.**

- Small panel or overlay on the ROC view
- "Animate" button: randomly draws one positive and one negative sample
- Shows both scores, highlights which is higher
- Running tally: "X of Y pairs concordant → estimated AUC = X/Y"
- After ~50-100 pairs, the estimate converges to the empirical AUC
- Student viscerally understands: AUC = P(score+ > score-)
- Optional: show the two points on the distribution plot as they're sampled

### 2.4 View focus bar (panel visibility control)

A compact toggle bar at the top of the visualization area. Each panel gets
a small pill/chip: `[Distributions] [Matrix] [ROC] [PR] [Metrics]`.
All on by default. Click a pill to toggle that panel off/on. Hidden panels
collapse smoothly and the remaining panels **reflow to fill the space** —
two visible panels each get 50% width instead of four at 25%.

**Named presets** for common focus combinations (one-click shortcuts):
- **All** — every panel visible (default)
- **Distributions + ROC** — the classic "how do distributions shape the ROC?"
- **Distributions + PR** — PR-focused exploration
- **ROC + PR** — side-by-side curve comparison
- **Distributions + Matrix** — threshold → confusion matrix relationship

Later phases add more panels (Calibration, Deployment Card) — they get
their own pills automatically. The bar grows but remains a single row.

**Keyboard shortcuts** (optional, for power users): number keys 1–5 (later
1–7) toggle individual panels. `0` restores all. Shown in a small tooltip
on hover over the bar.

**Architectural note**: this is the exact same mechanism the guided tour
uses for progressive disclosure. The tour engine sets panel visibility per
chapter; the view bar lets the user do the same thing manually in the
playground. Both write to the same `state.visiblePanels` set. When the
tour is active, the view bar is hidden (the tour controls visibility).
When the user exits the tour, their previous panel selection is restored.

### 2.5 UI redesign and dynamic microcopy

- New hero text: "Classifier Playground — Explore how score distributions
  create ROC and PR curves"
- Layout: controls left, plots right (keep current grid), but plots now show
  ROC + PR side by side on top, distributions + confusion matrix below
- View focus bar above the visualization grid
- Dynamic "What you're seeing" caption below each plot (see Content &
  Microcopy System section)
- Smooth size transitions on confusion matrix cells

### Definition of Done
- Hover any view → cross-highlights in all other views
- Click confusion matrix cell → distribution region highlights
- Metrics dashboard shows all rates with hover definitions
- Metrics-vs-threshold chart shows different metrics peak at different thresholds
- Pairwise AUC animation runs and converges to correct value
- View focus bar: toggling panels off/on works, remaining panels reflow;
  preset buttons switch to common combinations in one click
- Dynamic captions update with each interaction

---

## Phase 3: Decision Lab

**Goal**: Students learn that the "right" threshold depends on context,
not just on the curve shape. ROC goes from abstract to actionable.

### 3.1 Deployment parameters panel
New control section: "Deployment Context"

- **Prevalence (π)** slider: 0.01 to 0.99, default 0.5
  - Label: "What fraction of real cases are positive?"
  - Does NOT regenerate data or change ROC curve
  - DOES update: PR curve, deployment card, optimal operating point
  - When user changes π: ROC stays identical, PR curve morphs → aha moment
  - Contextual annotation: "Notice the ROC curve didn't change.
    ROC is prevalence-invariant — that's its power and its limitation."

- **Cost of false positive (C_FP)** slider: 0.1 to 100, default 1
- **Cost of false negative (C_FN)** slider: 0.1 to 100, default 1
  - Labels: "How bad is a false alarm?" / "How bad is a missed detection?"

- **Capacity constraint** (optional): "We can review at most N cases per day"
  - When set, highlights the **feasible threshold region** on all plots
    (the range of thresholds that produce ≤ N predicted positives)
  - Grayed-out region for infeasible thresholds
  - Teaches: sometimes the "optimal" threshold produces more positives than
    you can actually handle. Capacity is a real constraint.

- **Minimum precision / minimum recall** (optional toggle):
  - "Require precision >= X" or "Require recall >= X"
  - Constrains the feasible threshold region further
  - Deployment card shows: "Best threshold meeting all constraints"
  - Teaches: real deployment has hard floors, not just cost trade-offs

- **Label noise** slider: 0% to 20%, default 0%
  - Randomly flips this fraction of labels before computing everything
  - Shows how noisy labels degrade ROC curves and make metrics unreliable
  - Teaches: real datasets have imperfect labels. The ROC curve you see
    is built on labels you assume are correct — but what if they're not?

### 3.2 Iso-cost lines on ROC
**Show the lines BEFORE the optimal point** (discovery, not magic)

- Draw a family of iso-expected-cost lines on ROC space
- Slope = (1−π)/π × C_FP/C_FN
- As user changes π or costs, lines rotate → students see the geometry
- The tangent point where iso-cost line touches the ROC curve = optimal threshold
- Mark the optimal point with a distinct marker (star or diamond)
- Annotation: "Each line represents equal expected cost. The best threshold
  is where the curve touches the lowest-cost line."

### 3.3 Deployment card
**Make this the centerpiece of the Decision Lab.**

A prominent card/panel showing:
```
┌──────────────────────────────────────────────────┐
│  DEPLOYMENT RECOMMENDATION                        │
│                                                   │
│  Optimal threshold: 0.67                          │
│  Expected per 10,000 cases:                       │
│    True Positives:  4,200    Missed:      800     │
│    True Negatives:  4,500    False alarms: 500    │
│                                                   │
│  Precision: 0.89    Recall: 0.84                  │
│  Expected cost per case: $0.34                    │
│                                                   │
│  Constraints met: ✓ capacity (≤500 reviews/day)   │
│                   ✓ min precision (≥0.80)          │
│                                                   │
│  Calibration: Moderate (ECE = 0.08)               │
│                                                   │
│  ⚠ Sensitivity: changing prevalence from 50%→5%  │
│    would shift optimal threshold to 0.91          │
└──────────────────────────────────────────────────┘
```
- Updates live as any parameter changes
- Uses the prevalence π for population-level projections
- Shows constraint satisfaction status when constraints are active
- Shows what happens if prevalence were different (sensitivity analysis)
- When a [0,1] family is active, includes calibration quality indicator
  based on ECE
- Uses scenario-specific vocabulary when a scenario is active
  (e.g., "Missed diagnoses: 800" instead of "Missed: 800")

### 3.4 Calibration plot (reliability diagram)
**Only shown when a [0,1] score family is active** (beta or logit-normal).
When an unbounded distribution is active, this panel shows a note:
"Calibration applies when scores represent probabilities. Switch to a
Model Archetype preset to explore calibration."

- New linked view in `viz/calibration.js`
- X-axis: predicted probability (score value, binned into ~10-20 bins)
- Y-axis: true probability (Bayes posterior from known densities)
- Diagonal reference line = perfect calibration
- Compute true posterior: `P(y=1|s) = π·f₁(s) / [π·f₁(s) + (1−π)·f₀(s)]`
  - For beta family: f₀ = betaPdf(s, α₀, β₀), f₁ = betaPdf(s, α₁, β₁)
  - For logit-normal: compute numerically via change-of-variables
- The prevalence π slider from 3.1 feeds directly into this computation
- Show both:
  - "Empirical" calibration (binned: for each bin, fraction actually positive)
  - "Theoretical" calibration curve (smooth: the true posterior)
- Color-code regions: above diagonal = underconfident, below = overconfident
- Summary statistic: Expected Calibration Error (ECE) shown in metrics

**Key interaction**: student loads "Deep Net (uncalibrated)" → calibration plot
shows severe S-curve deviation. Switches to "Deep Net (temp-scaled)" → same
AUC, but calibration much closer to diagonal. This is the aha moment:
*ranking quality and calibration quality are independent properties.*

**Key interaction with prevalence**: student changes π → calibration curve
shifts because the true posterior depends on prevalence. This teaches:
*a model calibrated for one population isn't calibrated for another.*

### 3.5 Real-world scenario presets
Four named scenarios that set distributions, model archetype, deployment context,
AND vocabulary — grounding abstract curves in real decisions:

1. **Medical screening** (logistic regression model)
   - Distribution: "Logistic Reg. (strong)" preset
   - Context: π=0.02, C_FN=50, C_FP=1
   - Vocabulary: positive→"sick", negative→"healthy",
     FP→"unnecessary biopsy", FN→"missed diagnosis"
   - "You're screening for a rare disease with a well-calibrated model.
     Missing a case is catastrophic. False alarms just mean more tests."
   - Shows: good calibration, but extreme prevalence shifts optimal threshold far

2. **Fraud detection** (gradient boosted model)
   - Distribution: "XGBoost (tuned)" preset
   - Context: π=0.01, C_FN=100, C_FP=2, capacity=200 reviews/day
   - Vocabulary: positive→"fraudulent", negative→"legitimate",
     FP→"blocked legitimate transaction", FN→"missed fraud"
   - "1% of transactions are fraudulent. Your team can review 200 flagged
     transactions per day. Your XGBoost model is somewhat overconfident."
   - Shows: capacity constraint biting, moderate calibration, very low prevalence

3. **Content moderation** (deep neural network)
   - Distribution: "Deep Net (uncalibrated)" preset
   - Context: π=0.05, C_FN=1, C_FP=10, min_precision=0.90
   - Vocabulary: positive→"violating", negative→"benign",
     FP→"wrongly removed post", FN→"missed violation"
   - "Your DNN flags toxic content. It's confident but poorly calibrated.
     Wrongly removing legitimate speech is much worse than missing some toxicity.
     Company policy requires ≥90% precision."
   - Shows: high AUC but terrible calibration, precision floor constraint

4. **Manufacturing QC** (random forest model)
   - Distribution: "Random Forest" preset
   - Context: π=0.05, C_FN=50, C_FP=1
   - Vocabulary: positive→"defective", negative→"good part",
     FP→"unnecessary re-inspection", FN→"shipped defective part"
   - "5% of parts are defective. Shipping a defective part costs 50x the
     inspection cost. Your random forest's scores are compressed — what
     does that mean for threshold sensitivity?"
   - Shows: compressed RF scores, small threshold changes → big outcome swings

These demonstrate four things simultaneously:
- How costs and constraints lead to different optimal thresholds
- How different model families produce characteristically different score shapes
- How calibration quality affects what you can trust about the scores
- How domain vocabulary makes abstract metrics concrete and actionable

### Definition of Done
- Changing prevalence visibly morphs PR curve while ROC stays fixed
- Iso-cost lines rotate as costs change, optimal point tracks tangent
- Deployment card shows concrete per-10k counts
- Calibration plot shows diagonal for well-calibrated models, S-curve for
  overconfident models; updates when prevalence changes
- The four scenarios produce visibly different optimal operating points
  and visibly different calibration profiles
- Student can explain why "highest AUC" doesn't mean "best deployment"
- Student can explain what calibration means and why it matters separately
  from AUC

---

## Phase 4: Guided Learning Tour

**Goal**: A 10-chapter progressive walkthrough (chapters 0–9) that takes a
student from "I sort of know what ROC is" to "I can reason about classifier
deployment in my sleep."

### 4.1 Tour engine
- Lightweight tour system in `ui/tour.js`
- State: `currentChapter`, `currentStep`, `completedChapters`, per-chapter
  exercise state
- Each chapter defined as a **declarative config object**: title, narrative text,
  which views/controls are visible, which are locked, exercise definition,
  and prediction prompt (if any)
- Tour controls: "Next" / "Back" / "Exit to Playground"
- Progress indicator: "Chapter 3 of 9" with visual progress bar
- Tour state persisted in localStorage (resume where you left off)
- When tour is active, non-relevant controls are dimmed/hidden
  (progressive disclosure — students can "peek" at locked views but not
  interact with them)
- Entering tour from playground preserves current state;
  exiting tour restores full playground

**Prediction prompts** (key pedagogical mechanism):
- Before key interactions, the tour presents a multiple-choice prediction:
  "Before you drag the threshold left — will precision go up or down?"
- Student selects answer → performs the interaction → sees result
- Brief reveal text: "Precision went DOWN because..." (1 sentence)
- These are defined per-chapter in the config object

### 4.2 Chapter content

**Chapter 0: "The Prediction Game"**
- Visuals: distribution plot only, NO threshold yet. Two groups of colored
  dots on a number line — labeled "positive" and "negative."
- All other panels hidden. No controls except "place threshold."
- Text: "A classifier produces a score for each case. Positive cases tend
  to score higher. Negative cases tend to score lower. But they overlap.
  There is no magic line that separates them perfectly."
- Task: "Click on the number line to place a threshold. Where would you
  draw the line to separate these groups?" → Student places threshold
  for the first time. This is their FIRST interaction with the tool.
- Unlocks: threshold slider for all subsequent chapters.

**Chapter 1: "The Threshold and Four Outcomes"**
- Visuals: distributions + colored FP/FN/TP/TN regions
- Reveal: confusion matrix appears, linked to the regions
- Text: "Every case falls into one of four bins. The ones you got right
  (true positives, true negatives) and the ones you got wrong (false
  positives, false negatives). Watch them change as you move the threshold."
- Prediction prompt: "If you move the threshold to the LEFT, will false
  positives increase or decrease?"
- Task: "Drag the threshold. Watch the colored regions change.
  The amber region is false positives — healthy people you'd treat.
  The muted teal region is false negatives — sick people you'd miss."
- Key insight: you can't reduce one type of error without increasing another.
- Unlocks: confusion matrix view.

**Chapter 2: "Rates, Not Just Counts"**
- Visuals: distributions + confusion matrix + metrics tiles
- Text: "50 false positives sounds bad. But out of 100 people or 100,000?
  We need rates, not just counts. Precision asks: of everyone I flagged,
  how many are really positive? Recall asks: of everyone who IS positive,
  how many did I catch?"
- Hover definitions active for all metric names.
- Prediction prompt: "At this threshold, precision is 0.85. If you move
  the threshold right (more conservative), will precision go up or down?"
- Task: "Can you find a threshold where both precision AND recall are
  above 80%?" (May or may not be possible — that IS the point.)
- Unlocks: metrics dashboard with all rates.

**Chapter 3: "The ROC Curve"**
- Visuals: all previous + ROC curve
- **Dot trail**: as the student drags the threshold, the operating point
  leaves a fading trail of ghosted dots on the ROC plot, showing where
  it has been. The student literally draws the curve themselves. This is
  more powerful than a canned animation — the student is the active agent,
  they naturally pause at interesting points, and they experience the
  curve as something THEY built rather than something they watched.
  (An auto-sweep animation would remove agency, cause every view to
  flicker at once, and replace exploration with passive observation —
  the opposite of the tool's design principles.)
- Text: "Instead of one threshold, what if we looked at ALL thresholds
  at once? That's the ROC curve. Each point is one threshold's (FPR, TPR).
  The curve bows toward the top-left for good classifiers."
- Task: "Drag the threshold slowly from the far right to the far left.
  Watch the dot trace the entire ROC curve. That curve IS the set of all
  possible thresholds — you just drew it yourself."
- Second task: "Try different distribution presets. Which gives the best
  separation? What does the ROC look like when classes completely overlap?"
- Unlocks: ROC curve view + distribution preset controls.

**Chapter 4: "AUC = Concordance Probability"**
- Pairwise animation visible
- Text: "AUC has a beautifully simple interpretation: randomly pick one
  positive and one negative case. AUC is the probability that the positive
  case has a higher score. Not a mysterious integral — a concrete
  probability about pairs of cases."
- Task: Run the pairwise animation. Watch the running estimate converge
  to the empirical AUC.
- Collapsible "Show the math": AUC = Wilcoxon-Mann-Whitney U statistic.
- Key insight: AUC = P(score+ > score-). This is why AUC only depends on
  ranking, not on the actual score values.

**Chapter 5: "When ROC Misleads — The PR Curve"**
- PR curve appears alongside ROC
- Text: "ROC uses FPR on the x-axis. But what if there are 10,000
  negatives and only 100 positives? Even a small FPR produces hundreds
  of false positives. Precision catches this: of those I flagged, how
  many are actually positive?"
- Prediction prompt: "If prevalence drops from 50% to 1%, what will
  happen to the PR curve? And the ROC curve?"
- Task: keep distributions fixed, change prevalence. Watch:
  ROC stays the same. PR curve changes dramatically.
- Key insight: ROC is prevalence-invariant. PR is not.
  When classes are imbalanced, PR reveals problems ROC hides.
- Unlocks: PR curve view + prevalence slider.

**Chapter 6: "What Do the Scores Mean?"**
- Switch preset to "Logistic Reg. (strong)" → scores in [0,1]
- Calibration plot appears
- Text: "So far we've treated scores as abstract numbers. But real models
  output probabilities — or at least, numbers that claim to be. When a
  model says 0.8, does it mean 80% of such cases are truly positive?
  That's the question of calibration."
- Show calibration plot: near-diagonal for logistic regression.
- Task: "Switch to 'Deep Net (uncalibrated).' The AUC is similar — but
  look at the calibration plot. The model says 0.7 but it means
  something very different."
- Key insight: ROC and AUC only measure ranking quality. A model can rank
  perfectly and still be wildly wrong about what its scores mean as
  probabilities. Calibration and discrimination are independent properties.
- Unlocks: calibration plot + model archetype presets.

**Chapter 7: "Choosing Your Operating Point"**
- Decision Lab controls visible (costs, prevalence, constraints)
- Iso-cost lines on ROC
- Deployment card visible
- Text: "There is no universally 'best' threshold. It depends on what
  errors cost, how many predictions you can review, and what minimum
  performance you require."
- Task: Load the medical screening scenario. Read the deployment card.
  Now switch to fraud detection. Notice how the optimal threshold,
  the constraint satisfaction, and the vocabulary all change.
- Prediction prompt: "If you double C_FN (the cost of missing a positive),
  will the optimal threshold move left or right?"
- Key insight: The ROC curve is a menu of trade-offs.
  The right choice depends on the stakes.
- Unlocks: cost sliders, capacity constraint, deployment card.

**Chapter 8: "When the World Shifts"**
- All previous views + emphasis on deployment card sensitivity analysis
- Text: "You chose a threshold based on today's data. But what happens
  tomorrow? Prevalence changes. The population changes. Score distributions
  drift. A threshold optimized for one world can fail in another."
- Task: "Lock your threshold (toggle the 'lock threshold' checkbox).
  Now change prevalence from 10% to 1%. Watch precision collapse while
  recall stays the same. Your threshold didn't change — the world did."
  (Implementation: a simple "lock threshold" toggle that prevents the
  threshold from auto-updating when parameters change.)
- Prediction prompt: "If prevalence drops by 10×, will you need to move
  the threshold UP or DOWN to maintain the same precision?"
- Key insight: monitoring and re-thresholding are not optional.
  Every deployed model needs a plan for drift.
- Unlocks: full playground.

**Chapter 9: "Putting It All Together"**
- Everything unlocked
- Five challenge scenarios (different from the presets):
  1. "An autonomous vehicle classifier. False negatives (missing a pedestrian)
     are catastrophic. Set up the costs and find the threshold."
  2. "You discover your AUC is 0.95 but prevalence is 0.1%.
     What does the deployment card look like? Is precision acceptable?"
  3. "Two models: Model A has AUC 0.92, Model B has AUC 0.88.
     Under what cost assumptions might Model B be the better deployment?"
  4. "Your deep net has AUC 0.94 and your logistic regression has AUC 0.91.
     The deep net's calibration plot is terrible. Which do you deploy for
     a medical triage system where doctors need to trust the probability
     estimate, not just the ranking?"
  5. "Prevalence was 5% when you trained. In deployment it's 0.5%.
     How must your threshold change? What happens to your deployment card?"
- Each challenge has "Predict → Explore → Reveal answer" flow
- Completion state: "You've completed the tour. You now understand
  classifier evaluation better than most practitioners. Go build something."

### 4.3 Content writing process
- Draft all 10 chapters as markdown BEFORE implementing the tour engine
- Each chapter: ~100-150 words of narrative, 1 prediction prompt (where
  applicable), 1 task, 1 key insight sentence
- Chapters are declarative config objects — switching tour content doesn't
  require code changes, only editing the config
- Review for clarity, concision, and pedagogical flow
- Terminology must be consistent (see Content & Microcopy System)
- All prediction prompts must have verifiably correct answers

### Definition of Done
- Tour walks through all 10 chapters (0–9) without bugs
- Each chapter shows only relevant controls (progressive disclosure)
- Prediction prompts work: student predicts → acts → sees reveal
- Dot trail in Chapter 3 lets student draw the ROC curve themselves
- "Lock threshold" works for drift chapter
- A student who completes the tour can explain:
  ROC vs PR, AUC interpretation, prevalence invariance,
  calibration vs discrimination, cost-sensitive threshold selection,
  why monitoring and re-thresholding matter
- Tour can be entered/exited without losing playground state

---

## Phase 5: Polish & Advanced

**Goal**: Robustness, performance, accessibility, and advanced features.

### 5.1 Bootstrap uncertainty (Web Worker)
- Implement stratified bootstrap in `src/workers/bootstrap.js`
- Worker message protocol designed first:
  ```
  Main → Worker: { type: 'bootstrap', data: [...], nBoot: 200 }
  Worker → Main: { type: 'result', rocBands: [...], aucCI: [lo, hi] }
  ```
- Never call bootstrap on main thread — design Worker-first
- Show ROC confidence band (shaded area)
- Show AUC 95% CI in metrics panel
- Optional "stability badge" on deployment card: "Optimal threshold remained
  at 1.3 ± 0.1 across 95% of bootstrap samples"
- Toggle: "Show uncertainty" checkbox (off by default to keep default clean)
- **"Repeat sample" button**: regenerates data with a new seed, showing
  that the curve shape, AUC, and optimal threshold can vary. When uncertainty
  toggle is on, the previous curve remains as a ghost so students can see
  variability across resamples. This prevents the common misconception that
  curves are perfectly smooth truths.

### 5.2 Accessibility
- Keyboard navigation for threshold (arrow keys, fine/coarse step with shift)
- ARIA labels on all SVG elements
- Screen reader text for key metrics
- Colorblind-safe palette (test with Sim Daltonism or similar)
  - Current palette is already somewhat safe; verify and adjust
- Respect `prefers-reduced-motion` for animations

### 5.3 Performance
- Throttle/debounce slider input events to 60fps
- Profile rendering at nPerClass=2000; optimize if >16ms frame time
- Consider requestAnimationFrame for slider-driven updates
- Lazy-load tour content (don't ship chapter text in main bundle)

### 5.4 Responsive layout

Three explicit breakpoints:

- **Desktop (≥1024px)**: 2-column grid — controls left, 2×2 visualization
  grid right (ROC+PR top, distributions+confusion matrix bottom).
  Deployment card and metrics below.
- **Tablet (768–1023px)**: single column, visualizations stack vertically.
  Controls collapse to a top bar with expandable sections.
- **Mobile (≤767px)**: single column, each visualization full-width.
  Threshold still draggable (with `touch-action: none`).
  Tour navigation adapts: chapters swipeable, narrative text above viz.

- Touch-friendly threshold drag on distribution plot
- Tour navigation works on all breakpoints
- Test on iPhone Safari, Android Chrome, iPad Safari

### 5.5 Visual polish
- Smooth transitions when switching presets (interpolate distribution params)
- Hover tooltips on ROC/PR curves showing threshold at cursor position
- Micro-animations: confusion matrix cell count changes ease in/out
- Loading state while data regenerates (for larger sample sizes)

### Definition of Done
- Works on modern browsers including mobile Safari
- Passes WCAG 2.1 AA for color contrast
- Bootstrap CI renders without freezing UI
- Lighthouse performance score > 90

---

## Success Criteria & Measurement

How we know it's working:

### Product Quality Gates

1. **Zero-friction start**: a first-time visitor can drag the threshold
   within 3 seconds of page load and immediately see all views react.
2. **Aha-moment density**: within 5 minutes of exploration, a user should
   have at least 2 "oh, THAT'S why" moments (e.g., "that's why ROC looks
   fine but precision is terrible at low prevalence").
3. **Tour completeness**: a student who finishes all 10 chapters can
   correctly answer: "When would you prefer PR over ROC, and why?",
   "What does calibration tell you that AUC doesn't?", and "How do you
   choose a threshold for deployment?"
4. **Visual excellence**: screenshots of the tool look like they belong in
   a *Distill.pub* article, not a homework assignment.
5. **Responsiveness**: all interactions work on a 375px-wide screen.

### Measurable Signals (lightweight, no analytics SDK)

- **Time to first meaningful interaction** — target: < 5 seconds
- **Tour chapter completion rate** — track via localStorage, surface in
  a dev-only console log
- **Prediction prompt accuracy** — does accuracy improve from Chapter 1
  to Chapter 9? (Track per-chapter in localStorage)
- **Tour drop-off points** — which chapters lose people? (localStorage)
- **"Repeat sample" usage** — are students engaging with uncertainty?

These signals are collected client-side only (localStorage). No backend,
no cookies, no tracking. A future admin dashboard could surface them, but
the MVP just logs to console for developer insight.

---

## What This Plan Deliberately Excludes (and Future Phases)

### Excluded from Phases 0–5

1. **Post-hoc calibration methods** (Platt scaling, isotonic regression,
   temperature scaling as a learnable transform) — the tool shows what
   calibration IS and what miscalibration looks like via preset model
   archetypes. Teaching how to FIX calibration is a separate tutorial.
   The "Deep Net (temp-scaled)" preset demonstrates the effect of
   temperature scaling without requiring the student to learn the method.

2. **Brier score decomposition** — while related to calibration, the
   reliability-resolution-uncertainty decomposition adds complexity
   without proportional insight for the target audience. ECE is sufficient.

### Future Phases (post-MVP, scoped but not scheduled)

**Phase 6 — Multi-Model Comparison**
- Show two distributions/curves side by side, compare operating points
- "Model A vs. Model B" toggle with separate threshold controls
- DeLong test for AUC comparison with confidence interval
- Teaches: when is a difference in AUC meaningful?

**Phase 7 — Real Data Mode**
- Small CSV upload (two columns: score, label)
- Or choose from built-in datasets (UCI, Kaggle classics)
- All views work identically — the engine doesn't care if data is
  synthetic or real
- Teaches: bridge from sandbox to real workflows

**Phase 8 — Classroom & Sharing**
- Teacher mode: create scenario assignments with locked controls
- Student mode: complete assignments, export results
- Embeddable mode: `<iframe>` with configurable initial state
- Worksheet export (PDF) with current state snapshots

---

## Dependency Graph

```
Phase 0 (core features — current architecture, no prerequisites)
  ├── 0.1 Confusion matrix visualization
  ├── 0.2 FP/FN/TP/TN region shading on distributions
  │       — depends on 0.1 (matching colors)
  ├── 0.3 PR curve view
  ├── 0.4 Draggable threshold handle
  ├── 0.5 UI adjustments (de-emphasize interpolation)
  └── 0.6 URL state encoding
       │
Phase 1 (foundation — architecture migration)
  │     All of Phase 1 depends on Phase 0 being complete (so we know
  │     what code we're refactoring). Items within Phase 1 are sequential:
  ├── 1.1 Vite project setup
  ├── 1.2 Module extraction — depends on 1.1
  ├── 1.3 Reactive state — depends on 1.2
  ├── 1.4 New distribution families + model archetypes — depends on 1.2
  └── 1.5 Tests — depends on 1.2 (needs module imports)
       │
Phase 2 (playground enhancements) — depends on 1.3 (reactive state)
  ├── 2.1 Bidirectional cross-view linking — depends on 1.3
  ├── 2.2 Metrics dashboard
  ├── 2.3 Pairwise AUC animation
  ├── 2.4 View focus bar — depends on 1.3 (reads/writes state.visiblePanels)
  └── 2.5 UI redesign + microcopy
  │       — depends on 2.1, 2.2, 2.4 (layout requires knowing all panels)
       │
Phase 3 (decision lab) — depends on Phase 2
  ├── 3.1 Deployment parameters (prevalence, costs, constraints, label noise)
  │       — depends on 0.3 (PR curve uses prevalence)
  ├── 3.2 Iso-cost lines — depends on 3.1
  ├── 3.3 Deployment card — depends on 3.1, 3.2
  ├── 3.4 Calibration plot — depends on 1.4 (betaPdf), 3.1 (prevalence)
  └── 3.5 Scenario presets — depends on 3.1, 3.4
       │
Phase 4 (guided tour) — depends on Phase 3
  ├── 4.1 Tour engine
  ├── 4.2 Chapter content (writing starts in Phase 0, in parallel)
  └── 4.3 Content integration — depends on 4.1, 4.2
       │
Phase 5 (polish) — depends on Phase 3, partially on Phase 4
  ├── 5.1 Bootstrap uncertainty (independent, needs only Phase 1)
  ├── 5.2 Accessibility (can start during Phase 2)
  ├── 5.3 Performance
  ├── 5.4 Responsive layout
  └── 5.5 Visual polish
```

## Parallel Content Track

**Critical**: Tour chapter text must be drafted alongside engineering work.
Do not defer writing to Phase 4 implementation.

| Sprint | Engineering               | Content Writing                                          |
|--------|--------------------------|----------------------------------------------------------|
| 1      | Phase 0: Core features   | Draft chapters 0–2 (prediction game, threshold, rates)   |
| 2      | Phase 1: Foundation      | Draft chapters 3–5 (ROC curve, AUC, PR)                  |
| 3      | Phase 2: Enhancements    | Draft chapters 6–7 (calibration, costs)                   |
| 4      | Phase 3: Decision Lab    | Draft chapters 8–9 (drift, synthesis)                     |
| 5      | Phase 4: Tour            | Integrate, test, refine all 10 chapters                   |
| 6      | Phase 5: Polish          | Final copy edit, user testing, prediction prompt tuning    |

## Technical Constraints

- Zero runtime dependencies (no D3, no Chart.js, no React)
- Dev dependencies only: Vite, Vitest (added in Phase 1)
- Web fonts loaded via `<link>` (Google Fonts: Newsreader + JetBrains Mono)
- Target: ES2020+ browsers (no IE11)
- Single index.html production build (easy to deploy anywhere)
- All math must be deterministic given a seed (reproducibility)
- No backend, no analytics SDK, no cookies — all state is client-side
  (localStorage for tour progress, URL params for sharing)
- All SVG hand-rolled — no charting library abstraction layer
- Performance budget: all interactions at 60fps with nPerClass ≤ 2000
- Accessibility: WCAG 2.1 AA for color contrast, keyboard-navigable,
  ARIA labels, `prefers-reduced-motion` respected
