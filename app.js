(function () {
  const state = {
    muNeg: 0,
    sdNeg: 1,
    muPos: 2,
    sdPos: 1,
    nPerClass: 500,
    outlierFrac: 0,
    seed: 13,
    threshold: 1,
    showTriangle: true,
    showPower: true,
    showHull: true,
    showGaussian: true,
    rocClickBox: null,
    data: null,
    roc: null,
    metrics: null,
  };

  const ids = {
    preset: document.getElementById("preset"),
    muNeg: document.getElementById("muNeg"),
    sdNeg: document.getElementById("sdNeg"),
    muPos: document.getElementById("muPos"),
    sdPos: document.getElementById("sdPos"),
    nPerClass: document.getElementById("nPerClass"),
    outlierFrac: document.getElementById("outlierFrac"),
    seed: document.getElementById("seed"),
    threshold: document.getElementById("threshold"),
    resample: document.getElementById("resample"),
    showTriangle: document.getElementById("showTriangle"),
    showPower: document.getElementById("showPower"),
    showHull: document.getElementById("showHull"),
    showGaussian: document.getElementById("showGaussian"),
    muNegValue: document.getElementById("muNegValue"),
    sdNegValue: document.getElementById("sdNegValue"),
    muPosValue: document.getElementById("muPosValue"),
    sdPosValue: document.getElementById("sdPosValue"),
    nPerClassValue: document.getElementById("nPerClassValue"),
    outlierFracValue: document.getElementById("outlierFracValue"),
    thresholdValue: document.getElementById("thresholdValue"),
    rocSvg: document.getElementById("rocSvg"),
    distSvg: document.getElementById("distSvg"),
    metricsText: document.getElementById("metricsText"),
  };

  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6d2b79f5;
      let x = Math.imul(t ^ (t >>> 15), 1 | t);
      x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function sampleNormal(rng, mean, sd) {
    let u = 0;
    let v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return mean + sd * z;
  }

  function erf(x) {
    const sign = x < 0 ? -1 : 1;
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const absX = Math.abs(x);
    const t = 1.0 / (1.0 + p * absX);
    const y =
      1.0 -
      (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX));
    return sign * y;
  }

  function normalCdf(x, mean, sd) {
    if (sd <= 0) return x >= mean ? 1 : 0;
    const z = (x - mean) / (sd * Math.sqrt(2));
    return 0.5 * (1 + erf(z));
  }

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  function fmt(num, digits = 4) {
    if (!Number.isFinite(num)) return "NaN";
    return num.toFixed(digits);
  }

  function toNumber(el) {
    return Number(el.value);
  }

  function readControls() {
    state.muNeg = toNumber(ids.muNeg);
    state.sdNeg = toNumber(ids.sdNeg);
    state.muPos = toNumber(ids.muPos);
    state.sdPos = toNumber(ids.sdPos);
    state.nPerClass = Math.round(toNumber(ids.nPerClass));
    state.outlierFrac = toNumber(ids.outlierFrac);
    const seedRaw = Math.round(toNumber(ids.seed));
    state.seed = Number.isFinite(seedRaw) ? Math.max(1, seedRaw) : 1;
    state.showTriangle = ids.showTriangle.checked;
    state.showPower = ids.showPower.checked;
    state.showHull = ids.showHull.checked;
    state.showGaussian = ids.showGaussian.checked;
  }

  function syncControlOutputs() {
    ids.muNegValue.textContent = fmt(state.muNeg, 2);
    ids.sdNegValue.textContent = fmt(state.sdNeg, 2);
    ids.muPosValue.textContent = fmt(state.muPos, 2);
    ids.sdPosValue.textContent = fmt(state.sdPos, 2);
    ids.nPerClassValue.textContent = String(state.nPerClass);
    ids.outlierFracValue.textContent = fmt(state.outlierFrac, 2);
    ids.thresholdValue.textContent = fmt(state.threshold, 3);
    ids.seed.value = String(state.seed);
  }

  function applyPreset(name) {
    const p = {
      overlap: { muNeg: 0, sdNeg: 1, muPos: 0.6, sdPos: 1, outlierFrac: 0.0, nPerClass: 500 },
      separated: { muNeg: 0, sdNeg: 1, muPos: 2.2, sdPos: 1, outlierFrac: 0.0, nPerClass: 500 },
      unequal: { muNeg: 0, sdNeg: 0.8, muPos: 1.6, sdPos: 1.7, outlierFrac: 0.0, nPerClass: 500 },
      kink: { muNeg: 0, sdNeg: 1, muPos: 2.1, sdPos: 0.9, outlierFrac: 0.18, nPerClass: 700 },
    }[name];

    if (!p) return;
    ids.muNeg.value = String(p.muNeg);
    ids.sdNeg.value = String(p.sdNeg);
    ids.muPos.value = String(p.muPos);
    ids.sdPos.value = String(p.sdPos);
    ids.outlierFrac.value = String(p.outlierFrac);
    ids.nPerClass.value = String(p.nPerClass);
    readControls();
    regenerateAndRender();
  }

  function generateData() {
    const rng = mulberry32(state.seed);
    const negatives = [];
    const positives = [];
    const all = [];

    for (let i = 0; i < state.nPerClass; i += 1) {
      const x = sampleNormal(rng, state.muNeg, state.sdNeg);
      negatives.push(x);
      all.push({ score: x, label: 0 });
    }

    for (let i = 0; i < state.nPerClass; i += 1) {
      const fromOutlier = rng() < state.outlierFrac;
      const mu = fromOutlier ? state.muNeg : state.muPos;
      const sd = fromOutlier ? state.sdNeg * 1.15 : state.sdPos;
      const x = sampleNormal(rng, mu, sd);
      positives.push(x);
      all.push({ score: x, label: 1 });
    }

    const stats = all.reduce(
      (acc, d) => {
        acc.min = Math.min(acc.min, d.score);
        acc.max = Math.max(acc.max, d.score);
        return acc;
      },
      { min: Infinity, max: -Infinity }
    );

    state.data = { negatives, positives, all, min: stats.min, max: stats.max };
  }

  function computeRocPoints(all) {
    const sorted = all.slice().sort((a, b) => b.score - a.score);
    const P = sorted.reduce((acc, d) => acc + (d.label === 1 ? 1 : 0), 0);
    const N = sorted.length - P;

    let tp = 0;
    let fp = 0;
    const points = [{ threshold: Infinity, tpr: 0, fpr: 0 }];

    let i = 0;
    while (i < sorted.length) {
      const s = sorted[i].score;
      let j = i;
      while (j < sorted.length && sorted[j].score === s) {
        if (sorted[j].label === 1) tp += 1;
        else fp += 1;
        j += 1;
      }
      points.push({ threshold: s, tpr: tp / P, fpr: fp / N });
      i = j;
    }

    const last = points[points.length - 1];
    if (last.tpr < 1 || last.fpr < 1) {
      points.push({ threshold: -Infinity, tpr: 1, fpr: 1 });
    }

    return points;
  }

  function computeAucTrapezoid(points) {
    let auc = 0;
    for (let i = 1; i < points.length; i += 1) {
      const x0 = points[i - 1].fpr;
      const x1 = points[i].fpr;
      const y0 = points[i - 1].tpr;
      const y1 = points[i].tpr;
      auc += (x1 - x0) * (y0 + y1) * 0.5;
    }
    return auc;
  }

  function computeAucRank(all) {
    const sorted = all.slice().sort((a, b) => a.score - b.score);
    const P = sorted.reduce((acc, d) => acc + (d.label === 1 ? 1 : 0), 0);
    const N = sorted.length - P;

    let rank = 1;
    let sumPosRanks = 0;

    let i = 0;
    while (i < sorted.length) {
      let j = i;
      while (j + 1 < sorted.length && sorted[j + 1].score === sorted[i].score) {
        j += 1;
      }

      const groupCount = j - i + 1;
      const avgRank = (rank + rank + groupCount - 1) / 2;
      for (let k = i; k <= j; k += 1) {
        if (sorted[k].label === 1) sumPosRanks += avgRank;
      }

      rank += groupCount;
      i = j + 1;
    }

    return (sumPosRanks - (P * (P + 1)) / 2) / (P * N);
  }

  function computeOperatingPoint(threshold, all) {
    let tp = 0;
    let fp = 0;
    let tn = 0;
    let fn = 0;

    for (const d of all) {
      const predPos = d.score >= threshold;
      if (predPos && d.label === 1) tp += 1;
      else if (predPos && d.label === 0) fp += 1;
      else if (!predPos && d.label === 0) tn += 1;
      else fn += 1;
    }

    const P = tp + fn;
    const N = tn + fp;
    const tpr = P > 0 ? tp / P : 0;
    const fpr = N > 0 ? fp / N : 0;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;

    return { tp, fp, tn, fn, tpr, fpr, precision };
  }

  function computeTriangleAuc(op) {
    const left = 0.5 * op.fpr * op.tpr;
    const right = 0.5 * (1 - op.fpr) * (op.tpr + 1);
    return left + right;
  }

  function computePowerInterpolation(op, nSamples = 240) {
    const x0 = clamp(op.fpr, 1e-6, 1 - 1e-6);
    const y0 = clamp(op.tpr, 1e-6, 1 - 1e-6);
    const a = Math.log(y0) / Math.log(x0);

    const points = [];
    for (let i = 0; i < nSamples; i += 1) {
      const x = i / (nSamples - 1);
      const y = Math.pow(x, a);
      points.push({ fpr: x, tpr: clamp(y, 0, 1) });
    }

    const auc = a > -1 ? 1 / (a + 1) : NaN;
    return { exponent: a, points, auc };
  }

  function computeConcaveHull(points) {
    const collapsed = [];
    for (const p of points) {
      const prev = collapsed[collapsed.length - 1];
      if (prev && Math.abs(prev.fpr - p.fpr) < 1e-12) {
        if (p.tpr >= prev.tpr) collapsed[collapsed.length - 1] = p;
      } else {
        collapsed.push(p);
      }
    }

    const hull = [];
    for (const p of collapsed) {
      hull.push(p);
      while (hull.length >= 3) {
        const a = hull[hull.length - 3];
        const b = hull[hull.length - 2];
        const c = hull[hull.length - 1];
        const s1 = (b.tpr - a.tpr) / Math.max(1e-12, b.fpr - a.fpr);
        const s2 = (c.tpr - b.tpr) / Math.max(1e-12, c.fpr - b.fpr);
        if (s2 > s1 + 1e-12) {
          hull.splice(hull.length - 2, 1);
        } else {
          break;
        }
      }
    }
    return hull;
  }

  function computeGaussianRoc(n = 260) {
    const points = [];
    const sigmaPad = 4.5 * Math.max(state.sdNeg, state.sdPos);
    const tMin = Math.min(state.muNeg, state.muPos) - sigmaPad;
    const tMax = Math.max(state.muNeg, state.muPos) + sigmaPad;

    for (let i = 0; i < n; i += 1) {
      const u = i / (n - 1);
      const t = tMax - u * (tMax - tMin);
      const fpr = 1 - normalCdf(t, state.muNeg, state.sdNeg);
      const tpr = 1 - normalCdf(t, state.muPos, state.sdPos);
      points.push({ fpr: clamp(fpr, 0, 1), tpr: clamp(tpr, 0, 1) });
    }

    points[0] = { fpr: 0, tpr: 0 };
    points[points.length - 1] = { fpr: 1, tpr: 1 };
    const aucParam = normalCdf(
      (state.muPos - state.muNeg) / Math.sqrt(state.sdPos * state.sdPos + state.sdNeg * state.sdNeg),
      0,
      1
    );

    return { points, aucParam };
  }

  function computeEverything() {
    const rocPoints = computeRocPoints(state.data.all);
    const aucTrap = computeAucTrapezoid(rocPoints);
    const aucRank = computeAucRank(state.data.all);
    const op = computeOperatingPoint(state.threshold, state.data.all);
    const triAuc = computeTriangleAuc(op);
    const power = computePowerInterpolation(op);
    const hullPoints = computeConcaveHull(rocPoints);
    const hullAuc = computeAucTrapezoid(hullPoints);
    const gauss = computeGaussianRoc();

    state.roc = {
      empirical: rocPoints,
      op,
      triangle: [
        { fpr: 0, tpr: 0 },
        { fpr: op.fpr, tpr: op.tpr },
        { fpr: 1, tpr: 1 },
      ],
      power,
      hull: hullPoints,
      gaussian: gauss.points,
    };

    state.metrics = {
      aucTrap,
      aucRank,
      aucAbsDiff: Math.abs(aucTrap - aucRank),
      triAuc,
      powerAuc: power.auc,
      hullAuc,
      gaussAuc: gauss.aucParam,
    };
  }

  function createSvgEl(name, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", name);
    for (const [k, v] of Object.entries(attrs || {})) {
      el.setAttribute(k, String(v));
    }
    return el;
  }

  function clear(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }

  function drawAxes(svg, box, xTicks, yTicks, xLabel, yLabel) {
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

  function linePathFromRoc(points, box) {
    if (!points.length) return "";
    const first = points[0];
    let d = `M ${box.left + first.fpr * box.width} ${box.top + (1 - first.tpr) * box.height}`;
    for (let i = 1; i < points.length; i += 1) {
      const p = points[i];
      const x = box.left + p.fpr * box.width;
      const y = box.top + (1 - p.tpr) * box.height;
      d += ` L ${x} ${y}`;
    }
    return d;
  }

  function addPath(svg, points, box, stroke, width, dash) {
    const path = createSvgEl("path", {
      d: linePathFromRoc(points, box),
      fill: "none",
      stroke,
      "stroke-width": width,
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
    });
    if (dash) path.setAttribute("stroke-dasharray", dash);
    svg.appendChild(path);
  }

  function drawLegend(svg, items) {
    const baseX = 486;
    const baseY = 30;
    const dy = 18;
    items.forEach((item, idx) => {
      const y = baseY + idx * dy;
      svg.appendChild(
        createSvgEl("line", {
          x1: baseX,
          y1: y,
          x2: baseX + 20,
          y2: y,
          stroke: item.color,
          "stroke-width": 3,
          "stroke-dasharray": item.dash || "",
        })
      );
      svg.appendChild(
        createSvgEl("text", {
          x: baseX + 26,
          y: y + 4,
          class: "legend",
        })
      ).textContent = item.label;
    });
  }

  function drawRoc() {
    const svg = ids.rocSvg;
    clear(svg);

    const box = { left: 70, top: 20, width: 640, height: 320 };
    state.rocClickBox = box;
    drawAxes(svg, box, 10, 10, "False Positive Rate", "True Positive Rate");

    addPath(
      svg,
      [
        { fpr: 0, tpr: 0 },
        { fpr: 1, tpr: 1 },
      ],
      box,
      "var(--diag)",
      2,
      "6 6"
    );

    addPath(svg, state.roc.empirical, box, "var(--emp)", 3);

    if (state.showTriangle) {
      addPath(svg, state.roc.triangle, box, "var(--tri)", 2.5, "5 5");
    }

    if (state.showPower) {
      addPath(svg, state.roc.power.points, box, "var(--pow)", 2.5);
    }

    if (state.showHull) {
      addPath(svg, state.roc.hull, box, "var(--hull)", 2.5, "10 4");
    }

    if (state.showGaussian) {
      addPath(svg, state.roc.gaussian, box, "var(--gauss)", 2.5, "3 4");
    }

    const op = state.roc.op;
    const cx = box.left + op.fpr * box.width;
    const cy = box.top + (1 - op.tpr) * box.height;

    svg.appendChild(
      createSvgEl("circle", {
        cx,
        cy,
        r: 6,
        fill: "#ffffff",
        stroke: "#000",
        "stroke-width": 2,
      })
    );

    svg.appendChild(
      createSvgEl("text", {
        x: cx + 10,
        y: cy - 10,
        class: "legend",
      })
    ).textContent = `threshold = ${fmt(state.threshold, 3)}`;

    const legendItems = [
      { label: "Empirical ROC", color: "var(--emp)" },
      { label: "Diagonal baseline", color: "var(--diag)", dash: "6 6" },
    ];
    if (state.showTriangle) legendItems.push({ label: "Triangle interpolation", color: "var(--tri)", dash: "5 5" });
    if (state.showPower) legendItems.push({ label: "Power interpolation", color: "var(--pow)" });
    if (state.showHull) legendItems.push({ label: "Concave hull interpolation", color: "var(--hull)", dash: "10 4" });
    if (state.showGaussian) legendItems.push({ label: "Gaussian model ROC", color: "var(--gauss)", dash: "3 4" });
    drawLegend(svg, legendItems);
  }

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

  function drawDist() {
    const svg = ids.distSvg;
    clear(svg);

    const box = { left: 70, top: 16, width: 640, height: 240 };
    const data = state.data;
    const span = data.max - data.min;
    const minX = data.min - 0.05 * span;
    const maxX = data.max + 0.05 * span;
    const bins = 34;

    const hNeg = histogram(data.negatives, bins, minX, maxX);
    const hPos = histogram(data.positives, bins, minX, maxX);
    const yMax = Math.max(...hNeg, ...hPos, 1);

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
      axis.appendChild(
        createSvgEl("text", {
          x,
          y: box.top + box.height + 18,
          class: "tick",
          "text-anchor": "middle",
        })
      ).textContent = fmt(val, 2);
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
      axis.appendChild(
        createSvgEl("text", {
          x: box.left - 10,
          y: y + 4,
          class: "tick",
          "text-anchor": "end",
        })
      ).textContent = String(Math.round((i / 5) * yMax));
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

    const threshold = clamp(state.threshold, minX, maxX);
    const tx = box.left + ((threshold - minX) / (maxX - minX)) * box.width;
    svg.appendChild(
      createSvgEl("line", {
        x1: tx,
        y1: box.top,
        x2: tx,
        y2: box.top + box.height,
        stroke: "#000",
        "stroke-width": 2,
        "stroke-dasharray": "7 5",
      })
    );

    svg.appendChild(
      createSvgEl("text", {
        x: tx + 7,
        y: box.top + 16,
        class: "legend",
      })
    ).textContent = `threshold ${fmt(state.threshold, 3)}`;

    svg.appendChild(
      createSvgEl("text", {
        x: box.left,
        y: box.top + box.height + 46,
        class: "axis-label",
      })
    ).textContent = "Score (single variable)";

    svg.appendChild(
      createSvgEl("text", {
        x: box.left + box.width - 180,
        y: box.top + 16,
        class: "legend",
      })
    ).textContent = "orange = negative class";

    svg.appendChild(
      createSvgEl("text", {
        x: box.left + box.width - 180,
        y: box.top + 34,
        class: "legend",
      })
    ).textContent = "blue = positive class";
  }

  function nearestFiniteThreshold(rocPoints, fprTarget, tprTarget) {
    let best = null;
    let bestDist = Infinity;

    for (const p of rocPoints) {
      if (!Number.isFinite(p.threshold)) continue;
      const dx = p.fpr - fprTarget;
      const dy = p.tpr - tprTarget;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist) {
        bestDist = d2;
        best = p;
      }
    }

    return best;
  }

  function updateThresholdRange() {
    const data = state.data;
    const span = Math.max(1e-6, data.max - data.min);
    const minT = data.min - 0.08 * span;
    const maxT = data.max + 0.08 * span;
    ids.threshold.min = String(minT);
    ids.threshold.max = String(maxT);
    ids.threshold.step = String(span / 1000);

    if (state.threshold < minT || state.threshold > maxT) {
      state.threshold = (minT + maxT) / 2;
      ids.threshold.value = String(state.threshold);
    }
  }

  function renderMetrics() {
    const op = state.roc.op;
    const m = state.metrics;
    const pass = m.aucAbsDiff < 1e-10 ? "PASS" : "CHECK";

    ids.metricsText.textContent = [
      `Threshold               ${fmt(state.threshold, 4)}`,
      `TPR, FPR                ${fmt(op.tpr, 4)}, ${fmt(op.fpr, 4)}`,
      `Precision               ${fmt(op.precision, 4)}`,
      `TP, FP, TN, FN          ${op.tp}, ${op.fp}, ${op.tn}, ${op.fn}`,
      "",
      `AUC empirical (trap)    ${fmt(m.aucTrap, 6)}`,
      `AUC empirical (rank)    ${fmt(m.aucRank, 6)}`,
      `|difference|            ${fmt(m.aucAbsDiff, 12)}  ${pass}`,
      "",
      `AUC triangle            ${fmt(m.triAuc, 6)}`,
      `AUC power interpolation ${fmt(m.powerAuc, 6)}`,
      `AUC concave hull        ${fmt(m.hullAuc, 6)}`,
      `AUC Gaussian model      ${fmt(m.gaussAuc, 6)}`,
      "",
      "Interpretation: triangle is simple but usually too coarse.",
      "Concave hull is safer (data-driven). Gaussian model is smooth if the normal assumption is reasonable.",
      state.outlierFrac > 0 ? "Note: outliers violate the strict Gaussian assumption, so Gaussian AUC is only a reference." : "",
    ].join("\n");
  }

  function renderAll() {
    computeEverything();
    syncControlOutputs();
    drawRoc();
    drawDist();
    renderMetrics();
  }

  function regenerateAndRender() {
    readControls();
    generateData();
    updateThresholdRange();
    renderAll();
  }

  function initHandlers() {
    const regenerateIds = [
      ids.muNeg,
      ids.sdNeg,
      ids.muPos,
      ids.sdPos,
      ids.nPerClass,
      ids.outlierFrac,
      ids.seed,
    ];

    regenerateIds.forEach((el) => {
      el.addEventListener("input", () => {
        readControls();
        regenerateAndRender();
      });
      el.addEventListener("change", () => {
        readControls();
        regenerateAndRender();
      });
    });

    ids.threshold.addEventListener("input", () => {
      state.threshold = toNumber(ids.threshold);
      renderAll();
    });

    [ids.showTriangle, ids.showPower, ids.showHull, ids.showGaussian].forEach((el) => {
      el.addEventListener("change", () => {
        readControls();
        renderAll();
      });
    });

    ids.resample.addEventListener("click", () => {
      state.seed += 1;
      ids.seed.value = String(state.seed);
      regenerateAndRender();
    });

    ids.preset.addEventListener("change", (e) => {
      applyPreset(e.target.value);
    });

    ids.rocSvg.addEventListener("click", (evt) => {
      const box = state.rocClickBox;
      if (!box) return;

      const rect = ids.rocSvg.getBoundingClientRect();
      const xPx = evt.clientX - rect.left;
      const yPx = evt.clientY - rect.top;

      const x = (xPx / rect.width) * 760;
      const y = (yPx / rect.height) * 420;

      const fpr = clamp((x - box.left) / box.width, 0, 1);
      const tpr = clamp(1 - (y - box.top) / box.height, 0, 1);

      const nearest = nearestFiniteThreshold(state.roc.empirical, fpr, tpr);
      if (!nearest) return;

      state.threshold = nearest.threshold;
      ids.threshold.value = String(state.threshold);
      renderAll();
    });
  }

  function init() {
    readControls();
    syncControlOutputs();
    initHandlers();
    regenerateAndRender();
  }

  init();
})();
