import { PRESETS } from "./presets.js";
import { createInitialState } from "./core/state.js";
import { createStateStore } from "./core/state-store.js";
import { fmt, fmtPct } from "./core/format.js";
import { computeMetricCurves } from "./core/metrics.js";
import {
  computeCurveState as computeCurveStateCore,
  computeThresholdBounds as computeThresholdBoundsCore,
} from "./core/derived-state.js";
import { generateData as generateSampleData } from "./core/data.js";
import { drawRoc as drawRocView } from "./viz/roc.js";
import { drawPr as drawPrView } from "./viz/pr.js";
import { drawDist as drawDistView } from "./viz/dist.js";
import { drawConfusionMatrix as drawConfusionMatrixView } from "./viz/matrix.js";
import {
  drawMetricTrend as drawMetricTrendView,
  metricTrendHoverKeyFromPointer as metricTrendHoverKeyFromPointerView,
} from "./viz/metric-trend.js";
import { initHandlers as initControlHandlers } from "./ui/controls.js";
import {
  restoreStateFromUrl as restoreStateFromUrlImpl,
  saveStateToUrl as saveStateToUrlImpl,
  scheduleUrlSync as scheduleUrlSyncImpl,
} from "./ui/url-state.js";
import {
  applyPresetValues as applyPresetValuesUi,
  syncControlOutputs as syncControlOutputsUi,
} from "./ui/preset-controls.js";
import { getIds } from "./ui/dom-ids.js";
import { readControls as readControlsImpl } from "./ui/control-values.js";
import { URL_BOOL_KEYS, URL_NUM_KEYS } from "./ui/url-state-keys.js";
import { renderMetricsText as renderMetricsTextView } from "./ui/metrics-text.js";
import { runStartupRender } from "./ui/startup.js";

const state = createInitialState();
const ids = getIds(document);
const store = createStateStore({
  preset: state.preset,
  muNeg: state.muNeg,
  sdNeg: state.sdNeg,
  muPos: state.muPos,
  sdPos: state.sdPos,
  nPerClass: state.nPerClass,
  samplePosFrac: state.samplePosFrac,
  outlierFrac: state.outlierFrac,
  seed: state.seed,
  threshold: state.threshold,
  metricTrendHoverKey: state.metricTrendHoverKey,
});

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

const readControls = () => readControlsImpl({ ids, state });

store.subscribe("threshold", (nextThreshold) => {
  state.threshold = nextThreshold;
  renderThresholdViews();
});

store.subscribe("preset", (nextPreset) => {
  state.preset = nextPreset;
  applyPresetValuesUi({ ids, presets: PRESETS, name: nextPreset });
  regenerateAndRender();
});

store.subscribe("muNeg", (nextMuNeg) => {
  state.muNeg = nextMuNeg;
  ids.muNeg.value = String(nextMuNeg);
  regenerateAndRender();
});

store.subscribe("sdNeg", (nextSdNeg) => {
  state.sdNeg = nextSdNeg;
  ids.sdNeg.value = String(nextSdNeg);
  regenerateAndRender();
});

store.subscribe("muPos", (nextMuPos) => {
  state.muPos = nextMuPos;
  ids.muPos.value = String(nextMuPos);
  regenerateAndRender();
});

store.subscribe("sdPos", (nextSdPos) => {
  state.sdPos = nextSdPos;
  ids.sdPos.value = String(nextSdPos);
  regenerateAndRender();
});

store.subscribe("metricTrendHoverKey", (nextHoverKey) => {
  state.metricTrendHoverKey = nextHoverKey;
  drawMetricTrend();
});

store.subscribe("seed", (nextSeed) => {
  state.seed = nextSeed;
  ids.seed.value = String(nextSeed);
  regenerateAndRender();
});

store.subscribe("nPerClass", (nextNPerClass) => {
  state.nPerClass = nextNPerClass;
  ids.nPerClass.value = String(nextNPerClass);
  regenerateAndRender();
});

store.subscribe("samplePosFrac", (nextSamplePosFrac) => {
  state.samplePosFrac = nextSamplePosFrac;
  ids.samplePosFrac.value = String(nextSamplePosFrac);
  regenerateAndRender();
});

store.subscribe("outlierFrac", (nextOutlierFrac) => {
  state.outlierFrac = nextOutlierFrac;
  ids.outlierFrac.value = String(nextOutlierFrac);
  regenerateAndRender();
});

function applyThreshold(nextThreshold) {
  const clampedThreshold = clamp(nextThreshold, state.thresholdMin, state.thresholdMax);
  store.set("threshold", clampedThreshold);
}

function applySeed(nextSeedRaw) {
  const rounded = Math.round(Number(nextSeedRaw));
  const nextSeed = Number.isFinite(rounded) ? Math.max(1, rounded) : 1;
  store.set("seed", nextSeed);
}

function applyMuNeg(nextMuNegRaw) {
  const raw = Number(nextMuNegRaw);
  const nextMuNeg = Number.isFinite(raw) ? clamp(raw, -4, 4) : 0;
  store.set("muNeg", nextMuNeg);
}

function applySdNeg(nextSdNegRaw) {
  const raw = Number(nextSdNegRaw);
  const nextSdNeg = Number.isFinite(raw) ? clamp(raw, 0.2, 3) : 1;
  store.set("sdNeg", nextSdNeg);
}

function applyMuPos(nextMuPosRaw) {
  const raw = Number(nextMuPosRaw);
  const nextMuPos = Number.isFinite(raw) ? clamp(raw, -4, 6) : 2;
  store.set("muPos", nextMuPos);
}

function applySdPos(nextSdPosRaw) {
  const raw = Number(nextSdPosRaw);
  const nextSdPos = Number.isFinite(raw) ? clamp(raw, 0.2, 3) : 1;
  store.set("sdPos", nextSdPos);
}

function applyNPerClass(nextNPerClassRaw) {
  const rounded = Math.round(Number(nextNPerClassRaw));
  const nextNPerClass = Number.isFinite(rounded) ? Math.max(50, rounded) : 50;
  store.set("nPerClass", nextNPerClass);
}

function applySamplePosFrac(nextSamplePosFracRaw) {
  const raw = Number(nextSamplePosFracRaw);
  const nextSamplePosFrac = Number.isFinite(raw) ? clamp(raw, 0.02, 0.98) : 0.5;
  store.set("samplePosFrac", nextSamplePosFrac);
}

function applyOutlierFrac(nextOutlierFracRaw) {
  const raw = Number(nextOutlierFracRaw);
  const nextOutlierFrac = Number.isFinite(raw) ? clamp(raw, 0, 0.5) : 0;
  store.set("outlierFrac", nextOutlierFrac);
}

function applyMetricTrendHoverKey(nextHoverKey) {
  const key = nextHoverKey || null;
  store.set("metricTrendHoverKey", key);
}

function applyPreset(name) {
  store.set("preset", name);
}

function getActivePreset() {
  return PRESETS[state.preset] || PRESETS.separated;
}

function computeEverything() {
  const { roc, pr } = computeCurveStateCore({
    samples: state.data.all,
    threshold: state.threshold,
  });
  state.roc = roc;
  state.pr = pr;
}

function updateThresholdRange() {
  const bounds = computeThresholdBoundsCore({
    data: state.data,
    threshold: state.threshold,
  });
  state.thresholdMin = bounds.thresholdMin;
  state.thresholdMax = bounds.thresholdMax;
  state.thresholdStep = bounds.thresholdStep;
  state.threshold = bounds.threshold;
}

function saveStateToUrl() {
  saveStateToUrlImpl({
    state,
    ids,
    urlNumKeys: URL_NUM_KEYS,
    urlBoolKeys: URL_BOOL_KEYS,
  });
}

function scheduleUrlSync() {
  scheduleUrlSyncImpl({
    state,
    saveStateToUrl,
    delayMs: 120,
  });
}

function drawMetricTrend() {
  state.metricTrendBox = drawMetricTrendView({
    svg: ids.metricTrendSvg,
    curves: state.metricCurves,
    hoveredKey: state.metricTrendHoverKey,
    threshold: state.threshold,
    thresholdMin: state.thresholdMin,
    thresholdMax: state.thresholdMax,
    fmt,
  });
}

function renderThresholdViews() {
  computeEverything();
  state.distView = drawDistView({
    svg: ids.distSvg,
    data: state.data,
    threshold: state.threshold,
    fmt,
  });
  drawConfusionMatrixView({
    svg: ids.confusionSvg,
    op: state.roc.op,
    fmtPct,
  });
  state.rocClickBox = drawRocView({
    svg: ids.rocSvg,
    roc: state.roc,
    threshold: state.threshold,
    fmt,
  });
  state.prClickBox = drawPrView({
    svg: ids.prSvg,
    pr: state.pr,
    threshold: state.threshold,
    fmt,
  });
  renderMetricsTextView({
    metricsTextEl: ids.metricsText,
    op: state.roc.op,
    fmt,
  });
  drawMetricTrend();
  scheduleUrlSync();
}

function renderAll() {
  syncControlOutputsUi({ ids, state, presets: PRESETS, fmt, fmtPct });
  renderThresholdViews();
}

function regenerateAndRender() {
  readControls();
  state.data = generateSampleData(state, getActivePreset());
  updateThresholdRange();
  store.set("preset", state.preset, { silent: true });
  store.set("muNeg", state.muNeg, { silent: true });
  store.set("sdNeg", state.sdNeg, { silent: true });
  store.set("muPos", state.muPos, { silent: true });
  store.set("sdPos", state.sdPos, { silent: true });
  store.set("nPerClass", state.nPerClass, { silent: true });
  store.set("samplePosFrac", state.samplePosFrac, { silent: true });
  store.set("outlierFrac", state.outlierFrac, { silent: true });
  store.set("seed", state.seed, { silent: true });
  store.set("threshold", state.threshold, { silent: true });
  store.set("metricTrendHoverKey", state.metricTrendHoverKey, { silent: true });
  state.metricCurves = computeMetricCurves(state.data.all, state.thresholdMin, state.thresholdMax);
  renderAll();
}

function initHandlers() {
  initControlHandlers({
    ids,
    state,
    readControls,
    regenerateAndRender,
    applyPreset,
    scheduleUrlSync,
    applyThreshold,
    applyMuNeg,
    applySdNeg,
    applyMuPos,
    applySdPos,
    applyNPerClass,
    applySamplePosFrac,
    applyOutlierFrac,
    applySeed,
    applyMetricTrendHoverKey,
    metricTrendHoverKeyFromPointer: metricTrendHoverKeyFromPointerView,
  });
}

function init() {
  initHandlers();
  const restored = restoreStateFromUrlImpl({
    ids,
    presets: PRESETS,
    applyPresetValues: (name) => applyPresetValuesUi({ ids, presets: PRESETS, name }),
    urlNumKeys: URL_NUM_KEYS,
    urlBoolKeys: URL_BOOL_KEYS,
  });
  runStartupRender({
    restored,
    setPresetFromControls: () => store.set("preset", ids.preset.value),
    readControls,
    regenerateAndRender,
  });
}

init();
