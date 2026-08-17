import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupImportRidesPageScenario,
} from "../../helpers/mock-api.js";

test("Import progress panel displays real-time progress during ride import", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_progress_shown_during_processing", "Import progress panel displays real-time progress during ride import");

  await recorder.step("Seed authenticated session and processing import scenario", async () => {
    await setupAuthenticatedSession(page);
    await setupImportRidesPageScenario(page, {
      preview: "processingNoDuplicates",
      start: "processing",
      statusSequence: "processingProgress",
      enableRealtime: false,
    });
  });

  await recorder.step("Navigate to the import page and upload a CSV file", async () => {
    await page.goto("/rides/import");
    await page.locator("#csv-upload-input").setInputFiles({
      name: "progress.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("date,miles\n2026-08-01,10\n2026-08-02,11\n", "utf-8"),
    });
  });

  await recorder.step("Preview the import", async () => {
    await page.getByRole("button", { name: "Preview Import" }).click();
    await expect(page.getByRole("heading", { name: "Preview Summary" })).toBeVisible();
  });

  await recorder.step("Start import and verify progress panel appears with live status details", async () => {
    await page.getByRole("button", { name: "Start Import" }).click();
    await expect(page.getByRole("heading", { name: "Import Progress" })).toBeVisible();
    await expect(page.getByText(/Status: processing/i)).toBeVisible();
    await expect(page.getByText(/Complete: 50%/i)).toBeVisible();
    await expect(page.getByText(/ETA:/i)).toBeVisible();
    await expect(page.getByText(/Imported: 1/i)).toBeVisible();
    await expect(page.getByText(/Skipped: 0/i)).toBeVisible();
    await expect(page.getByText(/Failed: 0/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel Import" })).toBeEnabled();
    await expect(page.locator('progress[aria-label="ETA progress"]')).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:import_progress_shown_during_processing");
  await recorder.save(testInfo);
});
