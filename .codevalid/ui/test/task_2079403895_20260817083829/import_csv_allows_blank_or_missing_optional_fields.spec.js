import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedImportSession,
  mockRideImportPageShell,
  mockRideImportScenario,
} from "../../helpers/mock-api.js";

test("Import CSV accepts rows with blank or missing Difficulty, Direction, or Notes fields", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "import_csv_allows_blank_or_missing_optional_fields",
    testTitle: testInfo.title,
  });

  await recorder.step("Set up authenticated session and blank optional-field import mocks.");
  await setupAuthenticatedImportSession(page);
  await mockRideImportPageShell(page);
  await mockRideImportScenario(page, {
    preview: {
      importJobId: 505,
      totalRows: 2,
      validRows: 2,
      invalidRows: 0,
      duplicateRows: 0,
      requiresDuplicateResolution: false,
      rows: [
        { rowNumber: 1, date: "2026-05-01", miles: 10.5, rideMinutes: 31, notes: "", isValid: true, errors: [], duplicateMatches: [] },
        { rowNumber: 2, date: "2026-05-02", miles: 13.2, rideMinutes: 39, notes: "", isValid: true, errors: [], duplicateMatches: [] },
      ],
    },
    startResponse: {
      importJobId: 505,
      status: "processing",
      startedAtUtc: "2026-08-17T08:40:00.000Z",
    },
    statusResponse: {
      importJobId: 505,
      status: "completed",
      totalRows: 2,
      processedRows: 2,
      importedRows: 2,
      skippedRows: 0,
      failedRows: 0,
      percentComplete: 100,
      etaMinutesRounded: 0,
      createdAtUtc: "2026-08-17T08:40:00.000Z",
      startedAtUtc: "2026-08-17T08:40:01.000Z",
      completedAtUtc: "2026-08-17T08:40:03.000Z",
      lastError: null,
    },
  });

  await recorder.step("Open the ride CSV import page.");
  await page.goto("/rides/import");

  await recorder.step("Upload the CSV containing blank optional fields and preview it.");
  await page.setInputFiles("#csv-upload-input", {
    name: "blank-optional-fields.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Distance,RideMinutes,Difficulty,PrimaryTravelDirection,Notes\n2026-05-01,10.5,31,3,,\n2026-05-02,13.2,39,,E,\n"),
  });
  await page.getByRole("button", { name: "Preview Import" }).click();

  await expect(page.getByText("Total rows: 2 | Valid rows: 2 | Invalid rows: 0")).toBeVisible();
  await expect(page.getByText("Row 1: Valid")).toBeVisible();
  await expect(page.getByText("Row 2: Valid")).toBeVisible();

  await recorder.step("Start import and verify both rows complete with no errors.");
  await page.getByRole("button", { name: "Start Import" }).click();
  await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
  await expect(page.getByText("2 rides were imported successfully.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_allows_blank_or_missing_optional_fields");
  await recorder.save(testInfo);
});
