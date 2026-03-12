import { addPath, clear, createSvgEl, eventToSvgCoordinates, getSvgViewSize } from "./svg.js";
import { clamp } from "../core/math.js";
import { METRIC_TREND_LAYOUT, METRIC_TREND_VIEW_FALLBACK } from "./layout-config.js";
import { drawThresholdMarker } from "./threshold-marker.js";

const METRIC_SERIES = [
  {
    key: "recall",
    label: "Recall",
    color: "#0D9488",
    width: 2.6,
    tooltip: "Recall: of all truly positive cases, the fraction predicted positive.",
  },
  {
    key: "precision",
    label: "Precision",
    color: "#2563EB",
    width: 2.4,
    dash: "10 5",
    tooltip: "Precision: of all predicted positive cases, the fraction truly positive.",
  },
  {
    key: "specificity",
    label: "Specificity",
    color: "#D97706",
    width: 2.4,
    dash: "2 5",
    tooltip: "Specificity: of all truly negative cases, the fraction predicted negative (1 - FPR).",
  },
  {
    key: "f1",
    label: "F1 Score",
    color: "#7C3AED",
    width: 2.4,
    dash: "12 4 2 4",
    tooltip: "F1 Score: harmonic mean of precision and recall.",
  },
  {
    key: "mcc",
    label: "MCC",
    color: "#111111",
    width: 3.0,
    tooltip: "MCC: balanced correlation-style score using TP, TN, FP, and FN.",
  },
  {
    key: "accuracy",
    label: "Accuracy",
    color: "#7A7062",
    width: 1.8,
    dash: "5 4",
    tooltip: "Accuracy: fraction of all predictions that are correct.",
  },
];

function getMetricTrendYRange(curves) {
  const allY = [
    ...(curves.recall || []).map((p) => p.v),
    ...(curves.precision || []).map((p) => p.v),
    ...(curves.specificity || []).map((p) => p.v),
    ...(curves.f1 || []).map((p) => p.v),
    ...(curves.mcc || []).map((p) => p.v),
    ...(curves.accuracy || []).map((p) => p.v),
  ];
  const hasNegative = allY.some((v) => v < 0);
  const yMin = hasNegative ? -1 : 0;
  const yMax = 1;
  const ySpan = Math.max(1e-9, yMax - yMin);
  return { yMin, yMax, ySpan };
}

function getMetricSeries(curves) {
  return METRIC_SERIES.map((s) => ({ ...s, points: curves[s.key] })).filter(
    (s) => Array.isArray(s.points) && s.points.length > 0
  );
}

function getMetricTrendBox(svg) {
  const view = getSvgViewSize(svg, METRIC_TREND_VIEW_FALLBACK.width, METRIC_TREND_VIEW_FALLBACK.height);
  return {
    left: METRIC_TREND_LAYOUT.boxLeft,
    top: METRIC_TREND_LAYOUT.boxTop,
    width: Math.max(METRIC_TREND_LAYOUT.minWidth, view.width - METRIC_TREND_LAYOUT.widthInset),
    height: Math.max(METRIC_TREND_LAYOUT.minHeight, view.height - METRIC_TREND_LAYOUT.heightInset),
  };
}

function drawMetricTrendXAxis(axis, { box, thresholdMin, thresholdMax, fmt }) {
  const xTicks = METRIC_TREND_LAYOUT.xTicks;
  for (let i = 0; i <= xTicks; i += 1) {
    const u = i / xTicks;
    const x = box.left + u * box.width;
    axis.appendChild(
      createSvgEl("line", {
        x1: x,
        y1: box.top,
        x2: x,
        y2: box.top + box.height,
        stroke: "rgba(0,0,0,0.08)",
      })
    );
    const tickThreshold = thresholdMin + u * (thresholdMax - thresholdMin);
    axis.appendChild(
      createSvgEl("text", {
        x,
        y: box.top + box.height + 18,
        class: "tick",
        "text-anchor": "middle",
      })
    ).textContent = fmt(tickThreshold, 2);
  }
}

function drawMetricTrendYAxis(axis, { box, yMin, yMax, fmt }) {
  const yTicks = METRIC_TREND_LAYOUT.yTicks;
  for (let i = 0; i <= yTicks; i += 1) {
    const u = i / yTicks;
    const y = box.top + box.height - u * box.height;
    axis.appendChild(
      createSvgEl("line", {
        x1: box.left,
        y1: y,
        x2: box.left + box.width,
        y2: y,
        stroke: "rgba(0,0,0,0.08)",
      })
    );
    const value = yMin + u * (yMax - yMin);
    axis.appendChild(
      createSvgEl("text", {
        x: box.left - 10,
        y: y + 4,
        class: "tick",
        "text-anchor": "end",
      })
    ).textContent = fmt(value, 2);
  }
}

function drawMetricTrendZeroLine(axis, { box, yMin, ySpan }) {
  const zeroU = (0 - yMin) / ySpan;
  const zeroY = box.top + (1 - zeroU) * box.height;
  axis.appendChild(
    createSvgEl("line", {
      x1: box.left,
      y1: zeroY,
      x2: box.left + box.width,
      y2: zeroY,
      stroke: "rgba(0,0,0,0.25)",
      "stroke-dasharray": "4 4",
    })
  );
}

function drawMetricTrendFrameAndLabels(axis, box) {
  axis.appendChild(
    createSvgEl("rect", {
      x: box.left,
      y: box.top,
      width: box.width,
      height: box.height,
      fill: "none",
      stroke: "rgba(0,0,0,0.25)",
    })
  );

  axis.appendChild(
    createSvgEl("text", {
      x: box.left + box.width / 2,
      y: box.top + box.height + METRIC_TREND_LAYOUT.axisLabelYOffset,
      class: "axis-label",
      "text-anchor": "middle",
    })
  ).textContent = "Threshold";

  const yLabel = createSvgEl("text", {
    x: box.left - 52,
    y: box.top + box.height / 2,
    class: "axis-label",
    "text-anchor": "middle",
    transform: `rotate(-90 ${box.left - 52} ${box.top + box.height / 2})`,
  });
  yLabel.textContent = "Metric value";
  axis.appendChild(yLabel);
}

function drawMetricTrendAxis({ svg, box, yMin, yMax, ySpan, thresholdMin, thresholdMax, fmt, hasNegative }) {
  const axis = createSvgEl("g", {});
  drawMetricTrendXAxis(axis, { box, thresholdMin, thresholdMax, fmt });
  drawMetricTrendYAxis(axis, { box, yMin, yMax, fmt });
  if (hasNegative) {
    drawMetricTrendZeroLine(axis, { box, yMin, ySpan });
  }
  drawMetricTrendFrameAndLabels(axis, box);
  svg.appendChild(axis);
}

function drawMetricSeries({ svg, series, box, yMin, ySpan, hoveredKey }) {
  for (const item of series) {
    const unitPoints = item.points.map((p) => ({
      x: p.u,
      y: clamp((p.v - yMin) / ySpan, 0, 1),
    }));
    const isHovered = hoveredKey === item.key;
    const isDimmed = hoveredKey && !isHovered;
    const path = addPath(
      svg,
      unitPoints,
      box,
      item.color,
      (item.width || 2.2) + (isHovered ? 0.8 : 0),
      item.dash || null,
      "x",
      "y"
    );
    path.setAttribute("opacity", isDimmed ? "0.2" : "1");
  }
}

function metricValueAtThreshold(points, threshold, thresholdMin, thresholdMax) {
  if (!Array.isArray(points) || points.length === 0) {
    return null;
  }
  if (points.length === 1 || thresholdMax <= thresholdMin) {
    return points[0].v;
  }
  const u = clamp((threshold - thresholdMin) / (thresholdMax - thresholdMin), 0, 1);
  const scaledIndex = u * (points.length - 1);
  const lowerIndex = Math.floor(scaledIndex);
  const upperIndex = Math.min(points.length - 1, lowerIndex + 1);
  const t = scaledIndex - lowerIndex;
  const lowerValue = points[lowerIndex].v;
  const upperValue = points[upperIndex].v;
  return lowerValue + (upperValue - lowerValue) * t;
}

function metricLegendItems(series, hoveredKey, { threshold, thresholdMin, thresholdMax, fmt }) {
  return series.map(({ key, label, color, dash, width, points, tooltip }) => {
    const value = metricValueAtThreshold(points, threshold, thresholdMin, thresholdMax);
    const valueLabel = value == null ? "n/a" : fmt(value, 2);
    return {
      key,
      label,
      valueLabel,
      tooltip,
      color,
      dash,
      width: (width || 3) + (hoveredKey === key ? 0.8 : 0),
      opacity: hoveredKey && hoveredKey !== key ? 0.25 : 1,
    };
  });
}

function attachTitle(el, text) {
  if (!text) {
    return;
  }
  const title = createSvgEl("title", {});
  title.textContent = text;
  el.appendChild(title);
}

function setLegendKey(el, key) {
  if (!key) {
    return;
  }
  el.setAttribute("data-legend-key", key);
}

function drawMetricLegend({ svg, box, items }) {
  const row = METRIC_TREND_LAYOUT.legendRow || 18;
  const lineLen = METRIC_TREND_LAYOUT.legendLine || 20;
  const pad = METRIC_TREND_LAYOUT.legendPad || 10;
  const labelGap = METRIC_TREND_LAYOUT.legendLabelGap || 6;
  const valueOffset = METRIC_TREND_LAYOUT.legendValueOffset || 116;
  const startY = box.top + box.height - pad - (items.length - 1) * row;

  const x1 = box.left + box.width + 12;
  const x2 = x1 + lineLen;
  const labelX = x2 + labelGap;
  const valueX = labelX + valueOffset;

  for (let idx = 0; idx < items.length; idx += 1) {
    const item = items[idx];
    const y = startY + idx * row;
    const opacity = item.opacity == null ? 1 : item.opacity;

    const line = createSvgEl("line", {
      x1,
      y1: y,
      x2,
      y2: y,
      stroke: item.color,
      "stroke-width": item.width || 3,
      "stroke-dasharray": item.dash || "",
      opacity,
    });
    setLegendKey(line, item.key);
    attachTitle(line, item.tooltip);
    svg.appendChild(line);

    const labelText = createSvgEl("text", {
      x: labelX,
      y: y + 4,
      class: "legend",
      opacity,
    });
    setLegendKey(labelText, item.key);
    labelText.textContent = item.label;
    attachTitle(labelText, item.tooltip);
    svg.appendChild(labelText);

    const valueText = createSvgEl("text", {
      x: valueX,
      y: y + 4,
      class: "legend legend-value",
      "text-anchor": "end",
      opacity,
    });
    setLegendKey(valueText, item.key);
    valueText.textContent = item.valueLabel;
    attachTitle(valueText, item.tooltip);
    svg.appendChild(valueText);
  }
}

export function metricTrendHoverKeyFromPointer({ evt, svg, box, curves }) {
  if (!box || !curves) {
    return null;
  }
  const point = eventToSvgCoordinates(
    evt,
    svg,
    METRIC_TREND_VIEW_FALLBACK.width,
    METRIC_TREND_VIEW_FALLBACK.height
  );
  if (
    point.x < box.left ||
    point.x > box.left + box.width ||
    point.y < box.top ||
    point.y > box.top + box.height
  ) {
    return null;
  }

  const { yMin, ySpan } = getMetricTrendYRange(curves);
  const u = clamp((point.x - box.left) / box.width, 0, 1);

  let bestKey = null;
  let bestDist = Infinity;
  for (const item of METRIC_SERIES) {
    const points = curves[item.key];
    if (!points || !points.length) {
      continue;
    }
    const idx = clamp(Math.round(u * (points.length - 1)), 0, points.length - 1);
    const yNorm = clamp((points[idx].v - yMin) / ySpan, 0, 1);
    const y = box.top + (1 - yNorm) * box.height;
    const dist = Math.abs(point.y - y);
    if (dist < bestDist) {
      bestDist = dist;
      bestKey = item.key;
    }
  }

  return bestDist <= METRIC_TREND_LAYOUT.hoverSnapPx ? bestKey : null;
}

export function drawMetricTrend({ svg, curves, hoveredKey, threshold, thresholdMin, thresholdMax, fmt }) {
  if (!svg) {
    return null;
  }
  clear(svg);
  if (!curves) {
    return null;
  }

  const series = getMetricSeries(curves);
  const { yMin, yMax, ySpan } = getMetricTrendYRange(curves);
  const hasNegative = yMin < 0;
  const box = getMetricTrendBox(svg);
  drawMetricTrendAxis({
    svg,
    box,
    yMin,
    yMax,
    ySpan,
    thresholdMin,
    thresholdMax,
    fmt,
    hasNegative,
  });
  drawMetricSeries({ svg, series, box, yMin, ySpan, hoveredKey });
  drawThresholdMarker({
    svg,
    box,
    minX: thresholdMin,
    maxX: thresholdMax,
    threshold,
    fmt,
  });
  drawMetricLegend({
    svg,
    box,
    items: metricLegendItems(series, hoveredKey, {
      threshold,
      thresholdMin,
      thresholdMax,
      fmt,
    }),
  });

  return box;
}
