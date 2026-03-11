import {
  addPath,
  clampPointLabelPosition,
  clear,
  computeCurveLayout,
  createSvgEl,
  drawAxes,
  drawLegend,
} from "./svg.js";

export function drawPr({ svg, pr, threshold, fmt }) {
  clear(svg);

  const layout = computeCurveLayout(svg, "two-up");
  const box = layout.box;
  drawAxes(svg, box, 10, 10, "Recall", "Precision");

  const baselineY = box.top + (1 - pr.prevalence) * box.height;
  svg.appendChild(
    createSvgEl("line", {
      x1: box.left,
      y1: baselineY,
      x2: box.left + box.width,
      y2: baselineY,
      stroke: "var(--diag)",
      "stroke-width": layout.cfg.strokeAux,
      "stroke-dasharray": "6 6",
    })
  );

  addPath(svg, pr.points, box, "var(--emp)", layout.cfg.strokeMain, null, "recall", "precision");

  const op = pr.op;
  const cx = box.left + op.recall * box.width;
  const cy = box.top + (1 - op.precision) * box.height;
  const labelPos = clampPointLabelPosition({ box, x: cx, y: cy });

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
      x: labelPos.x,
      y: labelPos.y,
      class: "legend",
    })
  ).textContent = `threshold = ${fmt(threshold, 3)}`;

  drawLegend(
    svg,
    [
      { label: "Empirical PR", color: "var(--emp)" },
      { label: `Random baseline (${fmt(pr.prevalence, 3)})`, color: "var(--diag)", dash: "6 6" },
    ],
    box,
    layout.cfg,
    "inside-left"
  );

  return box;
}
