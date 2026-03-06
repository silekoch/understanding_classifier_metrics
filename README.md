# Classifier Evaluation Playground

An interactive tool for building deep intuition about classifier evaluation metrics.
Drag a threshold and watch the confusion matrix, ROC curve, and PR curve all react in real time.

## Run

Open `index.html` directly in a browser, or serve this folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## What you can explore

- **Score distributions** — two-class data drawn from a variety of distribution families
  (Gaussian, log-normal, Student-t, Beta, mixture, zero-inflated, and more)
- **Threshold control** — drag the threshold directly on the distribution plot, or use the slider;
  everything updates at 60fps
- **Confusion matrix** — live TP/FP/TN/FN counts and rates, linked to the threshold position
- **ROC curve** — empirical curve with live operating point; AUC via trapezoidal and rank-statistic
  (Mann-Whitney) methods as a cross-check
- **PR curve** — empirical precision-recall curve with live operating point and Average Precision
- **Prevalence control** — adjust the positive class fraction in the evaluation sample to see how
  PR shifts while ROC stays invariant
- **Distribution presets** — quickly switch between distribution shapes and Beta-family probability
  score presets to see how model output characteristics affect the curves
- **URL sharing** — every state is encoded in the URL; copy and paste to share a specific configuration
