export function renderMetricsText({ metricsTextEl, op, fmt }) {
  const rows = [
    ["Recall (TPR)", op.tpr],
    ["False Positive Rate (FPR)", op.fpr],
    ["Precision (PPV)", op.precision],
    ["Specificity (TNR)", op.specificity],
    ["F1 Score", op.f1],
    ["MCC (Matthews)", op.mcc],
  ];
  const labelWidth = Math.max(...rows.map(([label]) => label.length)) + 2;

  metricsTextEl.textContent = rows
    .map(([label, value]) => `${label.padEnd(labelWidth)}${fmt(value, 2)}`)
    .join("\n");
}
