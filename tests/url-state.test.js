import { describe, expect, it } from "vitest";
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
});
