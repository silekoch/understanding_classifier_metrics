import { PRESET_CONTROL_KEYS, sanitizeControlValue } from "../core/control-specs.js";

function parseBoolParam(value) {
  if (value === "1" || value === "true") {
    return true;
  }
  if (value === "0" || value === "false") {
    return false;
  }
  return null;
}

function formatRestoreIssues(issues) {
  if (!issues.length) {
    return "";
  }
  if (issues.length === 1) {
    return `URL parameter warning: ${issues[0]}`;
  }
  return `URL parameter warnings (${issues.length}): ${issues.join(" ")}`;
}

function applyPresetParam({ params, store, presets, issues }) {
  const preset = params.get("preset");
  if (!preset) {
    return;
  }
  const presetConfig = presets[preset];
  if (!presetConfig) {
    issues.push(`Unknown preset "${preset}" was ignored.`);
    return;
  }
  store.set("preset", preset, { silent: true });
  for (const key of PRESET_CONTROL_KEYS) {
    if (Object.prototype.hasOwnProperty.call(presetConfig, key)) {
      store.set(key, sanitizeControlValue(key, presetConfig[key]), { silent: true });
    }
  }
}

function applyNumericParams({ params, store, ids, urlNumKeys, issues }) {
  for (const key of urlNumKeys) {
    const raw = params.get(key);
    if (raw == null) {
      continue;
    }
    const num = Number(raw);
    if (!Number.isFinite(num)) {
      issues.push(`Invalid numeric value "${raw}" for "${key}" was ignored.`);
      continue;
    }
    if (key === "threshold") {
      store.set("threshold", num, { silent: true });
      continue;
    }
    if (!ids[key]) {
      continue;
    }
    store.set(key, sanitizeControlValue(key, num), { silent: true });
  }
}

function applyBooleanParams({ params, store, ids, urlBoolKeys, issues }) {
  for (const key of urlBoolKeys) {
    if (!ids[key] || store.get(key) === undefined) {
      continue;
    }
    const raw = params.get(key);
    if (raw == null) {
      continue;
    }
    const parsed = parseBoolParam(raw);
    if (parsed == null) {
      issues.push(`Invalid boolean value "${raw}" for "${key}" was ignored.`);
      continue;
    }
    store.set(key, parsed, { silent: true });
  }
}

function applyAdvancedOpenParam({ params, ids, issues }) {
  if (!params.has("advancedOpen")) {
    return;
  }
  const raw = params.get("advancedOpen");
  const parsed = parseBoolParam(raw);
  if (parsed == null) {
    issues.push(`Invalid boolean value "${raw}" for "advancedOpen" was ignored.`);
    return;
  }
  ids.advancedDetails.open = parsed;
}

export function saveStateToUrl({ store, ids, urlNumKeys, urlBoolKeys }) {
  const params = new URLSearchParams();
  params.set("preset", store.get("preset"));
  for (const key of urlNumKeys) {
    const value = store.get(key);
    if (typeof value === "number" && Number.isFinite(value)) {
      params.set(key, String(value));
    }
  }
  for (const key of urlBoolKeys) {
    params.set(key, store.get(key) ? "1" : "0");
  }
  params.set("advancedOpen", ids.advancedDetails.open ? "1" : "0");

  const next = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  window.history.replaceState(null, "", next);
}

export function scheduleUrlSync({ state, saveStateToUrl, delayMs = 120 }) {
  if (state.ui.urlSyncTimer) {
    window.clearTimeout(state.ui.urlSyncTimer);
  }
  state.ui.urlSyncTimer = window.setTimeout(() => {
    saveStateToUrl();
    state.ui.urlSyncTimer = null;
  }, delayMs);
}

export function restoreStateFromUrl({ store, ids, presets, urlNumKeys, urlBoolKeys, onIssue = null }) {
  const params = new URLSearchParams(window.location.search);
  if (!params.toString()) {
    return false;
  }
  const issues = [];

  // Precedence contract: apply preset first, then apply explicit URL control params,
  // so a shared link can tweak individual controls on top of a base preset.
  applyPresetParam({ params, store, presets, issues });
  applyNumericParams({ params, store, ids, urlNumKeys, issues });
  applyBooleanParams({ params, store, ids, urlBoolKeys, issues });
  applyAdvancedOpenParam({ params, ids, issues });

  if (issues.length && typeof onIssue === "function") {
    onIssue(formatRestoreIssues(issues));
  }
  return true;
}
