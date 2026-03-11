import { CONTROL_SPECS, PRESET_CONTROL_KEYS, sanitizeControlValue } from "./control-specs.js";

const PRESET_META_KEYS = new Set(["mode", "desc"]);
const PRESET_CONTROL_KEY_SET = new Set(PRESET_CONTROL_KEYS);

function pushIssue(issues, issue) {
  issues.push(issue);
}

function validatePresetValue({ issues, presetName, key, rawValue }) {
  if (!PRESET_CONTROL_KEY_SET.has(key) || !CONTROL_SPECS[key]) {
    pushIssue(issues, {
      code: "unknown_preset_key",
      presetName,
      key,
      message: `Preset "${presetName}" uses unknown key "${key}".`,
    });
    return;
  }
  if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
    pushIssue(issues, {
      code: "invalid_preset_value",
      presetName,
      key,
      message: `Preset "${presetName}" has non-finite numeric value for "${key}".`,
    });
    return;
  }
  const sanitizedValue = sanitizeControlValue(key, rawValue);
  if (!Number.isFinite(sanitizedValue)) {
    pushIssue(issues, {
      code: "invalid_sanitized_value",
      presetName,
      key,
      message: `Preset "${presetName}" sanitization failed for "${key}".`,
    });
  }
}

function validatePresetObject({ issues, presetName, preset }) {
  for (const [key, rawValue] of Object.entries(preset)) {
    if (PRESET_META_KEYS.has(key)) {
      continue;
    }
    validatePresetValue({ issues, presetName, key, rawValue });
  }
}

export function validatePresets(presets) {
  const issues = [];
  for (const [presetName, preset] of Object.entries(presets || {})) {
    if (!preset || typeof preset !== "object") {
      pushIssue(issues, {
        code: "invalid_preset_object",
        presetName,
        message: `Preset "${presetName}" must be an object.`,
      });
      continue;
    }
    validatePresetObject({ issues, presetName, preset });
  }

  return issues;
}

export function assertValidPresets(presets) {
  const issues = validatePresets(presets);
  if (!issues.length) {
    return;
  }
  const details = issues.map((issue) => issue.message).join(" ");
  throw new Error(`Preset validation failed. ${details}`);
}
