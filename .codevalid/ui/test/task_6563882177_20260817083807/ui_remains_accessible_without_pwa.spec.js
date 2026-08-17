import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupImportRidesPageScenario,
  setupUnsupportedPwaBrowserMode,
} from "../../helpers/mock-api.js";

test("PWA-unavailable environment does not block or degrade UI functionality on ImportRidesPage", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("ui_remains_accessible_without_pwa", "PWA-unavailable environment does not block or degrade UI functionality on ImportRidesPage");

  await recorder.step("Seed unsupported-PWA browser environment, authenticated session, and import routes", async () => {
    await setupUnsupportedPwaBrowserMode(page);
    await setupAuthenticatedSession(page);
    await setupImportRidesPageScenario(page, {
      preview: "duplicatesRequireResolution",
      start: "processing",
      statusSequence: "processingProgress",
      enableRealtime: false,
    });
  });

  await recorder.step("Open Import Rides page in browser mode", async () => {
    await page.goto("/rides/import");
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();
    await expect(page.locator("#csv-upload-input")).toBeVisible();
    await expect(page.getByRole("button", { name: "Preview Import" })).toBeEnabled();
  });

  await recorder.step("Upload a CSV and begin import flow", async () => {
    await page.locator("#csv-upload-input").setInputFiles({
      name: "browser-mode.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("date,miles\n2026-08-01,12.4\n", "utf-8"),
    });
    await page.getByRole("button", { name: "Preview Import" }).click();
    await page.getByRole("button", { name: "Start Import" }).click();
  });

  await recorder.step("Verify duplicate resolution works and no install prompt blocks usage", async () => {
    await expect(page.getByRole("heading", { name: "Resolve duplicates" })).toBeVisible();
    await expect(page.getByLabel("Override all duplicates")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Install" })).toHaveCount(0);
    await expect(page.getByText(/PWA installation is not supported/i)).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:ui_remains_accessible_without_pwa");
  await recorder.save(testInfo);
});
