import { eventToSvgCoordinates } from "../viz/svg.js";
import { clamp } from "../core/math.js";
import { DIST_VIEW_FALLBACK, METRIC_TREND_VIEW_FALLBACK, SVG_VIEW_FALLBACK } from "../viz/layout-config.js";

export function nearestFiniteThreshold(points, xTarget, yTarget, xKey = "fpr", yKey = "tpr") {
  let best = null;
  let bestDist = Infinity;

  for (const p of points) {
    if (!Number.isFinite(p.threshold)) {
      continue;
    }
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

export function thresholdFromDistPointer({ evt, ids, view, getThreshold }) {
  const distView = view.distView;
  if (!distView) {
    return getThreshold();
  }
  const point = eventToSvgCoordinates(evt, ids.distSvg, DIST_VIEW_FALLBACK.width, DIST_VIEW_FALLBACK.height);
  const x = point.x;
  const u = clamp((x - distView.box.left) / distView.box.width, 0, 1);
  return distView.minX + u * (distView.maxX - distView.minX);
}

function isPointInBox(point, box) {
  return (
    point.x >= box.left &&
    point.x <= box.left + box.width &&
    point.y >= box.top &&
    point.y <= box.top + box.height
  );
}

function isWithinDistPlot({ evt, ids, view }) {
  const distView = view.distView;
  if (!distView) {
    return false;
  }
  const point = eventToSvgCoordinates(evt, ids.distSvg, DIST_VIEW_FALLBACK.width, DIST_VIEW_FALLBACK.height);
  return isPointInBox(point, distView.box);
}

export function thresholdFromMetricTrendPointer({ evt, ids, view, getThreshold, state }) {
  const box = view.metricTrendBox;
  if (!box) {
    return getThreshold();
  }
  const point = eventToSvgCoordinates(
    evt,
    ids.metricTrendSvg,
    METRIC_TREND_VIEW_FALLBACK.width,
    METRIC_TREND_VIEW_FALLBACK.height
  );
  const u = clamp((point.x - box.left) / box.width, 0, 1);
  return state.computed.thresholdMin + u * (state.computed.thresholdMax - state.computed.thresholdMin);
}

export function isThresholdTarget(el) {
  if (!el || typeof el.getAttribute !== "function") {
    return false;
  }
  const role = el.getAttribute("data-role");
  return role === "threshold-handle" || role === "threshold-line";
}

export function attachRocClickHandler({ ids, state, view, setThreshold }) {
  ids.rocSvg.addEventListener("click", (evt) => {
    const box = view.rocClickBox;
    if (!box) {
      return;
    }

    const point = eventToSvgCoordinates(evt, ids.rocSvg, SVG_VIEW_FALLBACK.width, SVG_VIEW_FALLBACK.height);
    const x = point.x;
    const y = point.y;

    const fpr = clamp((x - box.left) / box.width, 0, 1);
    const tpr = clamp(1 - (y - box.top) / box.height, 0, 1);

    const nearest = nearestFiniteThreshold(state.computed.roc.empirical, fpr, tpr);
    if (!nearest) {
      return;
    }

    setThreshold(nearest.threshold);
  });
}

export function attachPrClickHandler({ ids, state, view, setThreshold }) {
  ids.prSvg.addEventListener("click", (evt) => {
    const box = view.prClickBox;
    if (!box) {
      return;
    }

    const point = eventToSvgCoordinates(evt, ids.prSvg, SVG_VIEW_FALLBACK.width, SVG_VIEW_FALLBACK.height);
    const x = point.x;
    const y = point.y;

    const recall = clamp((x - box.left) / box.width, 0, 1);
    const precision = clamp(1 - (y - box.top) / box.height, 0, 1);

    const nearest = nearestFiniteThreshold(
      state.computed.pr.points,
      recall,
      precision,
      "recall",
      "precision"
    );
    if (!nearest) {
      return;
    }

    setThreshold(nearest.threshold);
  });
}

export function attachMetricTrendHandlers({
  ids,
  state,
  view,
  setThreshold,
  getThreshold,
  setMetricTrendHoverState,
  metricTrendHoverKeyFromPointer,
}) {
  ids.metricTrendSvg.addEventListener("pointerdown", (evt) => {
    const box = view.metricTrendBox;
    if (!box) {
      return;
    }
    const point = eventToSvgCoordinates(
      evt,
      ids.metricTrendSvg,
      METRIC_TREND_VIEW_FALLBACK.width,
      METRIC_TREND_VIEW_FALLBACK.height
    );
    if (
      point.x < box.left ||
      point.x > box.left + box.width ||
      point.y < box.top ||
      point.y > box.top + box.height
    ) {
      return;
    }
    evt.preventDefault();
    setMetricTrendHoverState(null, null);
    state.ui.draggingMetricThreshold = true;
    ids.metricTrendSvg.setPointerCapture(evt.pointerId);
    setThreshold(thresholdFromMetricTrendPointer({ evt, state, ids, view, getThreshold }));
  });

  ids.metricTrendSvg.addEventListener("pointermove", (evt) => {
    if (state.ui.draggingMetricThreshold) {
      evt.preventDefault();
      setThreshold(thresholdFromMetricTrendPointer({ evt, state, ids, view, getThreshold }));
      return;
    }
    const legendKey =
      evt.target && typeof evt.target.getAttribute === "function"
        ? evt.target.getAttribute("data-legend-key")
        : null;
    if (legendKey) {
      setMetricTrendHoverState(legendKey, legendKey);
      return;
    }
    setMetricTrendHoverState(
      metricTrendHoverKeyFromPointer({
        evt,
        svg: ids.metricTrendSvg,
        box: view.metricTrendBox,
        curves: state.computed.metricCurves,
      }),
      null
    );
  });

  ids.metricTrendSvg.addEventListener("pointerup", (evt) => {
    if (!state.ui.draggingMetricThreshold) {
      return;
    }
    state.ui.draggingMetricThreshold = false;
    if (ids.metricTrendSvg.hasPointerCapture(evt.pointerId)) {
      ids.metricTrendSvg.releasePointerCapture(evt.pointerId);
    }
  });

  ids.metricTrendSvg.addEventListener("pointercancel", (evt) => {
    if (!state.ui.draggingMetricThreshold) {
      return;
    }
    state.ui.draggingMetricThreshold = false;
    if (ids.metricTrendSvg.hasPointerCapture(evt.pointerId)) {
      ids.metricTrendSvg.releasePointerCapture(evt.pointerId);
    }
  });

  ids.metricTrendSvg.addEventListener("pointerleave", () => {
    if (state.ui.draggingMetricThreshold) {
      return;
    }
    setMetricTrendHoverState(null, null);
  });
}

export function attachDistThresholdHandlers({ ids, state, view, setThreshold, getThreshold }) {
  ids.distSvg.addEventListener("click", (evt) => {
    if (!isWithinDistPlot({ evt, ids, view })) {
      return;
    }
    setThreshold(thresholdFromDistPointer({ evt, ids, view, getThreshold }));
  });

  ids.distSvg.addEventListener("pointerdown", (evt) => {
    if (!isThresholdTarget(evt.target)) {
      return;
    }
    evt.preventDefault();
    state.ui.draggingThreshold = true;
    ids.distSvg.setPointerCapture(evt.pointerId);
    setThreshold(thresholdFromDistPointer({ evt, ids, view, getThreshold }));
  });

  ids.distSvg.addEventListener("pointermove", (evt) => {
    if (!state.ui.draggingThreshold) {
      return;
    }
    evt.preventDefault();
    setThreshold(thresholdFromDistPointer({ evt, ids, view, getThreshold }));
  });

  ids.distSvg.addEventListener("pointerup", (evt) => {
    if (!state.ui.draggingThreshold) {
      return;
    }
    state.ui.draggingThreshold = false;
    if (ids.distSvg.hasPointerCapture(evt.pointerId)) {
      ids.distSvg.releasePointerCapture(evt.pointerId);
    }
  });

  ids.distSvg.addEventListener("pointercancel", (evt) => {
    if (!state.ui.draggingThreshold) {
      return;
    }
    state.ui.draggingThreshold = false;
    if (ids.distSvg.hasPointerCapture(evt.pointerId)) {
      ids.distSvg.releasePointerCapture(evt.pointerId);
    }
  });

  ids.distSvg.addEventListener("keydown", (evt) => {
    if (!isThresholdTarget(evt.target)) {
      return;
    }
    const step = state.computed.thresholdStep || 0.001;
    const delta = evt.shiftKey ? step * 20 : step;
    let nextThreshold = null;
    if (evt.key === "ArrowLeft") {
      evt.preventDefault();
      nextThreshold = getThreshold() - delta;
    } else if (evt.key === "ArrowRight") {
      evt.preventDefault();
      nextThreshold = getThreshold() + delta;
    } else if (evt.key === "Home") {
      evt.preventDefault();
      nextThreshold = state.computed.thresholdMin;
    } else if (evt.key === "End") {
      evt.preventDefault();
      nextThreshold = state.computed.thresholdMax;
    } else {
      return;
    }
    setThreshold(nextThreshold);
  });
}
