import {
  addPath,
  clear,
  computeCurveLayout,
  createSvgEl,
  drawAxes,
  drawLegend,
} from "./svg.js";

export function drawRoc({ svg, roc, threshold, fmt }) {
  clear(svg);

  const layout = computeCurveLayout(svg, "two-up");
  const box = layout.box;
  drawAxes(svg, box, 10, 10, "False Positive Rate", "True Positive Rate");

  addPath(
    svg,
    [
      { fpr: 0, tpr: 0 },
      { fpr: 1, tpr: 1 },
    ],
    box,
    "var(--diag)",
    layout.cfg.strokeAux,
    "6 6"
  );

  addPath(svg, roc.empirical, box, "var(--emp)", layout.cfg.strokeMain);

  const op = roc.op;
  const cx = box.left + op.fpr * box.width;
  const cy = box.top + (1 - op.tpr) * box.height;

  svg.appendChild(
    createSvgEl("circle", {
      cx,
      cy,
      r: layout.cfg.pointRadius,
      fill: "#ffffff",
      stroke: "#000",
      "stroke-width": layout.cfg.pointStroke,
    })
  );

  svg.appendChild(
    createSvgEl("text", {
      x: cx + 10,
      y: cy - 10,
      class: "legend",
    })
  ).textContent = `threshold = ${fmt(threshold, 3)}`;

  const legendItems = [
    { label: "Empirical ROC", color: "var(--emp)" },
    { label: "Diagonal baseline", color: "var(--diag)", dash: "6 6" },
  ];
  drawLegend(svg, legendItems, box, layout.cfg, "inside-right");
  return box;
}
