import {
  addPath,
  clampPointLabelPosition,
  clear,
  computeCurveLayout,
  createSvgEl,
  drawAxes,
  drawLegend,
} from "./svg.js";

function rectsOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function labelBounds({ x, y, width, height = 12 }) {
  return {
    left: x,
    right: x + width,
    top: y - height,
    bottom: y + 4,
  };
}

function prLegendBounds(box, cfg, labels) {
  const row = cfg.legendRow || 18;
  const lineLen = cfg.legendLine || 20;
  const pad = cfg.legendPad || 10;
  const startY = box.top + box.height - pad - (labels.length - 1) * row;
  const maxLabelWidth = Math.max(...labels.map((label) => label.length * 6.4));
  const x1 = box.left + pad;
  const x2 = x1 + lineLen;
  const textX = x2 + 6;

  return {
    left: x1 - 2,
    right: textX + maxLabelWidth + 2,
    top: startY - 12,
    bottom: startY + (labels.length - 1) * row + 6,
  };
}

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
  const labelText = `threshold = ${fmt(threshold, 3)}`;
  const labelWidth = Math.max(112, labelText.length * 6.4);
  let labelPos = clampPointLabelPosition({ box, x: cx, y: cy, labelWidth });
  const legendLabels = ["Empirical PR", `Random baseline (${fmt(pr.prevalence, 3)})`];
  const legendItems = [
    { label: legendLabels[0], color: "var(--emp)" },
    { label: legendLabels[1], color: "var(--diag)", dash: "6 6" },
  ];
  const legendRect = prLegendBounds(box, layout.cfg, legendLabels);
  if (rectsOverlap(labelBounds({ ...labelPos, width: labelWidth }), legendRect)) {
    labelPos = {
      ...labelPos,
      y: Math.max(box.top + 14, Math.min(labelPos.y, legendRect.top - 6)),
    };
  }

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
  ).textContent = labelText;

  drawLegend(svg, legendItems, box, layout.cfg, "inside-left");

  return box;
}
