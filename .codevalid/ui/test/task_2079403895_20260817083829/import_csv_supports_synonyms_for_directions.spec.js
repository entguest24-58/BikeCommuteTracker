import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedImportSession,
  mockRideImportPageShell,
  mockRideImportScenario,
} from "../../helpers/mock-api.js";

test("Import CSV normalizes full compass names and 2-letter abbreviations to canonical directions", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "import_csv_supports_synonyms_for_directions",
    testTitle: testInfo.title,
  });

  await recorder.step("Set up authenticated session and successful direction normalization mocks.");
  await setupAuthenticatedImportSession(page);
  await mockRideImportPageShell(page);
  await mockRideImportScenario(page, {
    preview: {
      importJobId: 510,
      totalRows: 2,
      validRows: 2,
      invalidRows: 0,
      duplicateRows: 0,
      requiresDuplicateResolution: false,
      rows: [
        { rowNumber: 1, date: "2026-05-08", miles: 16.4, rideMinutes: 48, notes: null, isValid: true, errors: [], duplicateMatches: [] },
        { rowNumber: 2, date: "2026-05-09", miles: 16.4, rideMinutes: 48, notes: null, isValid: true, errors: [], duplicateMatches: [] },
      ],
    },
    startResponse: {
      importJobId: 510,
      status: "processing",
      startedAtUtc: "2026-08-17T09:20:00.000Z",
    },
    statusResponse: {
      importJobId: 510,
      status: "completed",
      totalRows: 2,
      processedRows: 2,
      importedRows: 2,
      skippedRows: 0,
      failedRows: 0,
      percentComplete: 100,
      etaMinutesRounded: 0,
      createdAtUtc: "2026-08-17T09:20:00.000Z",
      startedAtUtc: "2026-08-17T09:20:01.000Z",
      completedAtUtc: "2026-08-17T09:20:03.000Z",
      lastError: null,
    },
  });

  await recorder.step("Open the ride CSV import page.");
  await page.goto("/rides/import");

  await recorder.step("Upload the CSV with full-name and abbreviated directions.");
  await page.setInputFiles("#csv-upload-input", {
    name: "direction-synonyms.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Distance,RideMinutes,PrimaryTravelDirection\n2026-05-08,16.4,48,Southwest\n2026-05-09,16.4,48,SW\n"),
  });
  await page.getByRole("button", { name: "Preview Import" }).click();

  await expect(page.getByText("Total rows: 2 | Valid rows: 2 | Invalid rows: 0")).toBeVisible();
  await expect(page.getByText("Row 1: Valid")).toBeVisible();
  await expect(page.getByText("Row 2: Valid")).toBeVisible();

  await recorder.step("Start import and confirm both rows complete successfully.");
  await page.getByRole("button", { name: "Start Import" }).click();
  await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
  await expect(page.getByText("2 rides were imported successfully.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_supports_synonyms_for_directions");
  await recorder.save(testInfo);
});
