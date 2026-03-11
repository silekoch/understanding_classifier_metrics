import { clear, createSvgEl } from "./svg.js";
import { clamp } from "../core/math.js";

function histogram(values, bins, min, max) {
  const out = new Array(bins).fill(0);
  const width = max - min;
  for (const v of values) {
    const raw = ((v - min) / width) * bins;
    const idx = clamp(Math.floor(raw), 0, bins - 1);
    out[idx] += 1;
  }
  return out;
}

function appendText(svg, attrs, text) {
  svg.appendChild(createSvgEl("text", attrs)).textContent = text;
}

function drawAxes({ svg, box, minX, maxX, yMax, fmt }) {
  const axis = createSvgEl("g", {});

  for (let i = 0; i <= 10; i += 1) {
    const x = box.left + (i / 10) * box.width;
    axis.appendChild(
      createSvgEl("line", {
        x1: x,
        y1: box.top,
        x2: x,
        y2: box.top + box.height,
        stroke: "rgba(0,0,0,0.07)",
      })
    );
    const val = minX + (i / 10) * (maxX - minX);
    appendText(
      axis,
      {
        x,
        y: box.top + box.height + 18,
        class: "tick",
        "text-anchor": "middle",
      },
      fmt(val, 2)
    );
  }

  for (let i = 0; i <= 5; i += 1) {
    const y = box.top + box.height - (i / 5) * box.height;
    axis.appendChild(
      createSvgEl("line", {
        x1: box.left,
        y1: y,
        x2: box.left + box.width,
        y2: y,
        stroke: "rgba(0,0,0,0.07)",
      })
    );
    appendText(
      axis,
      {
        x: box.left - 10,
        y: y + 4,
        class: "tick",
        "text-anchor": "end",
      },
      String(Math.round((i / 5) * yMax))
    );
  }

  axis.appendChild(
    createSvgEl("rect", {
      x: box.left,
      y: box.top,
      width: box.width,
      height: box.height,
      fill: "none",
      stroke: "rgba(0,0,0,0.28)",
    })
  );

  svg.appendChild(axis);
}

function drawHistogramBars({ svg, box, bins, hNeg, hPos, yMax }) {
  const binW = box.width / bins;
  for (let i = 0; i < bins; i += 1) {
    const x = box.left + i * binW;
    const h0 = (hNeg[i] / yMax) * box.height;
    const h1 = (hPos[i] / yMax) * box.height;

    svg.appendChild(
      createSvgEl("rect", {
        x,
        y: box.top + box.height - h0,
        width: binW - 1,
        height: h0,
        fill: "var(--neg)",
        opacity: 0.4,
      })
    );

    svg.appendChild(
      createSvgEl("rect", {
        x,
        y: box.top + box.height - h1,
        width: binW - 1,
        height: h1,
        fill: "var(--pos)",
        opacity: 0.4,
      })
    );
  }
}

function drawThresholdHandle({ svg, box, minX, maxX, threshold, fmt }) {
  const boundedThreshold = clamp(threshold, minX, maxX);
  const tx = box.left + ((boundedThreshold - minX) / (maxX - minX)) * box.width;
  const handleY = box.top + box.height / 2;

  svg.appendChild(
    createSvgEl("line", {
      x1: tx,
      y1: box.top,
      x2: tx,
      y2: box.top + box.height,
      stroke: "#000",
      "stroke-width": 2,
      "stroke-dasharray": "7 5",
      "data-role": "threshold-line",
      class: "threshold-grab",
    })
  );

  svg.appendChild(
    createSvgEl("circle", {
      cx: tx,
      cy: handleY,
      r: 12,
      fill: "rgba(120,120,120,0.25)",
      stroke: "#000000",
      "stroke-width": 2,
      "data-role": "threshold-handle",
      class: "threshold-grab",
      tabindex: 0,
      role: "slider",
      "aria-label": "Threshold handle",
      "aria-valuemin": fmt(minX, 3),
      "aria-valuemax": fmt(maxX, 3),
      "aria-valuenow": fmt(threshold, 3),
    })
  );

  svg.appendChild(
    createSvgEl("circle", {
      cx: tx,
      cy: handleY,
      r: 18,
      fill: "transparent",
      stroke: "none",
      "data-role": "threshold-handle",
      class: "threshold-grab",
    })
  );

  appendText(
    svg,
    {
      x: tx + 7,
      y: box.top + 16,
      class: "legend",
    },
    `threshold ${fmt(threshold, 3)}`
  );
}

function drawLegend({ svg, box }) {
  appendText(
    svg,
    {
      x: box.left,
      y: box.top + box.height + 46,
      class: "axis-label",
    },
    "Score (single variable)"
  );
  const legendLeft = box.left + box.width - 190;
  const legendTop = box.top + 8;
  const items = [
    { fill: "var(--neg)", text: "negative class" },
    { fill: "var(--pos)", text: "positive class" },
  ];

  for (let i = 0; i < items.length; i += 1) {
    const y = legendTop + i * 18;
    svg.appendChild(
      createSvgEl("rect", {
        x: legendLeft,
        y,
        width: 10,
        height: 10,
        fill: items[i].fill,
        opacity: 0.7,
      })
    );
    appendText(
      svg,
      {
        x: legendLeft + 16,
        y: y + 9,
        class: "legend",
      },
      items[i].text
    );
  }
}

export function drawDist({ svg, data, threshold, fmt }) {
  clear(svg);

  const box = { left: 70, top: 16, width: 640, height: 240 };
  const span = data.max - data.min;
  const minX = data.min - 0.05 * span;
  const maxX = data.max + 0.05 * span;
  const bins = 34;

  const hNeg = histogram(data.negatives, bins, minX, maxX);
  const hPos = histogram(data.positives, bins, minX, maxX);
  const yMax = Math.max(...hNeg, ...hPos, 1);

  drawAxes({ svg, box, minX, maxX, yMax, fmt });
  drawHistogramBars({ svg, box, bins, hNeg, hPos, yMax });
  drawThresholdHandle({ svg, box, minX, maxX, threshold, fmt });
  drawLegend({ svg, box });

  return { box, minX, maxX };
}
