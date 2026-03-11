import { clear, createSvgEl } from "./svg.js";

const grid = { left: 170, top: 70, cellW: 230, cellH: 110 };
const cells = [
  { key: "tp", label: "TP", col: 0, row: 0, color: "var(--pos)", denomKey: "P" },
  { key: "fn", label: "FN", col: 1, row: 0, color: "var(--pos)", denomKey: "P" },
  { key: "fp", label: "FP", col: 0, row: 1, color: "var(--neg)", denomKey: "N" },
  { key: "tn", label: "TN", col: 1, row: 1, color: "var(--neg)", denomKey: "N" },
];

function appendText(svg, attrs, text) {
  svg.appendChild(createSvgEl("text", attrs)).textContent = text;
}

function drawAxisLabels(svg) {
  appendText(
    svg,
    {
      x: grid.left + grid.cellW,
      y: 28,
      class: "axis-label",
      "text-anchor": "middle",
    },
    "Predicted class"
  );
  appendText(
    svg,
    {
      x: grid.left + grid.cellW * 0.5,
      y: 52,
      class: "legend",
      "text-anchor": "middle",
    },
    "Predicted Positive"
  );
  appendText(
    svg,
    {
      x: grid.left + grid.cellW * 1.5,
      y: 52,
      class: "legend",
      "text-anchor": "middle",
    },
    "Predicted Negative"
  );

  const yLabel = createSvgEl("text", {
    x: 60,
    y: grid.top + grid.cellH,
    class: "axis-label",
    "text-anchor": "middle",
    transform: `rotate(-90 60 ${grid.top + grid.cellH})`,
  });
  yLabel.textContent = "Actual class";
  svg.appendChild(yLabel);

  appendText(
    svg,
    {
      x: 132,
      y: grid.top + grid.cellH * 0.5 + 4,
      class: "legend",
      "text-anchor": "middle",
    },
    "Actual Positive"
  );
  appendText(
    svg,
    {
      x: 132,
      y: grid.top + grid.cellH * 1.5 + 4,
      class: "legend",
      "text-anchor": "middle",
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

function drawCellInnerBox(svg, { x, y, cell, rate }) {
  if (rate <= 0) {return;}
  const scale = Math.sqrt(rate);
  const innerW = Math.max(6, grid.cellW * scale);
  const innerH = Math.max(6, grid.cellH * scale);
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
      x: x + 10,
      y: y + 22,
      class: "legend",
    },
    cell.label
  );
  appendText(
    svg,
    {
      x: x + 10,
      y: y + 44,
      class: "legend",
    },
    `${count} (${fmtPct(rate, 1)})`
  );
}

function drawCell(svg, { cell, op, fmtPct }) {
  const count = op[cell.key];
  const denom = op[cell.denomKey];
  const rate = denom > 0 ? count / denom : 0;
  const x = grid.left + cell.col * grid.cellW;
  const y = grid.top + cell.row * grid.cellH;

  drawCellSquare(svg, { x, y, cell });
  drawCellInnerBox(svg, { x, y, cell, rate });
  drawCellTexts(svg, { x, y, cell, count, rate, fmtPct });
}

export function drawConfusionMatrix({ svg, op, fmtPct }) {
  clear(svg);

  const total = op.tp + op.fp + op.tn + op.fn;
  drawAxisLabels(svg);

  for (const cell of cells) {
    drawCell(svg, { cell, op, fmtPct });
  }

  appendText(
    svg,
    {
      x: grid.left,
      y: grid.top + grid.cellH * 2 + 26,
      class: "legend",
    },
    `Total samples: ${total}`
  );
}
