import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedBikeSession,
  mockRideImportScenario,
  mockSampleRideCsvDownload,
} from "../../helpers/mock-api.js";
import {
  rideImportSampleCsv,
  invalidRideImportPreview,
} from "../../mock/mock-data.js";

test("CSV import exposes sample download and row-level validation errors for difficulty, direction, and notes", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "csv_import_sample_and_validation_preview",
    testTitle: testInfo.title,
  });

  await recorder.step("seed auth and import preview mocks", async () => {
    await setupAuthenticatedBikeSession(page);
    await mockSampleRideCsvDownload(page, rideImportSampleCsv);
    await mockRideImportScenario(page, {
      preview: invalidRideImportPreview,
    });
  });

  await recorder.step("open import page and verify sample CSV download button", async () => {
    await page.goto("/rides/import");
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download sample CSV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("ride-import-sample.csv");
  });

  await recorder.step("upload CSV and preview row-level validation errors", async () => {
    await page.locator("#csv-upload-input").setInputFiles({
      name: "rides.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("Date,Distance,RideMinutes,Difficulty,Direction,Notes\n2024-06-10,10,30,6,Up,bad\n", "utf-8"),
    });
    await page.getByRole("button", { name: "Preview Import" }).click();
    await expect(page.getByText("Preview Summary")).toBeVisible();
    await expect(page.getByText("Difficulty: Difficulty must be between 1 and 5.")).toBeVisible();
    await expect(page.getByText(/Direction: Invalid direction/)).toBeVisible();
    await expect(page.getByText("Notes: Note must not exceed 500 characters.")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_sample_and_validation_preview");
  await recorder.save(testInfo);
});
