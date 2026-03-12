import {
  addPath,
  clampPointLabelPosition,
  clear,
  computeCurveLayout,
  createSvgEl,
  drawAxes,
  drawLegend,
} from "./svg.js";

function highlightStrokeForCell(cellKey) {
  if (cellKey === "tp" || cellKey === "fn") {
    return "var(--pos)";
  }
  if (cellKey === "fp" || cellKey === "tn") {
    return "var(--neg)";
  }
  return null;
}

export function drawRoc({ svg, roc, threshold, fmt, highlightCellKey = null }) {
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
  const labelPos = clampPointLabelPosition({ box, x: cx, y: cy });
  const highlightStroke = highlightStrokeForCell(highlightCellKey);

  if (highlightStroke) {
    svg.appendChild(
      createSvgEl("circle", {
        cx,
        cy,
        r: layout.cfg.pointRadius + 4.5,
        fill: "none",
        stroke: highlightStroke,
        "stroke-width": 8,
        opacity: 0.2,
        "pointer-events": "none",
      })
    );
    svg.appendChild(
      createSvgEl("circle", {
        cx,
        cy,
        r: layout.cfg.pointRadius + 2.5,
        fill: "none",
        stroke: highlightStroke,
        "stroke-width": 2.5,
        opacity: 0.95,
        "pointer-events": "none",
      })
    );
  }

  svg.appendChild(
    createSvgEl("circle", {
      cx,
      cy,
      r: layout.cfg.pointRadius,
      fill: "#ffffff",
      stroke: "#000",
      "stroke-width": layout.cfg.pointStroke,
      "data-role": "roc-op-dot",
      style: "cursor: grab;",
    })
  );

  svg.appendChild(
    createSvgEl("text", {
      x: labelPos.x,
      y: labelPos.y,
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
