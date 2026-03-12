import { expect, test } from "@playwright/test";

const REQUIRED_SVGS = ["rocSvg", "prSvg", "distSvg", "confusionSvg", "metricTrendSvg"];

test("cold startup renders all chart panels", async ({ page }) => {
  await page.goto("/");

  for (const id of REQUIRED_SVGS) {
    await expect
      .poll(
        async () => {
          return page.evaluate((svgId) => {
            const svg = document.getElementById(svgId);
            return svg ? svg.childElementCount : 0;
          }, id);
        },
        {
          message: `expected #${id} to render at least one SVG child on startup`,
        }
      )
      .toBeGreaterThan(0);
  }
});

test("clicking score distribution repositions threshold", async ({ page }) => {
  await page.goto("/");

  const handle = page.getByLabel("Threshold handle");
  const getThreshold = async () => Number(await handle.getAttribute("aria-valuenow"));

  await expect.poll(getThreshold).toBeGreaterThan(Number.NEGATIVE_INFINITY);
  const before = await getThreshold();

  await page.locator("#distSvg").click({ position: { x: 110, y: 120 } });
  await expect.poll(getThreshold).not.toBe(before);
  const afterLeftClick = await getThreshold();

  await page.locator("#distSvg").click({ position: { x: 700, y: 120 } });
  await expect.poll(getThreshold).toBeGreaterThan(afterLeftClick);
});

test("invalid URL params show warning and still render on cold startup", async ({ page }) => {
  await page.goto("/?preset=doesNotExist&muNeg=abc&advancedOpen=maybe");

  const statusBanner = page.locator("#statusBanner");
  await expect(statusBanner).toBeVisible();
  await expect(statusBanner).toContainText('Unknown preset "doesNotExist" was ignored.');
  await expect(statusBanner).toContainText('Invalid numeric value "abc" for "muNeg" was ignored.');

  for (const id of REQUIRED_SVGS) {
    await expect
      .poll(async () => {
        return page.evaluate((svgId) => {
          const svg = document.getElementById(svgId);
          return svg ? svg.childElementCount : 0;
        }, id);
      })
      .toBeGreaterThan(0);
  }
});
