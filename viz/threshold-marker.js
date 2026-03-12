import { clamp } from "../core/math.js";
import { clampPointLabelPosition, createSvgEl } from "./svg.js";

function appendThresholdLine(svg, { x, box }) {
  svg.appendChild(
    createSvgEl("line", {
      x1: x,
      y1: box.top,
      x2: x,
      y2: box.top + box.height,
      stroke: "#000",
      "stroke-width": 2,
      "stroke-dasharray": "7 5",
      "data-role": "threshold-line",
      class: "threshold-grab",
    })
  );
}

function appendThresholdHandle(svg, { x, y, attrs = {} }) {
  svg.appendChild(
    createSvgEl("circle", {
      cx: x,
      cy: y,
      r: 12,
      fill: "rgba(120,120,120,0.25)",
      stroke: "#000000",
      "stroke-width": 2,
      "data-role": "threshold-handle",
      class: "threshold-grab",
      ...attrs,
    })
  );
}

function appendThresholdGrabRing(svg, { x, y }) {
  svg.appendChild(
    createSvgEl("circle", {
      cx: x,
      cy: y,
      r: 18,
      fill: "transparent",
      stroke: "none",
      "data-role": "threshold-handle",
      class: "threshold-grab",
    })
  );
}

function appendThresholdLabel(svg, { x, y, text }) {
  svg.appendChild(
    createSvgEl("text", {
      x,
      y,
      class: "legend",
    })
  ).textContent = text;
}

export function drawThresholdMarker({
  svg,
  box,
  minX,
  maxX,
  threshold,
  fmt,
  labelY = null,
  withAccessibility = false,
}) {
  const boundedThreshold = clamp(threshold, minX, maxX);
  const x = box.left + ((boundedThreshold - minX) / (maxX - minX)) * box.width;
  const y = box.top + box.height / 2;
  const labelText = `threshold ${fmt(threshold, 3)}`;
  const labelBaseY = labelY == null ? box.top + 16 : labelY;
  const labelPos = clampPointLabelPosition({
    box,
    x,
    y: labelBaseY,
    dx: 7,
    dy: 0,
    // Approximate text width so we can keep the label inside plot bounds
    // without relying on getBBox (unavailable in some test environments).
    labelWidth: Math.max(88, labelText.length * 6.4),
    padX: 6,
    padTop: 14,
    padBottom: 6,
  });

  appendThresholdLine(svg, { x, box });
  appendThresholdHandle(svg, {
    x,
    y,
    attrs: withAccessibility
      ? {
          tabindex: 0,
          role: "slider",
          "aria-label": "Threshold handle",
          "aria-valuemin": fmt(minX, 3),
          "aria-valuemax": fmt(maxX, 3),
          "aria-valuenow": fmt(threshold, 3),
        }
      : {},
  });
  appendThresholdGrabRing(svg, { x, y });
  appendThresholdLabel(svg, {
    x: labelPos.x,
    y: labelPos.y,
    text: labelText,
  });
}
