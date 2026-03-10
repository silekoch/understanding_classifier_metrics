# Classifier Evaluation Playground

An interactive tool for building intuition about classifier evaluation metrics.
Drag a threshold and watch the confusion matrix, ROC curve, and PR curve all react in real time.

## Run locally

Open `index.html` directly in a browser, or serve this folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Developer tooling

Install local tooling dependencies:

```bash
npm install
```

Available commands:

```bash
npm run lint
npm run lint:fix
npm run format:check
npm run format
```

Linting includes warning-level structural limits (`max-lines`, `max-lines-per-function`, and `complexity`) to guide
incremental splitting without blocking work.

## What you can explore

- **Score distributions** — two-class data drawn from a variety of distribution families
  (Gaussian, log-normal, Student-t, Beta, mixture, zero-inflated, and more)
- **Threshold control** — drag the threshold directly on the distribution plot, or use the slider;
  everything updates at 60fps
- **Confusion matrix** — live TP/FP/TN/FN counts and rates, linked to the threshold position
- **ROC curve** — empirical ROC curve with live operating point
- **PR curve** — empirical precision-recall curve with live operating point and prevalence baseline
- **Prevalence control** — adjust the positive class fraction in the evaluation sample to see how
  PR shifts while ROC stays invariant
- **Distribution presets** — quickly switch between distribution shapes and Beta-family probability
  score presets to see how model output characteristics affect the curves
- **URL sharing** — every state is encoded in the URL; copy and paste to share a specific configuration
