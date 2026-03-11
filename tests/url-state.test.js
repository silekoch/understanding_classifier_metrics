import { describe, expect, it, vi } from "vitest";
import { restoreStateFromUrl } from "../ui/url-state.js";
import { URL_BOOL_KEYS, URL_NUM_KEYS } from "../ui/url-state-keys.js";

function makeIds() {
  return {
    preset: { value: "separated" },
    muNeg: { value: "0" },
    advancedDetails: { open: false },
  };
}

describe("url state restore", () => {
  it("applies preset first, then URL params override it", () => {
    const ids = makeIds();
    const presets = { separated: { muNeg: 0.2 } };
    const applyPresetValues = (name) => {
      ids.preset.value = name;
      ids.muNeg.value = String(presets[name].muNeg);
    };

    const oldWindow = globalThis.window;
    globalThis.window = {
      location: {
        search: "?preset=separated&muNeg=0.8&advancedOpen=1",
      },
    };

    try {
      const restored = restoreStateFromUrl({
        ids,
        presets,
        applyPresetValues,
        urlNumKeys: URL_NUM_KEYS,
        urlBoolKeys: URL_BOOL_KEYS,
      });

      expect(restored).toBe(true);
      expect(ids.preset.value).toBe("separated");
      expect(ids.muNeg.value).toBe("0.8");
      expect(ids.advancedDetails.open).toBe(true);
    } finally {
      globalThis.window = oldWindow;
    }
  });

  it("reports ignored invalid URL params", () => {
    const ids = makeIds();
    const presets = { separated: { muNeg: 0.2 } };
    const applyPresetValues = (name) => {
      ids.preset.value = name;
      ids.muNeg.value = String(presets[name]?.muNeg ?? ids.muNeg.value);
    };
    const onIssue = vi.fn();

    const oldWindow = globalThis.window;
    globalThis.window = {
      location: {
        search: "?preset=doesNotExist&muNeg=abc&advancedOpen=maybe",
      },
    };

    try {
      const restored = restoreStateFromUrl({
        ids,
        presets,
        applyPresetValues,
        urlNumKeys: URL_NUM_KEYS,
        urlBoolKeys: URL_BOOL_KEYS,
        onIssue,
      });

      expect(restored).toBe(true);
      expect(ids.preset.value).toBe("separated");
      expect(ids.muNeg.value).toBe("0.2");
      expect(ids.advancedDetails.open).toBe(false);
      expect(onIssue).toHaveBeenCalledTimes(1);
      expect(onIssue.mock.calls[0][0]).toContain('Unknown preset "doesNotExist" was ignored.');
      expect(onIssue.mock.calls[0][0]).toContain('Invalid numeric value "abc" for "muNeg" was ignored.');
      expect(onIssue.mock.calls[0][0]).toContain(
        'Invalid boolean value "maybe" for "advancedOpen" was ignored.'
      );
    } finally {
      globalThis.window = oldWindow;
    }
  });
});
