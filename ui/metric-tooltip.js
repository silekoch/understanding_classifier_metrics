function mi(text) {
  return `<mi>${text}</mi>`;
}

function mo(text) {
  return `<mo>${text}</mo>`;
}

function mn(text) {
  return `<mn>${text}</mn>`;
}

function mrow(parts) {
  return `<mrow>${parts.join("")}</mrow>`;
}

function frac(numerator, denominator) {
  return `<mfrac>${numerator}${denominator}</mfrac>`;
}

function paren(content) {
  return mrow([mo("("), content, mo(")")]);
}

function math(content) {
  return `<math display="inline">${content}</math>`;
}

const METRIC_TOOLTIP_CONTENT = {
  recall: {
    description: "Share of actual positives that are correctly detected.",
    formulaHtml: math(frac(mi("TP"), mrow([mi("TP"), mo("+"), mi("FN")]))),
  },
  precision: {
    description: "Share of predicted positives that are truly positive.",
    formulaHtml: math(frac(mi("TP"), mrow([mi("TP"), mo("+"), mi("FP")]))),
  },
  specificity: {
    description: "Share of actual negatives that are correctly rejected.",
    formulaHtml: math(
      mrow([frac(mi("TN"), mrow([mi("TN"), mo("+"), mi("FP")])), mo("="), mn("1"), mo("−"), mi("FPR")])
    ),
  },
  f1: {
    description: "Harmonic mean of precision and recall.",
    formulaHtml: math(
      frac(
        mrow([mn("2"), mo("·"), mi("Precision"), mo("·"), mi("Recall")]),
        mrow([mi("Precision"), mo("+"), mi("Recall")])
      )
    ),
  },
  mcc: {
    description: "Balanced correlation-like score; robust to class imbalance.",
    formulaHtml: math(
      frac(
        mrow([mi("TP"), mo("·"), mi("TN"), mo("−"), mi("FP"), mo("·"), mi("FN")]),
        mrow([
          "<msqrt>",
          mrow([
            paren(mrow([mi("TP"), mo("+"), mi("FP")])),
            paren(mrow([mi("TP"), mo("+"), mi("FN")])),
            paren(mrow([mi("TN"), mo("+"), mi("FP")])),
            paren(mrow([mi("TN"), mo("+"), mi("FN")])),
          ]),
          "</msqrt>",
        ])
      )
    ),
  },
  accuracy: {
    description: "Share of all predictions that are correct.",
    formulaHtml: math(
      frac(
        mrow([mi("TP"), mo("+"), mi("TN")]),
        mrow([mi("TP"), mo("+"), mi("TN"), mo("+"), mi("FP"), mo("+"), mi("FN")])
      )
    ),
  },
};

export function renderMetricTooltip({ el, metricKey }) {
  if (!el) {
    return;
  }

  const content = metricKey ? METRIC_TOOLTIP_CONTENT[metricKey] : null;
  if (!content) {
    el.hidden = true;
    el.dataset.metricKey = "";
    el.innerHTML = "";
    return;
  }

  if (!el.hidden && el.dataset.metricKey === metricKey) {
    return;
  }

  el.dataset.metricKey = metricKey;
  el.innerHTML = `
    <p class="metric-tooltip-desc">${content.description}</p>
    <div class="metric-tooltip-formula">${content.formulaHtml}</div>
  `;
  el.hidden = false;
}
