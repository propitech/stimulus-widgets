import { test, expect } from "@playwright/test";

// These assertions encode the PRO-992 lifecycle contract the whole package
// exists to guarantee: the controller mounts on a stable wrapper (never the
// element the library reparents), builds the widget exactly once (a loop would
// hang the browser or nest wrappers), and restores plain markup before Turbo
// caches the page.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("select mounts on the wrapper, not the reparented <select>", async ({
  page,
}) => {
  const field = page.locator("#select-field");
  // Built exactly once — no connect/disconnect loop.
  await expect(field.locator(".choices")).toHaveCount(1);
  await expect(field.locator("select")).toHaveCount(1);
  // The invariant: data-controller is on the wrapper, never the moved element.
  await expect(page.locator("select[data-controller]")).toHaveCount(0);
});

test("select restores a plain <select> on turbo:before-cache", async ({
  page,
}) => {
  await page.evaluate(() =>
    document.dispatchEvent(new Event("turbo:before-cache")),
  );
  await expect(page.locator("#select-field .choices")).toHaveCount(0);
  await expect(page.locator("#select-field > select")).toHaveCount(1);
});

test("datepicker mounts on the wrapper and opens a calendar", async ({
  page,
}) => {
  await expect(page.locator("#date-field input.flatpickr-input")).toHaveCount(
    1,
  );
  await expect(page.locator("input[data-controller]")).toHaveCount(0);

  await page.locator("#d").click();
  await expect(page.locator(".flatpickr-calendar.open")).toBeVisible();
});

test("datepicker tears down its calendar on turbo:before-cache", async ({
  page,
}) => {
  await page.locator("#d").click();
  await expect(page.locator("#date-field .flatpickr-calendar")).toHaveCount(1);

  await page.evaluate(() =>
    document.dispatchEvent(new Event("turbo:before-cache")),
  );
  await expect(page.locator("#date-field .flatpickr-calendar")).toHaveCount(0);
  await expect(page.locator("#date-field input")).toHaveCount(1);
});

test("timepicker opens a time-only popup", async ({ page }) => {
  await page.locator("#t").click();
  const popup = page.locator(".flatpickr-calendar.open");
  await expect(popup).toBeVisible();
  await expect(popup).toHaveClass(/hasTime/);
  await expect(popup).toHaveClass(/noCalendar/);
});
