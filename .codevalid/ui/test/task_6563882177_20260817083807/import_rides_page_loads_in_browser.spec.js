import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupImportRidesPageScenario,
} from "../../helpers/mock-api.js";

test("ImportRidesPage loads and renders fully in browser without PWA", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_rides_page_loads_in_browser", "ImportRidesPage loads and renders fully in browser without PWA");

  await recorder.step("Seed authenticated browser session and import page mock routes", async () => {
    await setupAuthenticatedSession(page);
    await setupImportRidesPageScenario(page);
  });

  await recorder.step("Navigate to /rides/import", async () => {
    await page.goto("/rides/import");
  });

  await recorder.step("Verify import page renders browser-mode import UI", async () => {
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();
    await expect(page.locator("#csv-upload-input")).toBeVisible();
    await expect(page.getByRole("button", { name: "Preview Import" })).toBeVisible();
    await expect(page.getByText("Start an import to see progress and cancellation controls.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Monthly Summary Import" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download sample CSV" })).toBeVisible();
    await expect(page.getByText("No file selected.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Resolve duplicates" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Import Progress" })).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:import_rides_page_loads_in_browser");
  await recorder.save(testInfo);
});
