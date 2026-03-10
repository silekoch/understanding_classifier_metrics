import { clear, createSvgEl } from "./svg.js";

export function drawConfusionMatrix({ svg, op, fmtPct }) {
  clear(svg);

  const total = op.tp + op.fp + op.tn + op.fn;
  const grid = { left: 170, top: 70, cellW: 230, cellH: 110 };
  const cells = [
    { key: "tp", label: "TP", col: 0, row: 0, color: "var(--pos)", denom: op.P },
    { key: "fn", label: "FN", col: 1, row: 0, color: "var(--pos)", denom: op.P },
    { key: "fp", label: "FP", col: 0, row: 1, color: "var(--neg)", denom: op.N },
    { key: "tn", label: "TN", col: 1, row: 1, color: "var(--neg)", denom: op.N },
  ];

  svg.appendChild(
    createSvgEl("text", {
      x: grid.left + grid.cellW,
      y: 28,
      class: "axis-label",
      "text-anchor": "middle",
    })
  ).textContent = "Predicted class";

  svg.appendChild(
    createSvgEl("text", {
      x: grid.left + grid.cellW * 0.5,
      y: 52,
      class: "legend",
      "text-anchor": "middle",
    })
  ).textContent = "Predicted Positive";

  svg.appendChild(
    createSvgEl("text", {
      x: grid.left + grid.cellW * 1.5,
      y: 52,
      class: "legend",
      "text-anchor": "middle",
    })
  ).textContent = "Predicted Negative";

  const yLabel = createSvgEl("text", {
    x: 60,
    y: grid.top + grid.cellH,
    class: "axis-label",
    "text-anchor": "middle",
    transform: `rotate(-90 60 ${grid.top + grid.cellH})`,
  });
  yLabel.textContent = "Actual class";
  svg.appendChild(yLabel);

  svg.appendChild(
    createSvgEl("text", {
      x: 132,
      y: grid.top + grid.cellH * 0.5 + 4,
      class: "legend",
      "text-anchor": "middle",
    })
  ).textContent = "Actual Positive";

  svg.appendChild(
    createSvgEl("text", {
      x: 132,
      y: grid.top + grid.cellH * 1.5 + 4,
      class: "legend",
      "text-anchor": "middle",
    })
  ).textContent = "Actual Negative";

  for (const cell of cells) {
    const count = op[cell.key];
    const rate = cell.denom > 0 ? count / cell.denom : 0;
    const x = grid.left + cell.col * grid.cellW;
    const y = grid.top + cell.row * grid.cellH;

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

    if (rate > 0) {
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

    svg.appendChild(
      createSvgEl("text", {
        x: x + 10,
        y: y + 22,
        class: "legend",
      })
    ).textContent = cell.label;

    svg.appendChild(
      createSvgEl("text", {
        x: x + 10,
        y: y + 44,
        class: "legend",
      })
    ).textContent = `${count} (${fmtPct(rate, 1)})`;
  }

  svg.appendChild(
    createSvgEl("text", {
      x: grid.left,
      y: grid.top + grid.cellH * 2 + 26,
      class: "legend",
    })
  ).textContent = `Total samples: ${total}`;
}
