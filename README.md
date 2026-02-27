# ROC Interpolation Playground

Interactive visualization of a threshold-only classifier on one synthetic variable.

## Run

Open `index.html` directly in a browser, or serve this folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## What you can explore

- Two-class data sampled from normal distributions (with optional positive outliers)
- Additional preset families: log-normal, Student-t heavy-tail, positive-mixture, zero-inflated, uniform, exponential
- Probability-style score presets in `[0,1]` using Beta families (good separation, overlap, overconfident, midrange)
- Evaluation sample imbalance control (positive class fraction) to see how empirical PR and confusion counts shift
- A single threshold classifier: predict positive if `score >= threshold`
- Progressive controls: global controls stay visible, and family-specific parameters appear in the Advanced section
- ROC curve with live operating point
- Triangle interpolation versus smoother alternatives
- AUC cross-checks for correctness: empirical trapezoidal AUC and rank-statistic AUC (Mann-Whitney form)

## Better alternatives to a triangle

- Concave hull interpolation: non-parametric and data-driven
- Gaussian model ROC: smooth parametric curve if normality assumption is plausible
- Power interpolation: simple smooth curve through `(0,0)`, operating point, `(1,1)`
