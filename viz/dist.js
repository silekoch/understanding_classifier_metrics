import { clear, createSvgEl } from "./svg.js";
import { clamp } from "../core/math.js";
import { computePaddedScoreRange } from "../core/score-range.js";
import { DIST_LAYOUT } from "./layout-config.js";
import { drawThresholdMarker, raiseThresholdLabel } from "./threshold-marker.js";

const CLASS_FILL_OPACITY = 0.4;

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

  for (let i = 0; i <= DIST_LAYOUT.xTicks; i += 1) {
    const x = box.left + (i / DIST_LAYOUT.xTicks) * box.width;
    axis.appendChild(
      createSvgEl("line", {
        x1: x,
        y1: box.top,
        x2: x,
        y2: box.top + box.height,
        stroke: "rgba(0,0,0,0.07)",
      })
    );
    const val = minX + (i / DIST_LAYOUT.xTicks) * (maxX - minX);
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

  for (let i = 0; i <= DIST_LAYOUT.yTicks; i += 1) {
    const y = box.top + box.height - (i / DIST_LAYOUT.yTicks) * box.height;
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
      String(Math.round((i / DIST_LAYOUT.yTicks) * yMax))
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
        opacity: CLASS_FILL_OPACITY,
      })
    );

    svg.appendChild(
      createSvgEl("rect", {
        x,
        y: box.top + box.height - h1,
        width: binW - 1,
        height: h1,
        fill: "var(--pos)",
        opacity: CLASS_FILL_OPACITY,
      })
    );
  }
}

function drawLegend({ svg, box }) {
  appendText(
    svg,
    {
      x: box.left,
      y: box.top + box.height + DIST_LAYOUT.axisLabelOffsetY,
      class: "axis-label",
    },
    "Score (single variable)"
  );
  const legendRight = box.left + box.width - DIST_LAYOUT.legendRightInset;
  const legendTop = box.top + DIST_LAYOUT.legendTopInset;
  const swatchSize = DIST_LAYOUT.swatchSize;
  const swatchGap = DIST_LAYOUT.swatchGap;
  const items = [
    { fill: "var(--neg)", text: "negative class" },
    { fill: "var(--pos)", text: "positive class" },
  ];

  for (let i = 0; i < items.length; i += 1) {
    const y = legendTop + i * DIST_LAYOUT.legendRowGap;
    svg.appendChild(
      createSvgEl("rect", {
        x: legendRight - swatchSize,
        y,
        width: swatchSize,
        height: swatchSize,
        fill: items[i].fill,
        opacity: CLASS_FILL_OPACITY,
      })
    );
    appendText(
      svg,
      {
        x: legendRight - swatchSize - swatchGap,
        y: y + 9,
        class: "legend",
        "text-anchor": "end",
      },
      items[i].text
    );
  }
}

function getLegendAvoidRect(box) {
  const legendRight = box.left + box.width - DIST_LAYOUT.legendRightInset;
  const legendTop = box.top + DIST_LAYOUT.legendTopInset;
  const swatchSize = DIST_LAYOUT.swatchSize;
  const swatchGap = DIST_LAYOUT.swatchGap;
  const rowGap = DIST_LAYOUT.legendRowGap;
  const maxLabelWidth = "negative class".length * 6.4;
  const textRight = legendRight - swatchSize - swatchGap;
  return {
    left: textRight - maxLabelWidth + 8,
    top: legendTop - 2,
    right: legendRight + 2,
    bottom: legendTop + rowGap + swatchSize + 4,
  };
}

export function drawDist({ svg, data, threshold, fmt }) {
  clear(svg);

  const box = DIST_LAYOUT.box;
  const { minX, maxX } = computePaddedScoreRange(data.min, data.max);
  const bins = DIST_LAYOUT.bins;

  const hNeg = histogram(data.negatives, bins, minX, maxX);
  const hPos = histogram(data.positives, bins, minX, maxX);
  const yMax = Math.max(...hNeg, ...hPos, 1);
  const yMaxWithHeadroom = yMax * DIST_LAYOUT.yHeadroomFactor;
  const legendAvoidRect = getLegendAvoidRect(box);

  drawAxes({ svg, box, minX, maxX, yMax: yMaxWithHeadroom, fmt });
  drawHistogramBars({ svg, box, bins, hNeg, hPos, yMax: yMaxWithHeadroom });
  drawThresholdMarker({
    svg,
    box,
    minX,
    maxX,
    threshold,
    fmt,
    avoidRect: legendAvoidRect,
    withAccessibility: true,
  });
  drawLegend({ svg, box });
  raiseThresholdLabel(svg);

  return { box, minX, maxX };
}
