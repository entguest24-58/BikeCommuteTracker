import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupImportRidesPageScenario,
} from "../../helpers/mock-api.js";

test("Duplicate ride entries trigger the DuplicateResolutionDialog for user review", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("duplicate_rides_trigger_resolution_dialog", "Duplicate ride entries trigger the DuplicateResolutionDialog for user review");

  await recorder.step("Seed authenticated session and duplicate-preview import scenario", async () => {
    await setupAuthenticatedSession(page);
    await setupImportRidesPageScenario(page, {
      preview: "duplicatesRequireResolution",
      start: "processing",
      statusSequence: "processingProgress",
      enableRealtime: false,
    });
  });

  await recorder.step("Open import page, upload CSV, and preview duplicate rows", async () => {
    await page.goto("/rides/import");
    await page.locator("#csv-upload-input").setInputFiles({
      name: "duplicates.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("date,miles\n2026-08-01,12.4\n", "utf-8"),
    });
    await page.getByRole("button", { name: "Preview Import" }).click();
    await expect(page.getByRole("heading", { name: "Preview Summary" })).toBeVisible();
  });

  await recorder.step("Start import and verify duplicate resolution dialog opens", async () => {
    await page.getByRole("button", { name: "Start Import" }).click();
    await expect(page.getByRole("dialog", { name: "Duplicate resolution" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Resolve duplicates" })).toBeVisible();
    await expect(page.getByText(/duplicate row requires|duplicate rows require/i)).toBeVisible();
    await expect(page.getByText("Incoming ride: 2026-08-01 • 12.4 mi")).toBeVisible();
    await expect(page.getByText("Existing ride #9001: 2026-08-01 • 12.4 mi")).toBeVisible();
    await expect(page.getByLabel("Override all duplicates")).toBeVisible();
    await expect(page.getByText("Row 1 keep existing")).toBeVisible();
    await expect(page.getByText("Row 1 replace with import")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Start Import" })).toBeDisabled();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:duplicate_rides_trigger_resolution_dialog");
  await recorder.save(testInfo);
});
