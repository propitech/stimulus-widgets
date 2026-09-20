import { test, expect } from "@playwright/test";

// These assertions encode the PRO-992 lifecycle contract for AvatarUploadController:
// Uppy's inline Dashboard mounts exactly once into the `dashboard` target (never
// onto the controller element itself), and both the Dashboard and the target's
// injected markup are gone after `turbo:before-cache` so a restore re-inits on a
// clean, empty container rather than stacking a second live Uppy.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("avatar mounts one Uppy Dashboard into the target, not the controller element", async ({
  page,
}) => {
  const field = page.locator("#avatar-field");
  // Built exactly once — no connect/disconnect loop, no stacked Dashboards.
  await expect(field.locator(".uppy-Dashboard")).toHaveCount(1);
  // The Dashboard lands inside the `dashboard` target, and the controller stays
  // on the stable wrapper — the widget never reparents the controller element.
  await expect(
    field.locator("[data-avatar-upload-target='dashboard'] .uppy-Dashboard"),
  ).toHaveCount(1);
  await expect(page.locator(".uppy-Dashboard[data-controller]")).toHaveCount(0);
});

test("avatar tears the Dashboard down and clears the target on turbo:before-cache", async ({
  page,
}) => {
  await expect(page.locator("#avatar-field .uppy-Dashboard")).toHaveCount(1);

  await page.evaluate(() =>
    document.dispatchEvent(new Event("turbo:before-cache")),
  );

  // destroy() removes the Dashboard, and the base's unmountWidget override
  // empties the target so Turbo caches a clean container.
  await expect(page.locator("#avatar-field .uppy-Dashboard")).toHaveCount(0);
  const target = page.locator(
    "#avatar-field [data-avatar-upload-target='dashboard']",
  );
  await expect(target).toHaveCount(1);
  await expect(target.locator("*")).toHaveCount(0);
});

test("avatar runs a file through the vendored ActiveStorage uploader and writes the signed id", async ({
  page,
}) => {
  await page.route("**/rails/active_storage/direct_uploads", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        signed_id: "fake-signed-id",
        filename: "avatar.png",
        content_type: "image/png",
        byte_size: 4,
        checksum: "deadbeef==",
        direct_upload: { url: "https://blob.example/put", headers: {} },
      }),
    }),
  );
  await page.route("https://blob.example/put", (route) =>
    route.fulfill({ status: 200, body: "" }),
  );

  const field = page.locator("#avatar-field");
  await field
    .locator("input.uppy-Dashboard-input:not([webkitdirectory])")
    .setInputFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: Buffer.from([137, 80, 78, 71]),
    });
  await field.locator(".uppy-StatusBar-actionBtn--upload").click();

  await expect(field.locator("input[name='avatar']")).toHaveValue(
    "fake-signed-id",
  );
});

test("avatar upload releases its per-upload uppy listeners once the upload settles", async ({
  page,
}) => {
  await page.route("**/rails/active_storage/direct_uploads", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        signed_id: "fake-signed-id",
        filename: "avatar.png",
        content_type: "image/png",
        byte_size: 4,
        checksum: "deadbeef==",
        direct_upload: { url: "https://blob.example/put", headers: {} },
      }),
    }),
  );
  await page.route("https://blob.example/put", (route) =>
    route.fulfill({ status: 200, body: "" }),
  );

  // Count net listeners the vendored plugin adds per upload() call for the
  // two events it wraps in an EventManager: a leak would leave one of each
  // behind after the upload settles.
  await page.evaluate(() => {
    const field = document.querySelector("#avatar-field");
    const controller = window.stimulus.getControllerForElementAndIdentifier(
      field,
      "avatar-upload",
    );
    const uppy = controller.widget;
    const tracked = ["file-removed", "cancel-all"];
    window.__netListeners = { "file-removed": 0, "cancel-all": 0 };
    const originalOn = uppy.on.bind(uppy);
    const originalOff = uppy.off.bind(uppy);
    uppy.on = (event, fn) => {
      if (tracked.includes(event)) window.__netListeners[event] += 1;
      return originalOn(event, fn);
    };
    uppy.off = (event, fn) => {
      if (tracked.includes(event)) window.__netListeners[event] -= 1;
      return originalOff(event, fn);
    };
  });

  const field = page.locator("#avatar-field");
  await field
    .locator("input.uppy-Dashboard-input:not([webkitdirectory])")
    .setInputFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: Buffer.from([137, 80, 78, 71]),
    });
  await field.locator(".uppy-StatusBar-actionBtn--upload").click();
  await expect(field.locator("input[name='avatar']")).toHaveValue(
    "fake-signed-id",
  );

  const remaining = await page.evaluate(() => window.__netListeners);
  expect(remaining).toEqual({ "file-removed": 0, "cancel-all": 0 });
});
