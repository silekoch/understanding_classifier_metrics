import { PRESETS } from "./presets.js";

(function () {
  const state = {
    preset: "separated",
    muNeg: 0,
    sdNeg: 1,
    muPos: 2,
    sdPos: 1,
    logSigma: 0.7,
    dfNeg: 3,
    dfPos: 3,
    mixWeight: 0.24,
    mixOffset: 0.15,
    mixSdMult: 1.1,
    p0Neg: 0.42,
    p0Pos: 0.12,
    zeroValue: 0,
    alphaNeg: 2.0,
    betaNeg: 8.0,
    alphaPos: 8.0,
    betaPos: 2.0,
    epsPos: 0.12,
    epsNeg: 0.08,
    confSharpness: 14.0,
    samplePosFrac: 0.5,
    nPerClass: 500,
    outlierFrac: 0,
    seed: 13,
    threshold: 1,
    rocClickBox: null,
    prClickBox: null,
    metricTrendBox: null,
    metricTrendHoverKey: null,
    distView: null,
    draggingThreshold: false,
    draggingMetricThreshold: false,
    urlSyncTimer: null,
    data: null,
    roc: null,
    pr: null,
    metricCurves: null,
  };

  const ids = {
    preset: document.getElementById("preset"),
    muNeg: document.getElementById("muNeg"),
    sdNeg: document.getElementById("sdNeg"),
    muPos: document.getElementById("muPos"),
    sdPos: document.getElementById("sdPos"),
    nPerClass: document.getElementById("nPerClass"),
    samplePosFrac: document.getElementById("samplePosFrac"),
    outlierFrac: document.getElementById("outlierFrac"),
    seed: document.getElementById("seed"),
    resample: document.getElementById("resample"),
    advancedDetails: document.getElementById("advancedDetails"),
    locationScaleGrid: document.getElementById("locationScaleGrid"),
    muNegLabel: document.getElementById("muNegLabel"),
    sdNegLabel: document.getElementById("sdNegLabel"),
    muPosLabel: document.getElementById("muPosLabel"),
    sdPosLabel: document.getElementById("sdPosLabel"),
    shapeNormal: document.getElementById("shapeNormal"),
    shapeLognormal: document.getElementById("shapeLognormal"),
    shapeStudent: document.getElementById("shapeStudent"),
    shapeMixture: document.getElementById("shapeMixture"),
    shapeZeroInflated: document.getElementById("shapeZeroInflated"),
    shapeBeta: document.getElementById("shapeBeta"),
    shapeBetaConf: document.getElementById("shapeBetaConf"),
    muNegValue: document.getElementById("muNegValue"),
    sdNegValue: document.getElementById("sdNegValue"),
    muPosValue: document.getElementById("muPosValue"),
    sdPosValue: document.getElementById("sdPosValue"),
    logSigma: document.getElementById("logSigma"),
    logSigmaValue: document.getElementById("logSigmaValue"),
    dfNeg: document.getElementById("dfNeg"),
    dfNegValue: document.getElementById("dfNegValue"),
    dfPos: document.getElementById("dfPos"),
    dfPosValue: document.getElementById("dfPosValue"),
    mixWeight: document.getElementById("mixWeight"),
    mixWeightValue: document.getElementById("mixWeightValue"),
    mixOffset: document.getElementById("mixOffset"),
    mixOffsetValue: document.getElementById("mixOffsetValue"),
    mixSdMult: document.getElementById("mixSdMult"),
    mixSdMultValue: document.getElementById("mixSdMultValue"),
    p0Neg: document.getElementById("p0Neg"),
    p0NegValue: document.getElementById("p0NegValue"),
    p0Pos: document.getElementById("p0Pos"),
    p0PosValue: document.getElementById("p0PosValue"),
    zeroValue: document.getElementById("zeroValue"),
    zeroValueOut: document.getElementById("zeroValueOut"),
    alphaNeg: document.getElementById("alphaNeg"),
    alphaNegValue: document.getElementById("alphaNegValue"),
    betaNeg: document.getElementById("betaNeg"),
    betaNegValue: document.getElementById("betaNegValue"),
    alphaPos: document.getElementById("alphaPos"),
    alphaPosValue: document.getElementById("alphaPosValue"),
    betaPos: document.getElementById("betaPos"),
    betaPosValue: document.getElementById("betaPosValue"),
    epsPos: document.getElementById("epsPos"),
    epsPosValue: document.getElementById("epsPosValue"),
    epsNeg: document.getElementById("epsNeg"),
    epsNegValue: document.getElementById("epsNegValue"),
    confSharpness: document.getElementById("confSharpness"),
    confSharpnessValue: document.getElementById("confSharpnessValue"),
    nPerClassValue: document.getElementById("nPerClassValue"),
    samplePosFracValue: document.getElementById("samplePosFracValue"),
    outlierFracValue: document.getElementById("outlierFracValue"),
    presetDesc: document.getElementById("presetDesc"),
    rocSvg: document.getElementById("rocSvg"),
    prSvg: document.getElementById("prSvg"),
    distSvg: document.getElementById("distSvg"),
    confusionSvg: document.getElementById("confusionSvg"),
    metricsText: document.getElementById("metricsText"),
    metricTrendSvg: document.getElementById("metricTrendSvg"),
  };

  const URL_NUM_KEYS = [
    "muNeg",
    "sdNeg",
    "muPos",
    "sdPos",
    "logSigma",
    "dfNeg",
    "dfPos",
    "mixWeight",
    "mixOffset",
    "mixSdMult",
    "p0Neg",
    "p0Pos",
    "zeroValue",
    "alphaNeg",
    "betaNeg",
    "alphaPos",
    "betaPos",
    "epsPos",
    "epsNeg",
    "confSharpness",
    "nPerClass",
    "samplePosFrac",
    "outlierFrac",
    "seed",
    "threshold",
  ];

  const URL_BOOL_KEYS = [];

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

  function fmtPct(value, digits = 1) {
    return `${fmt(value * 100, digits)}%`;
  }

  function toNumber(el) {
    return Number(el.value);
  }

  function readControls() {
    state.preset = ids.preset.value;
    state.muNeg = toNumber(ids.muNeg);
    state.sdNeg = toNumber(ids.sdNeg);
    state.muPos = toNumber(ids.muPos);
    state.sdPos = toNumber(ids.sdPos);
    state.logSigma = toNumber(ids.logSigma);
    state.dfNeg = Math.max(3, Math.round(toNumber(ids.dfNeg)));
    state.dfPos = Math.max(3, Math.round(toNumber(ids.dfPos)));
    state.mixWeight = toNumber(ids.mixWeight);
    state.mixOffset = toNumber(ids.mixOffset);
    state.mixSdMult = toNumber(ids.mixSdMult);
    state.p0Neg = toNumber(ids.p0Neg);
    state.p0Pos = toNumber(ids.p0Pos);
    state.zeroValue = toNumber(ids.zeroValue);
    state.alphaNeg = toNumber(ids.alphaNeg);
    state.betaNeg = toNumber(ids.betaNeg);
    state.alphaPos = toNumber(ids.alphaPos);
    state.betaPos = toNumber(ids.betaPos);
    state.epsPos = toNumber(ids.epsPos);
    state.epsNeg = toNumber(ids.epsNeg);
    state.confSharpness = toNumber(ids.confSharpness);
    state.nPerClass = Math.round(toNumber(ids.nPerClass));
    state.samplePosFrac = toNumber(ids.samplePosFrac);
    state.outlierFrac = toNumber(ids.outlierFrac);
    const seedRaw = Math.round(toNumber(ids.seed));
    state.seed = Number.isFinite(seedRaw) ? Math.max(1, seedRaw) : 1;
  }

  function setHidden(el, hidden) {
    if (!el) return;
    el.style.display = hidden ? "none" : "";
  }

  function updateConditionalParameterUI(preset) {
    const mode = preset.mode || "normal";
    const isNormal = mode === "normal";
    const isBeta = mode === "beta";
    const isBetaConf = mode === "beta_conf_mixture";
    const hideLoc = isBeta || isBetaConf;
    ids.muNegLabel.textContent = isNormal ? "Negative mean" : "Negative location";
    ids.sdNegLabel.textContent = isNormal ? "Negative sd" : "Negative scale";
    ids.muPosLabel.textContent = isNormal ? "Positive mean" : "Positive location";
    ids.sdPosLabel.textContent = isNormal ? "Positive sd" : "Positive scale";
    setHidden(ids.locationScaleGrid, hideLoc);

    setHidden(ids.shapeNormal, mode !== "normal");
    setHidden(ids.shapeLognormal, mode !== "lognormal");
    setHidden(ids.shapeStudent, mode !== "student_t");
    setHidden(ids.shapeMixture, mode !== "mixture_pos");
    setHidden(ids.shapeZeroInflated, mode !== "zero_inflated");
    setHidden(ids.shapeBeta, mode !== "beta");
    setHidden(ids.shapeBetaConf, mode !== "beta_conf_mixture");
  }

  function syncControlOutputs() {
    const preset = PRESETS[state.preset] || PRESETS.separated;
    const outlierEnabled = preset.mode === "normal";
    const betaMode = preset.mode === "beta";
    const betaConfMode = preset.mode === "beta_conf_mixture";
    ids.muNegValue.textContent = fmt(state.muNeg, 2);
    ids.sdNegValue.textContent = fmt(state.sdNeg, 2);
    ids.muPosValue.textContent = fmt(state.muPos, 2);
    ids.sdPosValue.textContent = fmt(state.sdPos, 2);
    ids.logSigmaValue.textContent = fmt(state.logSigma, 2);
    ids.dfNegValue.textContent = String(state.dfNeg);
    ids.dfPosValue.textContent = String(state.dfPos);
    ids.mixWeightValue.textContent = fmt(state.mixWeight, 2);
    ids.mixOffsetValue.textContent = fmt(state.mixOffset, 2);
    ids.mixSdMultValue.textContent = fmt(state.mixSdMult, 2);
    ids.p0NegValue.textContent = fmt(state.p0Neg, 2);
    ids.p0PosValue.textContent = fmt(state.p0Pos, 2);
    ids.zeroValueOut.textContent = fmt(state.zeroValue, 2);
    ids.alphaNegValue.textContent = fmt(state.alphaNeg, 2);
    ids.betaNegValue.textContent = fmt(state.betaNeg, 2);
    ids.alphaPosValue.textContent = fmt(state.alphaPos, 2);
    ids.betaPosValue.textContent = fmt(state.betaPos, 2);
    ids.epsPosValue.textContent = fmtPct(state.epsPos, 1);
    ids.epsNegValue.textContent = fmtPct(state.epsNeg, 1);
    ids.confSharpnessValue.textContent = fmt(state.confSharpness, 1);
    ids.nPerClassValue.textContent = String(2 * state.nPerClass);
    ids.samplePosFracValue.textContent = fmtPct(state.samplePosFrac, 1);
    ids.outlierFracValue.textContent = outlierEnabled ? fmt(state.outlierFrac, 2) : `${fmt(state.outlierFrac, 2)} (normal only)`;
    ids.outlierFrac.disabled = !outlierEnabled;
    ids.seed.value = String(state.seed);
    ids.presetDesc.textContent = preset.desc || "";
    updateConditionalParameterUI(preset);

  }

  function applyPresetValues(name) {
    const p = PRESETS[name];
    const keys = [
      "muNeg",
      "sdNeg",
      "muPos",
      "sdPos",
      "logSigma",
      "dfNeg",
      "dfPos",
      "mixWeight",
      "mixOffset",
      "mixSdMult",
      "p0Neg",
      "p0Pos",
      "zeroValue",
      "alphaNeg",
      "betaNeg",
      "alphaPos",
      "betaPos",
      "epsPos",
      "epsNeg",
      "confSharpness",
      "outlierFrac",
      "nPerClass",
      "samplePosFrac",
    ];
    if (!p) return;
    ids.preset.value = name;
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(p, key) && ids[key]) {
        ids[key].value = String(p[key]);
      }
    }
  }

  function applyPreset(name) {
    applyPresetValues(name);
    readControls();
    regenerateAndRender();
  }

  function getActivePreset() {
    return PRESETS[state.preset] || PRESETS.separated;
  }

  function sampleStudentTStd(rng, df) {
    const dof = Math.max(3, Math.round(df));
    const z = sampleNormal(rng, 0, 1);
    let chi2 = 0;
    for (let i = 0; i < dof; i += 1) {
      const g = sampleNormal(rng, 0, 1);
      chi2 += g * g;
    }
    const t = z / Math.sqrt(Math.max(1e-12, chi2 / dof));
    return t / Math.sqrt(dof / (dof - 2));
  }

  function sampleGamma(rng, shape) {
    const k = Math.max(0.05, shape);
    if (k < 1) {
      const u = clamp(rng(), 1e-12, 1 - 1e-12);
      return sampleGamma(rng, k + 1) * Math.pow(u, 1 / k);
    }

    const d = k - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
      const x = sampleNormal(rng, 0, 1);
      let v = 1 + c * x;
      if (v <= 0) continue;
      v = v * v * v;
      const u = clamp(rng(), 1e-12, 1 - 1e-12);
      if (u < 1 - 0.0331 * Math.pow(x, 4)) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }

  function sampleBeta(rng, alpha, beta) {
    const a = Math.max(0.05, alpha);
    const b = Math.max(0.05, beta);
    const x = sampleGamma(rng, a);
    const y = sampleGamma(rng, b);
    const denom = x + y;
    if (denom <= 0) return 0.5;
    return clamp(x / denom, 0, 1);
  }

  function betaByMeanAndKappa(mean, kappa) {
    const m = clamp(mean, 0.001, 0.999);
    const k = Math.max(0.1, kappa);
    return {
      alpha: Math.max(0.05, m * k),
      beta: Math.max(0.05, (1 - m) * k),
    };
  }

  function sampleStandardized(mode, rng, label) {
    if (mode === "lognormal") {
      const sigma = Math.max(0.05, state.logSigma);
      const y = Math.exp(sampleNormal(rng, -0.5 * sigma * sigma, sigma));
      return (y - 1) / Math.sqrt(Math.exp(sigma * sigma) - 1);
    }
    if (mode === "student_t") {
      const df = label === 1 ? state.dfPos : state.dfNeg;
      return sampleStudentTStd(rng, df);
    }
    if (mode === "uniform") {
      return (rng() * 2 - 1) * Math.sqrt(3);
    }
    if (mode === "exponential") {
      const u = clamp(rng(), 1e-12, 1 - 1e-12);
      return -Math.log(1 - u) - 1;
    }
    return sampleNormal(rng, 0, 1);
  }

  function sampleScoreByPreset(rng, label, preset) {
    const mode = preset.mode || "normal";
    const mu = label === 1 ? state.muPos : state.muNeg;
    const sd = Math.max(1e-6, label === 1 ? state.sdPos : state.sdNeg);

    if (mode === "normal") {
      if (label === 1 && state.outlierFrac > 0 && rng() < state.outlierFrac) {
        return sampleNormal(rng, state.muNeg, Math.max(1e-6, state.sdNeg * 1.15));
      }
      return sampleNormal(rng, mu, sd);
    }

    if (mode === "mixture_pos") {
      if (label === 0) return sampleNormal(rng, state.muNeg, Math.max(1e-6, state.sdNeg));
      const w = clamp(state.mixWeight, 0, 0.98);
      if (rng() < w) {
        const offset = state.mixOffset;
        const spread = Math.max(1e-6, state.mixSdMult * state.sdNeg);
        return sampleNormal(rng, state.muNeg + offset * state.sdNeg, spread);
      }
      return sampleNormal(rng, state.muPos, Math.max(1e-6, state.sdPos));
    }

    if (mode === "zero_inflated") {
      const p0 = clamp(label === 1 ? state.p0Pos : state.p0Neg, 0, 0.99);
      if (rng() < p0) return state.zeroValue;
      return sampleNormal(rng, mu, sd);
    }

    if (mode === "beta") {
      const alpha = label === 1 ? state.alphaPos : state.alphaNeg;
      const beta = label === 1 ? state.betaPos : state.betaNeg;
      return sampleBeta(rng, alpha, beta);
    }

    if (mode === "beta_conf_mixture") {
      const kappa = Math.max(2, state.confSharpness);
      const hi = betaByMeanAndKappa(0.96, kappa);
      const lo = betaByMeanAndKappa(0.04, kappa);

      if (label === 1) {
        const eps = clamp(state.epsPos, 0, 0.49);
        if (rng() < eps) return sampleBeta(rng, lo.alpha, lo.beta);
        return sampleBeta(rng, hi.alpha, hi.beta);
      }

      const eps = clamp(state.epsNeg, 0, 0.49);
      if (rng() < eps) return sampleBeta(rng, hi.alpha, hi.beta);
      return sampleBeta(rng, lo.alpha, lo.beta);
    }

    const z = sampleStandardized(mode, rng, label);
    return mu + sd * z;
  }

  function meanSd(values) {
    const n = values.length;
    if (!n) return { mean: 0, sd: 0 };
    let sum = 0;
    for (const v of values) sum += v;
    const mean = sum / n;
    let ss = 0;
    for (const v of values) {
      const d = v - mean;
      ss += d * d;
    }
    return { mean, sd: Math.sqrt(ss / n) };
  }

  function generateData() {
    const rng = mulberry32(state.seed);
    const preset = getActivePreset();
    const totalSamples = Math.max(2, 2 * state.nPerClass);
    const fracPos = clamp(state.samplePosFrac, 0.02, 0.98);
    const nPos = clamp(Math.round(totalSamples * fracPos), 1, totalSamples - 1);
    const nNeg = totalSamples - nPos;
    const negatives = [];
    const positives = [];
    const all = [];

    for (let i = 0; i < nNeg; i += 1) {
      const x = sampleScoreByPreset(rng, 0, preset);
      negatives.push(x);
      all.push({ score: x, label: 0 });
    }

    for (let i = 0; i < nPos; i += 1) {
      const x = sampleScoreByPreset(rng, 1, preset);
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

    const negStats = meanSd(negatives);
    const posStats = meanSd(positives);
    state.data = {
      negatives,
      positives,
      all,
      min: stats.min,
      max: stats.max,
      negMean: negStats.mean,
      negSd: negStats.sd,
      posMean: posStats.mean,
      posSd: posStats.sd,
      nNeg,
      nPos,
      samplePrevalence: nPos / (nNeg + nPos),
    };
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

  function computePrPoints(all) {
    const sorted = all.slice().sort((a, b) => b.score - a.score);
    const P = sorted.reduce((acc, d) => acc + (d.label === 1 ? 1 : 0), 0);
    const N = sorted.length - P;

    let tp = 0;
    let fp = 0;
    const points = [{ threshold: Infinity, recall: 0, precision: 1 }];

    let i = 0;
    while (i < sorted.length) {
      const s = sorted[i].score;
      let j = i;
      while (j < sorted.length && sorted[j].score === s) {
        if (sorted[j].label === 1) tp += 1;
        else fp += 1;
        j += 1;
      }

      const recall = P > 0 ? tp / P : 0;
      const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
      points.push({ threshold: s, recall, precision });
      i = j;
    }

    const last = points[points.length - 1];
    const prevalence = P + N > 0 ? P / (P + N) : 0;
    if (last.recall < 1) {
      points.push({ threshold: -Infinity, recall: 1, precision: prevalence });
    }
    return { points, prevalence };
  }

  function computeApTrapezoid(prPoints) {
    let ap = 0;
    for (let i = 1; i < prPoints.length; i += 1) {
      const x0 = prPoints[i - 1].recall;
      const x1 = prPoints[i].recall;
      const y0 = prPoints[i - 1].precision;
      const y1 = prPoints[i].precision;
      ap += Math.max(0, x1 - x0) * (y0 + y1) * 0.5;
    }
    return clamp(ap, 0, 1);
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
    const recall = tpr;
    const specificity = N > 0 ? tn / N : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const accuracy = P + N > 0 ? (tp + tn) / (P + N) : 0;
    const mccDen = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
    const mcc = mccDen > 0 ? (tp * tn - fp * fn) / mccDen : 0;

    return { tp, fp, tn, fn, tpr, fpr, precision, recall, specificity, f1, accuracy, mcc, P, N };
  }

  function computeMetricCurves(all, minThreshold, maxThreshold, sampleCount = 180) {
    const curves = {
      recall: [],
      precision: [],
      specificity: [],
      f1: [],
      mcc: [],
      accuracy: [],
    };
    if (!all || !all.length) return curves;

    const minT = Number.isFinite(minThreshold) ? minThreshold : Math.min(...all.map((d) => d.score));
    const maxT = Number.isFinite(maxThreshold) ? maxThreshold : Math.max(...all.map((d) => d.score));
    const span = Math.max(1e-9, maxT - minT);
    const steps = Math.max(20, Math.round(sampleCount));

    for (let i = 0; i <= steps; i += 1) {
      const u = i / steps;
      const threshold = minT + u * span;
      const op = computeOperatingPoint(threshold, all);
      curves.recall.push({ u, v: op.tpr });
      curves.precision.push({ u, v: op.precision });
      curves.specificity.push({ u, v: op.specificity });
      curves.f1.push({ u, v: op.f1 });
      curves.mcc.push({ u, v: op.mcc });
      curves.accuracy.push({ u, v: op.accuracy });
    }

    return curves;
  }

  function computeEverything() {
    const rocPoints = computeRocPoints(state.data.all);
    const pr = computePrPoints(state.data.all);
    const op = computeOperatingPoint(state.threshold, state.data.all);

    state.roc = {
      empirical: rocPoints,
      op,
    };

    state.pr = {
      points: pr.points,
      prevalence: pr.prevalence,
      op: { recall: op.recall, precision: op.precision },
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

  function linePathFromUnitPoints(points, box, xKey, yKey) {
    if (!points.length) return "";
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

  function addPath(svg, points, box, stroke, width, dash, xKey = "fpr", yKey = "tpr") {
    const path = createSvgEl("path", {
      d: linePathFromUnitPoints(points, box, xKey, yKey),
      fill: "none",
      stroke,
      "stroke-width": width,
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
    });
    if (dash) path.setAttribute("stroke-dasharray", dash);
    svg.appendChild(path);
    return path;
  }

  function getSvgViewSize(svg, fallbackW = 760, fallbackH = 420) {
    const vb = svg && svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : null;
    if (vb && vb.width > 0 && vb.height > 0) {
      return { width: vb.width, height: vb.height };
    }
    return { width: fallbackW, height: fallbackH };
  }

  function eventToSvgCoordinates(evt, svg, fallbackW = 760, fallbackH = 420) {
    const rect = svg.getBoundingClientRect();
    const view = getSvgViewSize(svg, fallbackW, fallbackH);
    return {
      x: ((evt.clientX - rect.left) / rect.width) * view.width,
      y: ((evt.clientY - rect.top) / rect.height) * view.height,
    };
  }

  function computeCurveLayout(svg, mode = "single") {
    const view = getSvgViewSize(svg);
    const cfg = mode === "two-up"
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

  function drawLegend(svg, items, box, cfg, anchor = "outside-right") {
    const row = cfg.legendRow || 18;
    const lineLen = cfg.legendLine || 20;
    const pad = cfg.legendPad || 10;
    const startY = box.top + box.height - pad - (items.length - 1) * row;

    items.forEach((item, idx) => {
      const y = startY + idx * row;
      if (anchor === "inside-right") {
        const x2 = box.left + box.width - pad;
        const x1 = x2 - lineLen;
        const lineEl = createSvgEl("line", {
          x1,
          y1: y,
          x2,
          y2: y,
          stroke: item.color,
          "stroke-width": item.width || 3,
          "stroke-dasharray": item.dash || "",
          opacity: item.opacity == null ? 1 : item.opacity,
        });
        if (item.key) lineEl.setAttribute("data-legend-key", item.key);
        svg.appendChild(lineEl);

        const textEl = createSvgEl("text", {
          x: x1 - 6,
          y: y + 4,
          class: "legend",
          "text-anchor": "end",
          opacity: item.opacity == null ? 1 : item.opacity,
        });
        if (item.key) textEl.setAttribute("data-legend-key", item.key);
        textEl.textContent = item.label;
        svg.appendChild(textEl);
      } else if (anchor === "inside-left") {
        const x1 = box.left + pad;
        const x2 = x1 + lineLen;
        const lineEl = createSvgEl("line", {
          x1,
          y1: y,
          x2,
          y2: y,
          stroke: item.color,
          "stroke-width": item.width || 3,
          "stroke-dasharray": item.dash || "",
          opacity: item.opacity == null ? 1 : item.opacity,
        });
        if (item.key) lineEl.setAttribute("data-legend-key", item.key);
        svg.appendChild(lineEl);

        const textEl = createSvgEl("text", {
          x: x2 + 6,
          y: y + 4,
          class: "legend",
          opacity: item.opacity == null ? 1 : item.opacity,
        });
        if (item.key) textEl.setAttribute("data-legend-key", item.key);
        textEl.textContent = item.label;
        svg.appendChild(textEl);
      } else {
        const x1 = box.left + box.width + 12;
        const x2 = x1 + lineLen;
        const lineEl = createSvgEl("line", {
          x1,
          y1: y,
          x2,
          y2: y,
          stroke: item.color,
          "stroke-width": item.width || 3,
          "stroke-dasharray": item.dash || "",
          opacity: item.opacity == null ? 1 : item.opacity,
        });
        if (item.key) lineEl.setAttribute("data-legend-key", item.key);
        svg.appendChild(lineEl);

        const textEl = createSvgEl("text", {
          x: x2 + 6,
          y: y + 4,
          class: "legend",
          opacity: item.opacity == null ? 1 : item.opacity,
        });
        if (item.key) textEl.setAttribute("data-legend-key", item.key);
        textEl.textContent = item.label;
        svg.appendChild(textEl);
      }
    });
  }

  function drawRoc() {
    const svg = ids.rocSvg;
    clear(svg);

    const layout = computeCurveLayout(svg, "two-up");
    const box = layout.box;
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
      layout.cfg.strokeAux,
      "6 6"
    );

    addPath(svg, state.roc.empirical, box, "var(--emp)", layout.cfg.strokeMain);

    const op = state.roc.op;
    const cx = box.left + op.fpr * box.width;
    const cy = box.top + (1 - op.tpr) * box.height;

    svg.appendChild(
      createSvgEl("circle", {
        cx,
        cy,
        r: layout.cfg.pointRadius,
        fill: "#ffffff",
        stroke: "#000",
        "stroke-width": layout.cfg.pointStroke,
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
    drawLegend(svg, legendItems, box, layout.cfg, "inside-right");
  }

  function drawPr() {
    const svg = ids.prSvg;
    clear(svg);

    const layout = computeCurveLayout(svg, "two-up");
    const box = layout.box;
    state.prClickBox = box;
    drawAxes(svg, box, 10, 10, "Recall", "Precision");

    const baselineY = box.top + (1 - state.pr.prevalence) * box.height;
    svg.appendChild(
      createSvgEl("line", {
        x1: box.left,
        y1: baselineY,
        x2: box.left + box.width,
        y2: baselineY,
        stroke: "var(--diag)",
        "stroke-width": layout.cfg.strokeAux,
        "stroke-dasharray": "6 6",
      })
    );

    addPath(svg, state.pr.points, box, "var(--emp)", layout.cfg.strokeMain, null, "recall", "precision");

    const op = state.pr.op;
    const cx = box.left + op.recall * box.width;
    const cy = box.top + (1 - op.precision) * box.height;

    svg.appendChild(
      createSvgEl("circle", {
        cx,
        cy,
        r: layout.cfg.pointRadius,
        fill: "#ffffff",
        stroke: "#000",
        "stroke-width": layout.cfg.pointStroke,
      })
    );

    svg.appendChild(
      createSvgEl("text", {
        x: cx + 10,
        y: cy - 10,
        class: "legend",
      })
    ).textContent = `threshold = ${fmt(state.threshold, 3)}`;

    drawLegend(
      svg,
      [
        { label: "Empirical PR", color: "var(--emp)" },
        { label: `Random baseline (${fmt(state.pr.prevalence, 3)})`, color: "var(--diag)", dash: "6 6" },
      ],
      box,
      layout.cfg,
      "inside-left"
    );
  }

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

  function setMetricTrendHoverKey(nextKey) {
    const key = nextKey || null;
    if (state.metricTrendHoverKey === key) return;
    state.metricTrendHoverKey = key;
    drawMetricTrend();
  }

  function metricTrendHoverKeyFromPointer(evt) {
    const box = state.metricTrendBox;
    const curves = state.metricCurves;
    if (!box || !curves) return null;
    const point = eventToSvgCoordinates(evt, ids.metricTrendSvg, 760, 240);
    if (
      point.x < box.left ||
      point.x > box.left + box.width ||
      point.y < box.top ||
      point.y > box.top + box.height
    ) {
      return null;
    }

    const { yMin, ySpan } = getMetricTrendYRange(curves);
    const series = [
      { key: "recall", points: curves.recall },
      { key: "precision", points: curves.precision },
      { key: "specificity", points: curves.specificity },
      { key: "f1", points: curves.f1 },
      { key: "mcc", points: curves.mcc },
      { key: "accuracy", points: curves.accuracy },
    ];
    const u = clamp((point.x - box.left) / box.width, 0, 1);

    let bestKey = null;
    let bestDist = Infinity;
    for (const item of series) {
      if (!item.points || !item.points.length) continue;
      const idx = clamp(Math.round(u * (item.points.length - 1)), 0, item.points.length - 1);
      const yNorm = clamp((item.points[idx].v - yMin) / ySpan, 0, 1);
      const y = box.top + (1 - yNorm) * box.height;
      const dist = Math.abs(point.y - y);
      if (dist < bestDist) {
        bestDist = dist;
        bestKey = item.key;
      }
    }

    return bestDist <= 12 ? bestKey : null;
  }

  function drawMetricTrend() {
    const svg = ids.metricTrendSvg;
    if (!svg) return;
    clear(svg);

    const curves = state.metricCurves;
    if (!curves) return;

    const series = [
      { key: "recall", label: "Recall (TPR)", points: curves.recall, color: "#0D9488", width: 2.6 },
      { key: "precision", label: "Precision (PPV)", points: curves.precision, color: "#2563EB", width: 2.4, dash: "10 5" },
      { key: "specificity", label: "Specificity (TNR)", points: curves.specificity, color: "#D97706", width: 2.4, dash: "2 5" },
      { key: "f1", label: "F1 Score", points: curves.f1, color: "#7C3AED", width: 2.4, dash: "12 4 2 4" },
      { key: "mcc", label: "MCC", points: curves.mcc, color: "#111111", width: 3.0 },
      { key: "accuracy", label: "Accuracy", points: curves.accuracy, color: "#7A7062", width: 1.8, dash: "5 4" },
    ];
    const { yMin, yMax, ySpan } = getMetricTrendYRange(curves);
    const hasNegative = yMin < 0;
    const hoveredKey = state.metricTrendHoverKey;

    const view = getSvgViewSize(svg, 760, 240);
    const box = {
      left: 66,
      top: 18,
      width: Math.max(140, view.width - 250),
      height: Math.max(80, view.height - 62),
    };
    state.metricTrendBox = box;

    const axis = createSvgEl("g", {});
    const xTicks = 6;
    const yTicks = 5;

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
      const threshold = state.thresholdMin + u * (state.thresholdMax - state.thresholdMin);
      axis.appendChild(
        createSvgEl("text", {
          x,
          y: box.top + box.height + 18,
          class: "tick",
          "text-anchor": "middle",
        })
      ).textContent = fmt(threshold, 2);
    }

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

    if (hasNegative) {
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
    svg.appendChild(axis);

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

    const uCurrent = clamp(
      (state.threshold - state.thresholdMin) / Math.max(1e-9, state.thresholdMax - state.thresholdMin),
      0,
      1
    );
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
    ).textContent = `threshold ${fmt(state.threshold, 3)}`;

    drawLegend(
      svg,
      series.map(({ key, label, color, dash, width }) => ({
        key,
        label,
        color,
        dash,
        width: (width || 3) + (hoveredKey === key ? 0.8 : 0),
        opacity: hoveredKey && hoveredKey !== key ? 0.25 : 1,
      })),
      box,
      { legendPad: 10, legendRow: 17, legendLine: 18 },
      "outside-right"
    );
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
    state.distView = { box, minX, maxX };

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
    const threshold = clamp(state.threshold, minX, maxX);

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

    const tx = box.left + ((threshold - minX) / (maxX - minX)) * box.width;
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
        "aria-valuenow": fmt(state.threshold, 3),
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

  function drawConfusionMatrix() {
    const svg = ids.confusionSvg;
    clear(svg);

    const op = state.roc.op;
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

  function nearestFiniteThreshold(points, xTarget, yTarget, xKey = "fpr", yKey = "tpr") {
    let best = null;
    let bestDist = Infinity;

    for (const p of points) {
      if (!Number.isFinite(p.threshold)) continue;
      const dx = p[xKey] - xTarget;
      const dy = p[yKey] - yTarget;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist) {
        bestDist = d2;
        best = p;
      }
    }

    return best;
  }

  function setThreshold(next) {
    state.threshold = clamp(next, state.thresholdMin, state.thresholdMax);
  }

  function thresholdFromDistPointer(evt) {
    const view = state.distView;
    if (!view) return state.threshold;
    const point = eventToSvgCoordinates(evt, ids.distSvg, 760, 320);
    const x = point.x;
    const u = clamp((x - view.box.left) / view.box.width, 0, 1);
    return view.minX + u * (view.maxX - view.minX);
  }

  function thresholdFromMetricTrendPointer(evt) {
    const box = state.metricTrendBox;
    if (!box) return state.threshold;
    const point = eventToSvgCoordinates(evt, ids.metricTrendSvg, 760, 240);
    const u = clamp((point.x - box.left) / box.width, 0, 1);
    return state.thresholdMin + u * (state.thresholdMax - state.thresholdMin);
  }

  function isThresholdTarget(el) {
    if (!el || typeof el.getAttribute !== "function") return false;
    const role = el.getAttribute("data-role");
    return role === "threshold-handle" || role === "threshold-line";
  }

  function updateThresholdRange() {
    const data = state.data;
    const span = Math.max(1e-6, data.max - data.min);
    state.thresholdMin = data.min - 0.08 * span;
    state.thresholdMax = data.max + 0.08 * span;
    state.thresholdStep = span / 1000;

    if (state.threshold < state.thresholdMin || state.threshold > state.thresholdMax) {
      state.threshold = clamp(state.threshold, state.thresholdMin, state.thresholdMax);
    }
  }

  function saveStateToUrl() {
    const params = new URLSearchParams();
    params.set("preset", state.preset);
    for (const key of URL_NUM_KEYS) {
      if (typeof state[key] === "number" && Number.isFinite(state[key])) {
        params.set(key, String(state[key]));
      }
    }
    for (const key of URL_BOOL_KEYS) {
      params.set(key, state[key] ? "1" : "0");
    }
    params.set("advancedOpen", ids.advancedDetails.open ? "1" : "0");

    const next = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState(null, "", next);
  }

  function scheduleUrlSync() {
    if (state.urlSyncTimer) window.clearTimeout(state.urlSyncTimer);
    state.urlSyncTimer = window.setTimeout(() => {
      saveStateToUrl();
      state.urlSyncTimer = null;
    }, 120);
  }

  function parseBoolParam(value, fallback = false) {
    if (value == null) return fallback;
    return value === "1" || value === "true";
  }

  function restoreStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (!params.toString()) return false;

    const preset = params.get("preset");
    if (preset && PRESETS[preset]) {
      applyPresetValues(preset);
    } else {
      applyPresetValues(ids.preset.value);
    }

    for (const key of URL_NUM_KEYS) {
      if (!ids[key]) continue;
      const raw = params.get(key);
      if (raw == null) continue;
      const num = Number(raw);
      if (Number.isFinite(num)) ids[key].value = String(num);
    }

    for (const key of URL_BOOL_KEYS) {
      if (!ids[key]) continue;
      const raw = params.get(key);
      if (raw == null) continue;
      ids[key].checked = parseBoolParam(raw, ids[key].checked);
    }

    if (params.has("advancedOpen")) {
      ids.advancedDetails.open = parseBoolParam(params.get("advancedOpen"));
    }
    return true;
  }

  function renderMetrics() {
    const op = state.roc.op;
    const rows = [
      ["Recall (TPR)", op.tpr],
      ["False Positive Rate (FPR)", op.fpr],
      ["Precision (PPV)", op.precision],
      ["Specificity (TNR)", op.specificity],
      ["F1 Score", op.f1],
      ["MCC (Matthews)", op.mcc],
    ];
    const labelWidth = Math.max(...rows.map(([label]) => label.length)) + 2;

    ids.metricsText.textContent = rows
      .map(([label, value]) => `${label.padEnd(labelWidth)}${fmt(value, 2)}`)
      .join("\n");
  }

  function renderAll() {
    computeEverything();
    syncControlOutputs();
    drawDist();
    drawConfusionMatrix();
    drawRoc();
    drawPr();
    renderMetrics();
    drawMetricTrend();
    scheduleUrlSync();
  }

  function regenerateAndRender() {
    readControls();
    generateData();
    updateThresholdRange();
    state.metricCurves = computeMetricCurves(state.data.all, state.thresholdMin, state.thresholdMax);
    renderAll();
  }

  function initHandlers() {
    const regenerateIds = [
      ids.muNeg,
      ids.sdNeg,
      ids.muPos,
      ids.sdPos,
      ids.logSigma,
      ids.dfNeg,
      ids.dfPos,
      ids.mixWeight,
      ids.mixOffset,
      ids.mixSdMult,
      ids.p0Neg,
      ids.p0Pos,
      ids.zeroValue,
      ids.alphaNeg,
      ids.betaNeg,
      ids.alphaPos,
      ids.betaPos,
      ids.epsPos,
      ids.epsNeg,
      ids.confSharpness,
      ids.nPerClass,
      ids.samplePosFrac,
      ids.outlierFrac,
      ids.seed,
    ];

    regenerateIds.forEach((el) => {
      if (!el) return;
      el.addEventListener("input", () => {
        readControls();
        regenerateAndRender();
      });
      el.addEventListener("change", () => {
        readControls();
        regenerateAndRender();
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

    ids.advancedDetails.addEventListener("toggle", () => {
      scheduleUrlSync();
    });

    ids.rocSvg.addEventListener("click", (evt) => {
      const box = state.rocClickBox;
      if (!box) return;

      const point = eventToSvgCoordinates(evt, ids.rocSvg, 760, 420);
      const x = point.x;
      const y = point.y;

      const fpr = clamp((x - box.left) / box.width, 0, 1);
      const tpr = clamp(1 - (y - box.top) / box.height, 0, 1);

      const nearest = nearestFiniteThreshold(state.roc.empirical, fpr, tpr);
      if (!nearest) return;

      setThreshold(nearest.threshold);
      renderAll();
    });

    ids.prSvg.addEventListener("click", (evt) => {
      const box = state.prClickBox;
      if (!box) return;

      const point = eventToSvgCoordinates(evt, ids.prSvg, 760, 420);
      const x = point.x;
      const y = point.y;

      const recall = clamp((x - box.left) / box.width, 0, 1);
      const precision = clamp(1 - (y - box.top) / box.height, 0, 1);

      const nearest = nearestFiniteThreshold(state.pr.points, recall, precision, "recall", "precision");
      if (!nearest) return;

      setThreshold(nearest.threshold);
      renderAll();
    });

    ids.metricTrendSvg.addEventListener("pointerdown", (evt) => {
      const box = state.metricTrendBox;
      if (!box) return;
      const point = eventToSvgCoordinates(evt, ids.metricTrendSvg, 760, 240);
      if (
        point.x < box.left ||
        point.x > box.left + box.width ||
        point.y < box.top ||
        point.y > box.top + box.height
      ) {
        return;
      }
      evt.preventDefault();
      state.metricTrendHoverKey = null;
      state.draggingMetricThreshold = true;
      ids.metricTrendSvg.setPointerCapture(evt.pointerId);
      setThreshold(thresholdFromMetricTrendPointer(evt));
      renderAll();
    });

    ids.metricTrendSvg.addEventListener("pointermove", (evt) => {
      if (state.draggingMetricThreshold) {
        evt.preventDefault();
        setThreshold(thresholdFromMetricTrendPointer(evt));
        renderAll();
        return;
      }
      const legendKey = evt.target && typeof evt.target.getAttribute === "function"
        ? evt.target.getAttribute("data-legend-key")
        : null;
      if (legendKey) {
        setMetricTrendHoverKey(legendKey);
        return;
      }
      setMetricTrendHoverKey(metricTrendHoverKeyFromPointer(evt));
    });

    ids.metricTrendSvg.addEventListener("pointerup", (evt) => {
      if (!state.draggingMetricThreshold) return;
      state.draggingMetricThreshold = false;
      if (ids.metricTrendSvg.hasPointerCapture(evt.pointerId)) {
        ids.metricTrendSvg.releasePointerCapture(evt.pointerId);
      }
    });

    ids.metricTrendSvg.addEventListener("pointercancel", (evt) => {
      if (!state.draggingMetricThreshold) return;
      state.draggingMetricThreshold = false;
      if (ids.metricTrendSvg.hasPointerCapture(evt.pointerId)) {
        ids.metricTrendSvg.releasePointerCapture(evt.pointerId);
      }
    });

    ids.metricTrendSvg.addEventListener("pointerleave", () => {
      if (state.draggingMetricThreshold) return;
      setMetricTrendHoverKey(null);
    });

    ids.distSvg.addEventListener("pointerdown", (evt) => {
      if (!isThresholdTarget(evt.target)) return;
      evt.preventDefault();
      state.draggingThreshold = true;
      ids.distSvg.setPointerCapture(evt.pointerId);
      setThreshold(thresholdFromDistPointer(evt));
      renderAll();
    });

    ids.distSvg.addEventListener("pointermove", (evt) => {
      if (!state.draggingThreshold) return;
      evt.preventDefault();
      setThreshold(thresholdFromDistPointer(evt));
      renderAll();
    });

    ids.distSvg.addEventListener("pointerup", (evt) => {
      if (!state.draggingThreshold) return;
      state.draggingThreshold = false;
      if (ids.distSvg.hasPointerCapture(evt.pointerId)) {
        ids.distSvg.releasePointerCapture(evt.pointerId);
      }
    });

    ids.distSvg.addEventListener("pointercancel", (evt) => {
      if (!state.draggingThreshold) return;
      state.draggingThreshold = false;
      if (ids.distSvg.hasPointerCapture(evt.pointerId)) {
        ids.distSvg.releasePointerCapture(evt.pointerId);
      }
    });

    ids.distSvg.addEventListener("keydown", (evt) => {
      if (!isThresholdTarget(evt.target)) return;
      const step = state.thresholdStep || 0.001;
      const delta = evt.shiftKey ? step * 20 : step;
      if (evt.key === "ArrowLeft") {
        evt.preventDefault();
        setThreshold(state.threshold - delta);
      } else if (evt.key === "ArrowRight") {
        evt.preventDefault();
        setThreshold(state.threshold + delta);
      } else if (evt.key === "Home") {
        evt.preventDefault();
        setThreshold(state.thresholdMin);
      } else if (evt.key === "End") {
        evt.preventDefault();
        setThreshold(state.thresholdMax);
      } else {
        return;
      }
      renderAll();
    });
  }

  function init() {
    initHandlers();
    if (restoreStateFromUrl()) {
      readControls();
      regenerateAndRender();
    } else {
      applyPreset(ids.preset.value);
    }
  }

  init();
})();
