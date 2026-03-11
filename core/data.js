function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

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
  while (u === 0) {u = rng();}
  while (v === 0) {v = rng();}
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + sd * z;
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
    if (v <= 0) {continue;}
    v = v * v * v;
    const u = clamp(rng(), 1e-12, 1 - 1e-12);
    if (u < 1 - 0.0331 * Math.pow(x, 4)) {return d * v;}
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {return d * v;}
  }
}

function sampleBeta(rng, alpha, beta) {
  const a = Math.max(0.05, alpha);
  const b = Math.max(0.05, beta);
  const x = sampleGamma(rng, a);
  const y = sampleGamma(rng, b);
  const denom = x + y;
  if (denom <= 0) {return 0.5;}
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

function sampleStandardized(mode, rng, label, params) {
  if (mode === "lognormal") {
    const sigma = Math.max(0.05, params.logSigma);
    const y = Math.exp(sampleNormal(rng, -0.5 * sigma * sigma, sigma));
    return (y - 1) / Math.sqrt(Math.exp(sigma * sigma) - 1);
  }
  if (mode === "student_t") {
    const df = label === 1 ? params.dfPos : params.dfNeg;
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

function sampleScoreNormalMode({ rng, label, params, mu, sd }) {
  if (label === 1 && params.outlierFrac > 0 && rng() < params.outlierFrac) {
    return sampleNormal(rng, params.muNeg, Math.max(1e-6, params.sdNeg * 1.15));
  }
  return sampleNormal(rng, mu, sd);
}

function sampleScoreMixturePosMode({ rng, label, params }) {
  if (label === 0) {return sampleNormal(rng, params.muNeg, Math.max(1e-6, params.sdNeg));}
  const w = clamp(params.mixWeight, 0, 0.98);
  if (rng() < w) {
    const offset = params.mixOffset;
    const spread = Math.max(1e-6, params.mixSdMult * params.sdNeg);
    return sampleNormal(rng, params.muNeg + offset * params.sdNeg, spread);
  }
  return sampleNormal(rng, params.muPos, Math.max(1e-6, params.sdPos));
}

function sampleScoreZeroInflatedMode({ rng, label, params, mu, sd }) {
  const p0 = clamp(label === 1 ? params.p0Pos : params.p0Neg, 0, 0.99);
  if (rng() < p0) {return params.zeroValue;}
  return sampleNormal(rng, mu, sd);
}

function sampleScoreBetaMode({ rng, label, params }) {
  const alpha = label === 1 ? params.alphaPos : params.alphaNeg;
  const beta = label === 1 ? params.betaPos : params.betaNeg;
  return sampleBeta(rng, alpha, beta);
}

function sampleScoreBetaConfMixtureMode({ rng, label, params }) {
  const kappa = Math.max(2, params.confSharpness);
  const hi = betaByMeanAndKappa(0.96, kappa);
  const lo = betaByMeanAndKappa(0.04, kappa);

  if (label === 1) {
    const eps = clamp(params.epsPos, 0, 0.49);
    if (rng() < eps) {return sampleBeta(rng, lo.alpha, lo.beta);}
    return sampleBeta(rng, hi.alpha, hi.beta);
  }

  const eps = clamp(params.epsNeg, 0, 0.49);
  if (rng() < eps) {return sampleBeta(rng, hi.alpha, hi.beta);}
  return sampleBeta(rng, lo.alpha, lo.beta);
}

const MODE_SAMPLERS = {
  normal: sampleScoreNormalMode,
  mixture_pos: sampleScoreMixturePosMode,
  zero_inflated: sampleScoreZeroInflatedMode,
  beta: sampleScoreBetaMode,
  beta_conf_mixture: sampleScoreBetaConfMixtureMode,
};

function sampleScoreByPreset(rng, label, preset, params) {
  const mode = preset.mode || "normal";
  const mu = label === 1 ? params.muPos : params.muNeg;
  const sd = Math.max(1e-6, label === 1 ? params.sdPos : params.sdNeg);
  const modeSampler = MODE_SAMPLERS[mode];
  if (modeSampler) {return modeSampler({ rng, label, params, mu, sd });}

  const z = sampleStandardized(mode, rng, label, params);
  return mu + sd * z;
}

function meanSd(values) {
  const n = values.length;
  if (!n) {return { mean: 0, sd: 0 };}
  let sum = 0;
  for (const v of values) {sum += v;}
  const mean = sum / n;
  let ss = 0;
  for (const v of values) {
    const d = v - mean;
    ss += d * d;
  }
  return { mean, sd: Math.sqrt(ss / n) };
}

export function generateData(params, preset) {
  const rng = mulberry32(params.seed);
  const totalSamples = Math.max(2, 2 * params.nPerClass);
  const fracPos = clamp(params.samplePosFrac, 0.02, 0.98);
  const nPos = clamp(Math.round(totalSamples * fracPos), 1, totalSamples - 1);
  const nNeg = totalSamples - nPos;
  const negatives = [];
  const positives = [];
  const all = [];

  for (let i = 0; i < nNeg; i += 1) {
    const x = sampleScoreByPreset(rng, 0, preset, params);
    negatives.push(x);
    all.push({ score: x, label: 0 });
  }

  for (let i = 0; i < nPos; i += 1) {
    const x = sampleScoreByPreset(rng, 1, preset, params);
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
  return {
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
