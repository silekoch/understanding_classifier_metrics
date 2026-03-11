import { drawRoc as drawRocView } from "../viz/roc.js";
import { drawPr as drawPrView } from "../viz/pr.js";
import { drawDist as drawDistView } from "../viz/dist.js";
import { drawConfusionMatrix as drawConfusionMatrixView } from "../viz/matrix.js";
import {
  drawMetricTrend as drawMetricTrendView,
  metricTrendHoverKeyFromPointer,
} from "../viz/metric-trend.js";
import { renderMetricsText as renderMetricsTextView } from "./metrics-text.js";

export { metricTrendHoverKeyFromPointer };

export function drawRoc({ ids, state, fmt }) {
  state.rocClickBox = drawRocView({
    svg: ids.rocSvg,
    roc: state.roc,
    threshold: state.threshold,
    fmt,
  });
}

export function drawPr({ ids, state, fmt }) {
  state.prClickBox = drawPrView({
    svg: ids.prSvg,
    pr: state.pr,
    threshold: state.threshold,
    fmt,
  });
}

export function drawMetricTrend({ ids, state, fmt }) {
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

export function drawDist({ ids, state, fmt }) {
  state.distView = drawDistView({
    svg: ids.distSvg,
    data: state.data,
    threshold: state.threshold,
    fmt,
  });
}

export function drawConfusionMatrix({ ids, state, fmtPct }) {
  drawConfusionMatrixView({
    svg: ids.confusionSvg,
    op: state.roc.op,
    fmtPct,
  });
}

export function renderMetrics({ ids, state, fmt }) {
  renderMetricsTextView({
    metricsTextEl: ids.metricsText,
    op: state.roc.op,
    fmt,
  });
}
