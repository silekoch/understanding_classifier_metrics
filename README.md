# Classifier Evaluation Playground

An interactive tool for building intuition about classifier evaluation metrics.
Drag a threshold and watch the confusion matrix, ROC curve, and PR curve all react in real time.

## Run locally

Install dependencies and start the Vite dev server:

```bash
npm install
npm run dev
```

Then open the URL printed by Vite (typically `http://localhost:5173`).

Alternative (no build tool): serve this folder with Python:

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
npm run lint:strict
npm run lint:fix
npm test
npm run test:watch
npm run test:e2e:install
npm run test:e2e:install:ci
npm run test:e2e
npm run format:check
npm run format
npm run build
npm run check
```

Linting includes warning-level structural limits (`max-lines`, `max-lines-per-function`, and `complexity`) to guide
incremental splitting without blocking work, while correctness rules are enforced as errors.

### Browser smoke test

Playwright smoke test verifies that all chart panels render on a cold startup (regression guard for empty-panel issues):

```bash
npm run test:e2e:install
npm run test:e2e
```

CI uses:

```bash
npm run test:e2e:install:ci
```

### Git hooks (local quality gates)

Install versioned hooks once per clone:

```bash
npm run hooks:install
```

Installed hooks:

- `pre-commit`: staged Prettier/ESLint checks, then `npm test` and `npm run build`
- `pre-push`: `npm run lint:strict`, `npm test`, and `npm run build`

### CI

GitHub Actions runs the same core checks on each push and pull request:

- `npm run format:check`
- `npm run lint:strict`
- `npm test`
- `npm run build`

### GitHub Pages deployment

The workflow `.github/workflows/deploy-pages.yml` builds with Vite and deploys `dist/` to GitHub Pages on pushes
to `main`.

Setup required once in GitHub:

- `Settings -> Pages -> Build and deployment -> Source = GitHub Actions`

Notes:

- `dist/` stays gitignored; deployment publishes CI-built artifacts, not committed build output.

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
  (when both are present, preset is applied first, then explicit URL control params override it)
