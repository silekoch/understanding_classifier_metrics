import { clear, createSvgEl } from "./svg.js";
import { MATRIX_LAYOUT } from "./layout-config.js";

const grid = MATRIX_LAYOUT.grid;
const cells = [
  { key: "tp", label: "TP", col: 0, row: 0, color: "var(--pos)", denomKey: "P" },
  { key: "fn", label: "FN", col: 1, row: 0, color: "var(--pos)", denomKey: "P" },
  { key: "fp", label: "FP", col: 0, row: 1, color: "var(--neg)", denomKey: "N" },
  { key: "tn", label: "TN", col: 1, row: 1, color: "var(--neg)", denomKey: "N" },
];
const HIGHLIGHT_OUTER_STROKE = 10;
const HIGHLIGHT_INNER_STROKE = 3;

function appendText(svg, attrs, text) {
  svg.appendChild(createSvgEl("text", attrs)).textContent = text;
}

function drawAxisLabels(svg) {
  appendText(
    svg,
    {
      x: grid.left + grid.cellW,
      y: MATRIX_LAYOUT.axisTitleY,
      class: "axis-label",
      "text-anchor": "middle",
    },
    "Predicted class"
  );
  appendText(
    svg,
    {
      x: grid.left + grid.cellW * 0.5,
      y: MATRIX_LAYOUT.predictedLabelsY,
      class: "legend",
      "text-anchor": "middle",
    },
    "Predicted Positive"
  );
  appendText(
    svg,
    {
      x: grid.left + grid.cellW * 1.5,
      y: MATRIX_LAYOUT.predictedLabelsY,
      class: "legend",
      "text-anchor": "middle",
    },
    "Predicted Negative"
  );

  const yLabel = createSvgEl("text", {
    x: MATRIX_LAYOUT.yAxisLabelX,
    y: grid.top + grid.cellH,
    class: "axis-label",
    "text-anchor": "middle",
    transform: `rotate(-90 ${MATRIX_LAYOUT.yAxisLabelX} ${grid.top + grid.cellH})`,
  });
  yLabel.textContent = "Actual class";
  svg.appendChild(yLabel);

  appendText(
    svg,
    {
      x: grid.left - MATRIX_LAYOUT.actualLabelsRightGap,
      y: grid.top + grid.cellH * 0.5 + MATRIX_LAYOUT.actualLabelOffsetY,
      class: "legend",
      "text-anchor": "end",
    },
    "Actual Positive"
  );
  appendText(
    svg,
    {
      x: grid.left - MATRIX_LAYOUT.actualLabelsRightGap,
      y: grid.top + grid.cellH * 1.5 + MATRIX_LAYOUT.actualLabelOffsetY,
      class: "legend",
      "text-anchor": "end",
    },
    "Actual Negative"
  );
}

function drawCellSquare(svg, { x, y, cell }) {
  svg.appendChild(
    createSvgEl("rect", {
      x,
      y,
      width: grid.cellW,
      height: grid.cellH,
      fill: cell.color,
      opacity: 0.18,
      stroke: "rgba(0,0,0,0.2)",
    })
  );
}

function drawCellGlow(svg, { x, y, cell }) {
  svg.appendChild(
    createSvgEl("rect", {
      x: x + 1,
      y: y + 1,
      width: grid.cellW - 2,
      height: grid.cellH - 2,
      fill: "none",
      stroke: cell.color,
      "stroke-width": HIGHLIGHT_OUTER_STROKE,
      opacity: 0.22,
      "stroke-linejoin": "round",
      "pointer-events": "none",
    })
  );
  svg.appendChild(
    createSvgEl("rect", {
      x: x + 1,
      y: y + 1,
      width: grid.cellW - 2,
      height: grid.cellH - 2,
      fill: "none",
      stroke: cell.color,
      "stroke-width": HIGHLIGHT_INNER_STROKE,
      opacity: 0.95,
      "stroke-linejoin": "round",
      "pointer-events": "none",
    })
  );
}

function drawCellInnerBox(svg, { x, y, cell, rate }) {
  if (rate <= 0) {
    return;
  }
  const scale = Math.sqrt(rate);
  const innerW = Math.max(MATRIX_LAYOUT.minInnerSize, grid.cellW * scale);
  const innerH = Math.max(MATRIX_LAYOUT.minInnerSize, grid.cellH * scale);
  const innerX = x + (grid.cellW - innerW) / 2;
  const innerY = y + (grid.cellH - innerH) / 2;

  svg.appendChild(
    createSvgEl("rect", {
      x: innerX,
      y: innerY,
      width: innerW,
      height: innerH,
      fill: cell.color,
      opacity: 0.72,
      stroke: "rgba(0,0,0,0.18)",
    })
  );
}

function drawCellTexts(svg, { x, y, cell, count, rate, fmtPct }) {
  appendText(
    svg,
    {
      x: x + MATRIX_LAYOUT.cellTextXOffset,
      y: y + MATRIX_LAYOUT.cellTitleYOffset,
      class: "legend",
    },
    cell.label
  );
  appendText(
    svg,
    {
      x: x + MATRIX_LAYOUT.cellTextXOffset,
      y: y + MATRIX_LAYOUT.cellValueYOffset,
      class: "legend",
    },
    `${count} (${fmtPct(rate, 1)})`
  );
}

function drawCellHitbox(svg, { x, y, cell }) {
  svg.appendChild(
    createSvgEl("rect", {
      x,
      y,
      width: grid.cellW,
      height: grid.cellH,
      fill: "transparent",
      stroke: "none",
      "data-role": "matrix-cell-hitbox",
      "data-matrix-cell-key": cell.key,
      style: "cursor: pointer;",
    })
  );
}

function drawCell(svg, { cell, op, fmtPct, highlighted }) {
  const count = op[cell.key];
  const denom = op[cell.denomKey];
  const rate = denom > 0 ? count / denom : 0;
  const x = grid.left + cell.col * grid.cellW;
  const y = grid.top + cell.row * grid.cellH;

  drawCellSquare(svg, { x, y, cell });
  drawCellInnerBox(svg, { x, y, cell, rate });
  if (highlighted) {
    drawCellGlow(svg, { x, y, cell });
  }
  drawCellTexts(svg, { x, y, cell, count, rate, fmtPct });
  drawCellHitbox(svg, { x, y, cell });
}

export function drawConfusionMatrix({ svg, op, fmtPct, highlightCellKey = null }) {
  clear(svg);

  const total = op.tp + op.fp + op.tn + op.fn;
  drawAxisLabels(svg);

  for (const cell of cells) {
    drawCell(svg, { cell, op, fmtPct, highlighted: cell.key === highlightCellKey });
  }

  appendText(
    svg,
    {
      x: grid.left,
      y: grid.top + grid.cellH * 2 + MATRIX_LAYOUT.totalLabelOffsetY,
      class: "legend",
    },
    `Total samples: ${total}`
  );
}
