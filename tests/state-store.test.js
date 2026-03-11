import { describe, expect, it, vi } from "vitest";
import { createStateStore } from "../core/state-store.js";

describe("state store", () => {
  it("notifies subscribers when a key changes", () => {
    const store = createStateStore({ threshold: 0.4 });
    const callback = vi.fn();
    store.subscribe("threshold", callback);

    const changed = store.set("threshold", 0.6);
    expect(changed).toBe(true);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(0.6, 0.4);
  });

  it("does not notify when setting identical values", () => {
    const store = createStateStore({ threshold: 0.4 });
    const callback = vi.fn();
    store.subscribe("threshold", callback);

    const changed = store.set("threshold", 0.4);
    expect(changed).toBe(false);
    expect(callback).not.toHaveBeenCalled();
  });

  it("supports batched updates and emits final value once per key", () => {
    const store = createStateStore({ threshold: 0.3 });
    const callback = vi.fn();
    store.subscribe("threshold", callback);

    store.batch(() => {
      store.set("threshold", 0.4);
      store.set("threshold", 0.7);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(0.7, 0.3);
  });

  it("allows unsubscribing listeners", () => {
    const store = createStateStore({ threshold: 0.4 });
    const callback = vi.fn();
    const unsubscribe = store.subscribe("threshold", callback);

    unsubscribe();
    store.set("threshold", 0.8);

    expect(callback).not.toHaveBeenCalled();
  });
});
