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
    samplePosFrac: 0.5,
    nPerClass: 500,
    outlierFrac: 0,
    seed: 13,
    threshold: 1,
    showTriangle: false,
    showPower: false,
    showHull: false,
    showGaussian: false,
    rocClickBox: null,
    distView: null,
    draggingThreshold: false,
    urlSyncTimer: null,
    data: null,
    roc: null,
    pr: null,
    metrics: null,
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
    threshold: document.getElementById("threshold"),
    resample: document.getElementById("resample"),
    showTriangle: document.getElementById("showTriangle"),
    showPower: document.getElementById("showPower"),
    showHull: document.getElementById("showHull"),
    showGaussian: document.getElementById("showGaussian"),
    advancedDetails: document.getElementById("advancedDetails"),
    interpolationDetails: document.getElementById("interpolationDetails"),
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
    shapeNoExtra: document.getElementById("shapeNoExtra"),
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
    nPerClassValue: document.getElementById("nPerClassValue"),
    samplePosFracValue: document.getElementById("samplePosFracValue"),
    outlierFracValue: document.getElementById("outlierFracValue"),
    thresholdValue: document.getElementById("thresholdValue"),
    presetDesc: document.getElementById("presetDesc"),
    negStatsValue: document.getElementById("negStatsValue"),
    posStatsValue: document.getElementById("posStatsValue"),
    rocSvg: document.getElementById("rocSvg"),
    prSvg: document.getElementById("prSvg"),
    distSvg: document.getElementById("distSvg"),
    confusionSvg: document.getElementById("confusionSvg"),
    derivedRates: document.getElementById("derivedRates"),
    metricsText: document.getElementById("metricsText"),
  };

  const PRESETS = {
    overlap: {
      mode: "normal",
      muNeg: 0,
      sdNeg: 1,
      muPos: 0.55,
      sdPos: 1,
      outlierFrac: 0,
      nPerClass: 500,
      samplePosFrac: 0.5,
      desc: "Expected shape: close to diagonal baseline (high overlap).",
    },
    separated: {
      mode: "normal",
      muNeg: 0,
      sdNeg: 1,
      muPos: 2.2,
      sdPos: 1,
      outlierFrac: 0,
      nPerClass: 500,
      samplePosFrac: 0.5,
      desc: "Expected shape: pronounced top-left belly (good separation).",
    },
    unequal: {
      mode: "normal",
      muNeg: 0,
      sdNeg: 0.8,
      muPos: 1.6,
      sdPos: 1.7,
      outlierFrac: 0,
      nPerClass: 600,
      samplePosFrac: 0.5,
      desc: "Expected shape: asymmetric curvature from unequal variances.",
    },
    lognormal: {
      mode: "lognormal",
      muNeg: 0.0,
      sdNeg: 1.0,
      muPos: 1.0,
      sdPos: 1.0,
      outlierFrac: 0,
      nPerClass: 700,
      samplePosFrac: 0.5,
      logSigma: 0.7,
      desc: "Expected shape: smooth but skew-driven bend (not symmetric like Gaussian).",
    },
    heavytail: {
      mode: "student_t",
      muNeg: 0,
      sdNeg: 1,
      muPos: 1.45,
      sdPos: 1,
      outlierFrac: 0,
      nPerClass: 700,
      samplePosFrac: 0.5,
      dfNeg: 3,
      dfPos: 3,
      desc: "Expected shape: flatter shoulders from heavy tails/outliers.",
    },
    mixture: {
      mode: "mixture_pos",
      muNeg: 0,
      sdNeg: 1,
      muPos: 2.3,
      sdPos: 0.9,
      outlierFrac: 0,
      nPerClass: 800,
      samplePosFrac: 0.5,
      mixWeight: 0.24,
      mixOffset: 0.15,
      mixSdMult: 1.1,
      desc: "Expected shape: visible kink/shoulder from class heterogeneity.",
    },
    zeroinflated: {
      mode: "zero_inflated",
      muNeg: -0.2,
      sdNeg: 0.9,
      muPos: 1.8,
      sdPos: 1.0,
      outlierFrac: 0,
      nPerClass: 900,
      samplePosFrac: 0.5,
      p0Neg: 0.42,
      p0Pos: 0.12,
      zeroValue: 0,
      desc: "Expected shape: step-like ROC segments from many tied zero scores.",
    },
    uniform: {
      mode: "uniform",
      muNeg: 0.0,
      sdNeg: 1.0,
      muPos: 1.5,
      sdPos: 1.0,
      outlierFrac: 0,
      nPerClass: 700,
      samplePosFrac: 0.5,
      desc: "Expected shape: piecewise-linear style with gentler bends.",
    },
    exponential: {
      mode: "exponential",
      muNeg: -0.2,
      sdNeg: 0.9,
      muPos: 0.95,
      sdPos: 0.9,
      outlierFrac: 0,
      nPerClass: 700,
      samplePosFrac: 0.5,
      desc: "Expected shape: skewed ROC curvature from one-sided tails.",
    },
    probGoodSep: {
      mode: "beta",
      alphaNeg: 1.3,
      betaNeg: 10.5,
      alphaPos: 10.5,
      betaPos: 1.3,
      outlierFrac: 0,
      nPerClass: 700,
      samplePosFrac: 0.5,
      desc: "Probability-like scores in [0,1] with clear class separation.",
    },
    probOverlap: {
      mode: "beta",
      alphaNeg: 2.7,
      betaNeg: 4.1,
      alphaPos: 4.1,
      betaPos: 2.7,
      outlierFrac: 0,
      nPerClass: 700,
      samplePosFrac: 0.5,
      desc: "Probability-like scores in [0,1] with substantial overlap.",
    },
    probOverconfident: {
      mode: "beta",
      alphaNeg: 0.35,
      betaNeg: 3.5,
      alphaPos: 3.5,
      betaPos: 0.35,
      outlierFrac: 0,
      nPerClass: 700,
      samplePosFrac: 0.5,
      desc: "Overconfident probabilities: many near 0/1, with some high-confidence mistakes.",
    },
    probMidrange: {
      mode: "beta",
      alphaNeg: 8.0,
      betaNeg: 12.0,
      alphaPos: 12.0,
      betaPos: 8.0,
      outlierFrac: 0,
      nPerClass: 700,
      samplePosFrac: 0.5,
      desc: "Probability-like scores concentrated in the middle, with moderate separability.",
    },
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
    "nPerClass",
    "samplePosFrac",
    "outlierFrac",
    "seed",
    "threshold",
  ];

  const URL_BOOL_KEYS = ["showTriangle", "showPower", "showHull", "showGaussian"];

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
    state.nPerClass = Math.round(toNumber(ids.nPerClass));
    state.samplePosFrac = toNumber(ids.samplePosFrac);
    state.outlierFrac = toNumber(ids.outlierFrac);
    const seedRaw = Math.round(toNumber(ids.seed));
    state.seed = Number.isFinite(seedRaw) ? Math.max(1, seedRaw) : 1;
    const thresholdRaw = toNumber(ids.threshold);
    if (Number.isFinite(thresholdRaw)) state.threshold = thresholdRaw;
    state.showTriangle = ids.showTriangle.checked;
    state.showPower = ids.showPower.checked;
    state.showHull = ids.showHull.checked;
    state.showGaussian = ids.showGaussian.checked;
  }

  function setHidden(el, hidden) {
    if (!el) return;
    el.style.display = hidden ? "none" : "";
  }

  function updateConditionalParameterUI(preset) {
    const mode = preset.mode || "normal";
    const isNormal = mode === "normal";
    const isBeta = mode === "beta";
    ids.muNegLabel.textContent = isNormal ? "Negative mean" : "Negative location";
    ids.sdNegLabel.textContent = isNormal ? "Negative sd" : "Negative scale";
    ids.muPosLabel.textContent = isNormal ? "Positive mean" : "Positive location";
    ids.sdPosLabel.textContent = isNormal ? "Positive sd" : "Positive scale";
    if (isBeta) {
      ids.muNegLabel.textContent = "Negative location (fixed in beta mode)";
      ids.sdNegLabel.textContent = "Negative scale (fixed in beta mode)";
      ids.muPosLabel.textContent = "Positive location (fixed in beta mode)";
      ids.sdPosLabel.textContent = "Positive scale (fixed in beta mode)";
    }

    setHidden(ids.shapeNormal, mode !== "normal");
    setHidden(ids.shapeLognormal, mode !== "lognormal");
    setHidden(ids.shapeStudent, mode !== "student_t");
    setHidden(ids.shapeMixture, mode !== "mixture_pos");
    setHidden(ids.shapeZeroInflated, mode !== "zero_inflated");
    setHidden(ids.shapeBeta, mode !== "beta");
    setHidden(ids.shapeNoExtra, !(mode === "uniform" || mode === "exponential"));
  }

  function syncControlOutputs() {
    const preset = PRESETS[state.preset] || PRESETS.separated;
    const outlierEnabled = preset.mode === "normal";
    const betaMode = preset.mode === "beta";
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
    ids.nPerClassValue.textContent = String(state.nPerClass);
    ids.samplePosFracValue.textContent = fmtPct(state.samplePosFrac, 1);
    ids.outlierFracValue.textContent = outlierEnabled ? fmt(state.outlierFrac, 2) : `${fmt(state.outlierFrac, 2)} (normal only)`;
    ids.outlierFrac.disabled = !outlierEnabled;
    ids.muNeg.disabled = betaMode;
    ids.sdNeg.disabled = betaMode;
    ids.muPos.disabled = betaMode;
    ids.sdPos.disabled = betaMode;
    ids.thresholdValue.textContent = fmt(state.threshold, 3);
    ids.seed.value = String(state.seed);
    ids.presetDesc.textContent = preset.desc || "";
    updateConditionalParameterUI(preset);

    if (state.data) {
      ids.negStatsValue.textContent = `${fmt(state.data.negMean, 3)} / ${fmt(state.data.negSd, 3)}`;
      ids.posStatsValue.textContent = `${fmt(state.data.posMean, 3)} / ${fmt(state.data.posSd, 3)}`;
    } else {
      ids.negStatsValue.textContent = "-";
      ids.posStatsValue.textContent = "-";
    }
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

    return { tp, fp, tn, fn, tpr, fpr, precision, recall, specificity, f1, P, N };
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
    const muNeg = state.data.negMean;
    const muPos = state.data.posMean;
    const sdNeg = Math.max(1e-6, state.data.negSd);
    const sdPos = Math.max(1e-6, state.data.posSd);
    const points = [];
    const sigmaPad = 4.5 * Math.max(sdNeg, sdPos);
    const tMin = Math.min(muNeg, muPos) - sigmaPad;
    const tMax = Math.max(muNeg, muPos) + sigmaPad;

    for (let i = 0; i < n; i += 1) {
      const u = i / (n - 1);
      const t = tMax - u * (tMax - tMin);
      const fpr = 1 - normalCdf(t, muNeg, sdNeg);
      const tpr = 1 - normalCdf(t, muPos, sdPos);
      points.push({ fpr: clamp(fpr, 0, 1), tpr: clamp(tpr, 0, 1) });
    }

    points[0] = { fpr: 0, tpr: 0 };
    points[points.length - 1] = { fpr: 1, tpr: 1 };
    const aucParam = normalCdf(
      (muPos - muNeg) / Math.sqrt(sdPos * sdPos + sdNeg * sdNeg),
      0,
      1
    );

    return { points, aucParam };
  }

  function computeEverything() {
    const rocPoints = computeRocPoints(state.data.all);
    const pr = computePrPoints(state.data.all);
    const aucTrap = computeAucTrapezoid(rocPoints);
    const aucRank = computeAucRank(state.data.all);
    const op = computeOperatingPoint(state.threshold, state.data.all);
    const apTrap = computeApTrapezoid(pr.points);
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

    state.pr = {
      points: pr.points,
      prevalence: pr.prevalence,
      op: { recall: op.recall, precision: op.precision },
    };

    state.metrics = {
      aucTrap,
      aucRank,
      aucAbsDiff: Math.abs(aucTrap - aucRank),
      apTrap,
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
        svg.appendChild(
          createSvgEl("line", {
            x1,
            y1: y,
            x2,
            y2: y,
            stroke: item.color,
            "stroke-width": 3,
            "stroke-dasharray": item.dash || "",
          })
        );
        svg.appendChild(
          createSvgEl("text", {
            x: x1 - 6,
            y: y + 4,
            class: "legend",
            "text-anchor": "end",
          })
        ).textContent = item.label;
      } else if (anchor === "inside-left") {
        const x1 = box.left + pad;
        const x2 = x1 + lineLen;
        svg.appendChild(
          createSvgEl("line", {
            x1,
            y1: y,
            x2,
            y2: y,
            stroke: item.color,
            "stroke-width": 3,
            "stroke-dasharray": item.dash || "",
          })
        );
        svg.appendChild(
          createSvgEl("text", {
            x: x2 + 6,
            y: y + 4,
            class: "legend",
          })
        ).textContent = item.label;
      } else {
        const x1 = box.left + box.width + 12;
        const x2 = x1 + lineLen;
        svg.appendChild(
          createSvgEl("line", {
            x1,
            y1: y,
            x2,
            y2: y,
            stroke: item.color,
            "stroke-width": 3,
            "stroke-dasharray": item.dash || "",
          })
        );
        svg.appendChild(
          createSvgEl("text", {
            x: x2 + 6,
            y: y + 4,
            class: "legend",
          })
        ).textContent = item.label;
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

    if (state.showTriangle) {
      addPath(svg, state.roc.triangle, box, "var(--tri)", layout.cfg.strokeAux, "5 5");
    }

    if (state.showPower) {
      addPath(svg, state.roc.power.points, box, "var(--pow)", layout.cfg.strokeAux);
    }

    if (state.showHull) {
      addPath(svg, state.roc.hull, box, "var(--hull)", layout.cfg.strokeAux, "10 4");
    }

    if (state.showGaussian) {
      addPath(svg, state.roc.gaussian, box, "var(--gauss)", layout.cfg.strokeAux, "3 4");
    }

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
    if (state.showTriangle) legendItems.push({ label: "Triangle interpolation", color: "var(--tri)", dash: "5 5" });
    if (state.showPower) legendItems.push({ label: "Power interpolation", color: "var(--pow)" });
    if (state.showHull) legendItems.push({ label: "Concave hull interpolation", color: "var(--hull)", dash: "10 4" });
    if (state.showGaussian) legendItems.push({ label: "Gaussian model ROC", color: "var(--gauss)", dash: "3 4" });
    drawLegend(svg, legendItems, box, layout.cfg, "inside-right");
  }

  function drawPr() {
    const svg = ids.prSvg;
    clear(svg);

    const layout = computeCurveLayout(svg, "two-up");
    const box = layout.box;
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

    ids.derivedRates.textContent = [
      `TPR: ${fmt(op.tpr, 4)}   FPR: ${fmt(op.fpr, 4)}   Precision: ${fmt(op.precision, 4)}`,
      `Recall: ${fmt(op.recall, 4)}   Specificity: ${fmt(op.specificity, 4)}   F1: ${fmt(op.f1, 4)}`,
    ].join("\n");
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

  function setThreshold(next) {
    const minT = Number(ids.threshold.min);
    const maxT = Number(ids.threshold.max);
    state.threshold = clamp(next, minT, maxT);
    ids.threshold.value = String(state.threshold);
  }

  function thresholdFromDistPointer(evt) {
    const view = state.distView;
    if (!view) return state.threshold;
    const point = eventToSvgCoordinates(evt, ids.distSvg, 760, 320);
    const x = point.x;
    const u = clamp((x - view.box.left) / view.box.width, 0, 1);
    return view.minX + u * (view.maxX - view.minX);
  }

  function isThresholdTarget(el) {
    if (!el || typeof el.getAttribute !== "function") return false;
    const role = el.getAttribute("data-role");
    return role === "threshold-handle" || role === "threshold-line";
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
      state.threshold = clamp(state.threshold, minT, maxT);
      ids.threshold.value = String(state.threshold);
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
    params.set("interpolationOpen", ids.interpolationDetails.open ? "1" : "0");

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
    if (params.has("interpolationOpen")) {
      ids.interpolationDetails.open = parseBoolParam(params.get("interpolationOpen"));
    }

    return true;
  }

  function renderMetrics() {
    const preset = getActivePreset();
    const op = state.roc.op;
    const m = state.metrics;
    const pass = m.aucAbsDiff < 1e-10 ? "PASS" : "CHECK";
    const gaussianReference = preset.mode !== "normal" || state.outlierFrac > 0;

    ids.metricsText.textContent = [
      `Preset                  ${state.preset}`,
      `Threshold               ${fmt(state.threshold, 4)}`,
      `Sample prevalence (P)   ${fmt(state.data.samplePrevalence, 4)}  (${state.data.nPos}/${state.data.nPos + state.data.nNeg})`,
      `TPR, FPR                ${fmt(op.tpr, 4)}, ${fmt(op.fpr, 4)}`,
      `Precision, Recall       ${fmt(op.precision, 4)}, ${fmt(op.recall, 4)}`,
      `Specificity, F1         ${fmt(op.specificity, 4)}, ${fmt(op.f1, 4)}`,
      `TP, FP, TN, FN          ${op.tp}, ${op.fp}, ${op.tn}, ${op.fn}`,
      "",
      `AUC empirical (trap)    ${fmt(m.aucTrap, 6)}`,
      `AUC empirical (rank)    ${fmt(m.aucRank, 6)}`,
      `|difference|            ${fmt(m.aucAbsDiff, 12)}  ${pass}`,
      `AP empirical (trap)     ${fmt(m.apTrap, 6)}`,
      "",
      `AUC triangle            ${fmt(m.triAuc, 6)}`,
      `AUC power interpolation ${fmt(m.powerAuc, 6)}`,
      `AUC concave hull        ${fmt(m.hullAuc, 6)}`,
      `AUC Gaussian model      ${fmt(m.gaussAuc, 6)}`,
      "",
      "Interpretation: triangle is simple but usually too coarse.",
      "Concave hull is safer (data-driven). Gaussian model is smooth if the normal assumption is reasonable.",
      gaussianReference ? "Note: Gaussian overlay/AUC is a fitted reference in this preset, not the exact generating model." : "",
    ].join("\n");
  }

  function renderAll() {
    computeEverything();
    syncControlOutputs();
    drawDist();
    drawConfusionMatrix();
    drawRoc();
    drawPr();
    renderMetrics();
    scheduleUrlSync();
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

    ids.threshold.addEventListener("input", () => {
      setThreshold(toNumber(ids.threshold));
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

    [ids.advancedDetails, ids.interpolationDetails].forEach((el) => {
      el.addEventListener("toggle", () => {
        scheduleUrlSync();
      });
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
      const step = Number(ids.threshold.step) || 0.001;
      const delta = evt.shiftKey ? step * 20 : step;
      if (evt.key === "ArrowLeft") {
        evt.preventDefault();
        setThreshold(state.threshold - delta);
      } else if (evt.key === "ArrowRight") {
        evt.preventDefault();
        setThreshold(state.threshold + delta);
      } else if (evt.key === "Home") {
        evt.preventDefault();
        setThreshold(Number(ids.threshold.min));
      } else if (evt.key === "End") {
        evt.preventDefault();
        setThreshold(Number(ids.threshold.max));
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
