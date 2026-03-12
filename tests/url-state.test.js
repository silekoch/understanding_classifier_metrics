import { describe, expect, it, vi } from "vitest";
import { restoreStateFromUrl } from "../ui/url-state.js";
import { URL_BOOL_KEYS, URL_NUM_KEYS } from "../ui/url-state-keys.js";

function makeStore(initial = {}) {
  const values = { ...initial };
  return {
    get: (key) => values[key],
    set: (key, nextValue) => {
      values[key] = nextValue;
    },
  };
}

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
    const store = makeStore({ preset: "separated", muNeg: 0, threshold: 1 });
    const presets = { separated: { muNeg: 0.2 } };

    const oldWindow = globalThis.window;
    globalThis.window = {
      location: {
        search: "?preset=separated&muNeg=0.8&advancedOpen=1",
      },
    };

    try {
      restoreStateFromUrl({
        store,
        ids,
        presets,
        urlNumKeys: URL_NUM_KEYS,
        urlBoolKeys: URL_BOOL_KEYS,
      });

      expect(store.get("preset")).toBe("separated");
      expect(store.get("muNeg")).toBe(0.8);
      expect(ids.advancedDetails.open).toBe(true);
    } finally {
      globalThis.window = oldWindow;
    }
  });

  it("reports ignored invalid URL params", () => {
    const ids = makeIds();
    const store = makeStore({ preset: "separated", muNeg: 0, threshold: 1 });
    const presets = { separated: { muNeg: 0.2 } };
    const onIssue = vi.fn();

    const oldWindow = globalThis.window;
    globalThis.window = {
      location: {
        search: "?preset=doesNotExist&muNeg=abc&advancedOpen=maybe",
      },
    };

    try {
      restoreStateFromUrl({
        store,
        ids,
        presets,
        urlNumKeys: URL_NUM_KEYS,
        urlBoolKeys: URL_BOOL_KEYS,
        onIssue,
      });

      expect(store.get("preset")).toBe("separated");
      expect(store.get("muNeg")).toBe(0);
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
