import { describe, expect, it } from "vitest";
import { clearStatusBanner, showStatusBanner } from "../ui/status-banner.js";

function makeClassList(initial = []) {
  const classes = new Set(initial);
  return {
    add: (className) => classes.add(className),
    remove: (className) => classes.delete(className),
    has: (className) => classes.has(className),
  };
}

function makeBanner() {
  return {
    hidden: true,
    textContent: "",
    classList: makeClassList(),
  };
}

describe("status banner", () => {
  it("shows warning banner text and class", () => {
    const banner = makeBanner();

    showStatusBanner({
      el: banner,
      level: "warning",
      message: "Test warning message",
    });

    expect(banner.hidden).toBe(false);
    expect(banner.textContent).toBe("Test warning message");
    expect(banner.classList.has("status-banner--warning")).toBe(true);
  });

  it("clears banner visibility, class, and message", () => {
    const banner = makeBanner();
    showStatusBanner({
      el: banner,
      level: "error",
      message: "Fatal issue",
    });

    clearStatusBanner({ el: banner });

    expect(banner.hidden).toBe(true);
    expect(banner.textContent).toBe("");
    expect(banner.classList.has("status-banner--error")).toBe(false);
  });

  it("no-ops safely when banner element is missing", () => {
    expect(() => showStatusBanner({ el: null, level: "warning", message: "x" })).not.toThrow();
    expect(() => clearStatusBanner({ el: null })).not.toThrow();
  });
});
