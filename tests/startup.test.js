import { describe, expect, it, vi } from "vitest";
import { runStartupRender } from "../ui/startup.js";

describe("startup render flow", () => {
  it("restores controls and renders when URL state was restored", () => {
    const setPresetFromControls = vi.fn();
    const regenerateAndRender = vi.fn();

    runStartupRender({
      restored: true,
      setPresetFromControls,
      regenerateAndRender,
    });

    expect(regenerateAndRender).toHaveBeenCalledTimes(1);
    expect(setPresetFromControls).not.toHaveBeenCalled();
  });

  it("falls back to a full render when preset set is a no-op", () => {
    const setPresetFromControls = vi.fn(() => false);
    const regenerateAndRender = vi.fn();

    runStartupRender({
      restored: false,
      setPresetFromControls,
      regenerateAndRender,
    });

    expect(setPresetFromControls).toHaveBeenCalledTimes(1);
    expect(regenerateAndRender).toHaveBeenCalledTimes(1);
  });

  it("does not force fallback render when preset set triggers reactive render", () => {
    const setPresetFromControls = vi.fn(() => true);
    const regenerateAndRender = vi.fn();

    runStartupRender({
      restored: false,
      setPresetFromControls,
      regenerateAndRender,
    });

    expect(setPresetFromControls).toHaveBeenCalledTimes(1);
    expect(regenerateAndRender).not.toHaveBeenCalled();
  });
});
