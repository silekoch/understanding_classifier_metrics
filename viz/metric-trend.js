import { addPath, clear, createSvgEl, drawLegend, eventToSvgCoordinates, getSvgViewSize } from "./svg.js";

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

const METRIC_SERIES = [
  { key: "recall", label: "Recall (TPR)", color: "#0D9488", width: 2.6 },
  { key: "precision", label: "Precision (PPV)", color: "#2563EB", width: 2.4, dash: "10 5" },
  { key: "specificity", label: "Specificity (TNR)", color: "#D97706", width: 2.4, dash: "2 5" },
  { key: "f1", label: "F1 Score", color: "#7C3AED", width: 2.4, dash: "12 4 2 4" },
  { key: "mcc", label: "MCC", color: "#111111", width: 3.0 },
  { key: "accuracy", label: "Accuracy", color: "#7A7062", width: 1.8, dash: "5 4" },
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
  const view = getSvgViewSize(svg, 760, 240);
  return {
    left: 66,
    top: 18,
    width: Math.max(140, view.width - 250),
    height: Math.max(80, view.height - 62),
  };
}

function drawMetricTrendXAxis(axis, { box, thresholdMin, thresholdMax, fmt }) {
  const xTicks = 6;
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
  const yTicks = 5;
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
      y: box.top + box.height + 40,
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

function drawThresholdMarker({ svg, box, threshold, thresholdMin, thresholdMax, fmt }) {
  const uCurrent = clamp((threshold - thresholdMin) / Math.max(1e-9, thresholdMax - thresholdMin), 0, 1);
  const markerX = box.left + uCurrent * box.width;
  const handleY = box.top + box.height / 2;

  svg.appendChild(
    createSvgEl("line", {
      x1: markerX,
      y1: box.top,
      x2: markerX,
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
      cx: markerX,
      cy: handleY,
      r: 12,
      fill: "rgba(120,120,120,0.25)",
      stroke: "#000000",
      "stroke-width": 2,
      "data-role": "threshold-handle",
      class: "threshold-grab",
    })
  );

  svg.appendChild(
    createSvgEl("circle", {
      cx: markerX,
      cy: handleY,
      r: 18,
      fill: "transparent",
      stroke: "none",
      "data-role": "threshold-handle",
      class: "threshold-grab",
    })
  );

  svg.appendChild(
    createSvgEl("text", {
      x: markerX + 7,
      y: box.top + 16,
      class: "legend",
    })
  ).textContent = `threshold ${fmt(threshold, 3)}`;
}

function metricLegendItems(series, hoveredKey) {
  return series.map(({ key, label, color, dash, width }) => ({
    key,
    label,
    color,
    dash,
    width: (width || 3) + (hoveredKey === key ? 0.8 : 0),
    opacity: hoveredKey && hoveredKey !== key ? 0.25 : 1,
  }));
}

export function metricTrendHoverKeyFromPointer({ evt, svg, box, curves }) {
  if (!box || !curves) {
    return null;
  }
  const point = eventToSvgCoordinates(evt, svg, 760, 240);
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

  return bestDist <= 12 ? bestKey : null;
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
  drawThresholdMarker({ svg, box, threshold, thresholdMin, thresholdMax, fmt });
  drawLegend(
    svg,
    metricLegendItems(series, hoveredKey),
    box,
    { legendPad: 10, legendRow: 17, legendLine: 18 },
    "outside-right"
  );

  return box;
}
