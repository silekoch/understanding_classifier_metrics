export function createSvgEl(name, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [k, v] of Object.entries(attrs || {})) {
    el.setAttribute(k, String(v));
  }
  return el;
}

export function clear(svg) {
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
}

export function drawAxes(svg, box, xTicks, yTicks, xLabel, yLabel) {
  const axis = createSvgEl("g", {});

  for (let i = 0; i <= xTicks; i += 1) {
    const x = box.left + (i / xTicks) * box.width;
    axis.appendChild(
      createSvgEl("line", {
        x1: x,
        y1: box.top,
        x2: x,
        y2: box.top + box.height,
        stroke: "rgba(0,0,0,0.08)",
        "stroke-width": 1,
      })
    );
    axis.appendChild(
      createSvgEl("text", {
        x,
        y: box.top + box.height + 20,
        class: "tick",
        "text-anchor": "middle",
      })
    ).textContent = (i / xTicks).toFixed(1);
  }

  for (let i = 0; i <= yTicks; i += 1) {
    const y = box.top + box.height - (i / yTicks) * box.height;
    axis.appendChild(
      createSvgEl("line", {
        x1: box.left,
        y1: y,
        x2: box.left + box.width,
        y2: y,
        stroke: "rgba(0,0,0,0.08)",
        "stroke-width": 1,
      })
    );
    axis.appendChild(
      createSvgEl("text", {
        x: box.left - 12,
        y: y + 4,
        class: "tick",
        "text-anchor": "end",
      })
    ).textContent = (i / yTicks).toFixed(1);
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

  axis.appendChild(
    createSvgEl("text", {
      x: box.left + box.width / 2,
      y: box.top + box.height + 42,
      class: "axis-label",
      "text-anchor": "middle",
    })
  ).textContent = xLabel;

  const yLab = createSvgEl("text", {
    x: box.left - 52,
    y: box.top + box.height / 2,
    class: "axis-label",
    "text-anchor": "middle",
    transform: `rotate(-90 ${box.left - 52} ${box.top + box.height / 2})`,
  });
  yLab.textContent = yLabel;
  axis.appendChild(yLab);

  svg.appendChild(axis);
}

export function linePathFromUnitPoints(points, box, xKey, yKey) {
  if (!points.length) {
    return "";
  }
  const first = points[0];
  let d = `M ${box.left + first[xKey] * box.width} ${box.top + (1 - first[yKey]) * box.height}`;
  for (let i = 1; i < points.length; i += 1) {
    const p = points[i];
    const x = box.left + p[xKey] * box.width;
    const y = box.top + (1 - p[yKey]) * box.height;
    d += ` L ${x} ${y}`;
  }
  return d;
}

export function addPath(svg, points, box, stroke, width, dash, xKey = "fpr", yKey = "tpr") {
  const path = createSvgEl("path", {
    d: linePathFromUnitPoints(points, box, xKey, yKey),
    fill: "none",
    stroke,
    "stroke-width": width,
    "stroke-linejoin": "round",
    "stroke-linecap": "round",
  });
  if (dash) {
    path.setAttribute("stroke-dasharray", dash);
  }
  svg.appendChild(path);
  return path;
}

export function getSvgViewSize(svg, fallbackW = 760, fallbackH = 420) {
  const vb = svg && svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : null;
  if (vb && vb.width > 0 && vb.height > 0) {
    return { width: vb.width, height: vb.height };
  }
  return { width: fallbackW, height: fallbackH };
}

export function eventToSvgCoordinates(evt, svg, fallbackW = 760, fallbackH = 420) {
  const rect = svg.getBoundingClientRect();
  const view = getSvgViewSize(svg, fallbackW, fallbackH);
  return {
    x: ((evt.clientX - rect.left) / rect.width) * view.width,
    y: ((evt.clientY - rect.top) / rect.height) * view.height,
  };
}

export function computeCurveLayout(svg, mode = "single") {
  const view = getSvgViewSize(svg);
  const cfg =
    mode === "two-up"
      ? {
          padTop: 22,
          padRight: 48,
          padBottom: 64,
          padLeft: 48,
          legendPad: 12,
          legendRow: 19,
          legendLine: 20,
          strokeMain: 3.6,
          strokeAux: 2.6,
          pointRadius: 7,
          pointStroke: 2.2,
        }
      : {
          padTop: 20,
          padRight: 200,
          padBottom: 58,
          padLeft: 70,
          legendPad: 10,
          legendRow: 18,
          legendLine: 20,
          strokeMain: 3,
          strokeAux: 2,
          pointRadius: 6,
          pointStroke: 2,
        };

  const availW = Math.max(20, view.width - cfg.padLeft - cfg.padRight);
  const availH = Math.max(20, view.height - cfg.padTop - cfg.padBottom);
  const side = Math.min(availW, availH);
  const box = {
    left: cfg.padLeft + (availW - side) / 2,
    top: cfg.padTop + (availH - side) / 2,
    width: side,
    height: side,
  };

  return { view, box, cfg };
}

function setLegendKey(el, key) {
  if (!key) {
    return;
  }
  el.setAttribute("data-legend-key", key);
}

function legendOpacity(item) {
  return item.opacity == null ? 1 : item.opacity;
}

function createLegendLine({ x1, x2, y, item }) {
  const el = createSvgEl("line", {
    x1,
    y1: y,
    x2,
    y2: y,
    stroke: item.color,
    "stroke-width": item.width || 3,
    "stroke-dasharray": item.dash || "",
    opacity: legendOpacity(item),
  });
  setLegendKey(el, item.key);
  return el;
}

function createLegendText({ x, y, item, textAnchor }) {
  const attrs = {
    x,
    y: y + 4,
    class: "legend",
    opacity: legendOpacity(item),
  };
  if (textAnchor) {
    attrs["text-anchor"] = textAnchor;
  }
  const el = createSvgEl("text", attrs);
  setLegendKey(el, item.key);
  el.textContent = item.label;
  return el;
}

function drawLegendItemInsideRight(svg, { box, pad, lineLen, item, y }) {
  const x2 = box.left + box.width - pad;
  const x1 = x2 - lineLen;
  svg.appendChild(createLegendLine({ x1, x2, y, item }));
  svg.appendChild(createLegendText({ x: x1 - 6, y, item, textAnchor: "end" }));
}

function drawLegendItemInsideLeft(svg, { box, pad, lineLen, item, y }) {
  const x1 = box.left + pad;
  const x2 = x1 + lineLen;
  svg.appendChild(createLegendLine({ x1, x2, y, item }));
  svg.appendChild(createLegendText({ x: x2 + 6, y, item }));
}

function drawLegendItemOutsideRight(svg, { box, lineLen, item, y }) {
  const x1 = box.left + box.width + 12;
  const x2 = x1 + lineLen;
  svg.appendChild(createLegendLine({ x1, x2, y, item }));
  svg.appendChild(createLegendText({ x: x2 + 6, y, item }));
}

export function drawLegend(svg, items, box, cfg, anchor = "outside-right") {
  const row = cfg.legendRow || 18;
  const lineLen = cfg.legendLine || 20;
  const pad = cfg.legendPad || 10;
  const startY = box.top + box.height - pad - (items.length - 1) * row;

  const drawItem =
    anchor === "inside-right"
      ? drawLegendItemInsideRight
      : anchor === "inside-left"
        ? drawLegendItemInsideLeft
        : drawLegendItemOutsideRight;

  for (let idx = 0; idx < items.length; idx += 1) {
    drawItem(svg, {
      box,
      pad,
      lineLen,
      item: items[idx],
      y: startY + idx * row,
    });
  }
}
