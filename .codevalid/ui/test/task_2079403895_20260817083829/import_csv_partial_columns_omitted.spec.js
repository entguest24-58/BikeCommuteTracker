import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedImportSession,
  mockRideImportPageShell,
  mockRideImportScenario,
} from "../../helpers/mock-api.js";

test("Import CSV succeeds when optional columns (Difficulty, Direction, Notes) are completely omitted", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "import_csv_partial_columns_omitted",
    testTitle: testInfo.title,
  });

  await recorder.step("Set up authenticated session and legacy CSV compatibility mocks.");
  await setupAuthenticatedImportSession(page);
  await mockRideImportPageShell(page);
  await mockRideImportScenario(page, {
    preview: {
      importJobId: 506,
      totalRows: 2,
      validRows: 2,
      invalidRows: 0,
      duplicateRows: 0,
      requiresDuplicateResolution: false,
      rows: [
        { rowNumber: 1, date: "2026-04-01", miles: 7.3, rideMinutes: 21, notes: null, isValid: true, errors: [], duplicateMatches: [] },
        { rowNumber: 2, date: "2026-04-02", miles: 8.4, rideMinutes: 25, notes: null, isValid: true, errors: [], duplicateMatches: [] },
      ],
    },
    startResponse: {
      importJobId: 506,
      status: "processing",
      startedAtUtc: "2026-08-17T08:50:00.000Z",
    },
    statusResponse: {
      importJobId: 506,
      status: "completed",
      totalRows: 2,
      processedRows: 2,
      importedRows: 2,
      skippedRows: 0,
      failedRows: 0,
      percentComplete: 100,
      etaMinutesRounded: 0,
      createdAtUtc: "2026-08-17T08:50:00.000Z",
      startedAtUtc: "2026-08-17T08:50:01.000Z",
      completedAtUtc: "2026-08-17T08:50:03.000Z",
      lastError: null,
    },
  });

  await recorder.step("Open the ride CSV import page.");
  await page.goto("/rides/import");

  await recorder.step("Upload the CSV with only required columns and preview it.");
  await page.setInputFiles("#csv-upload-input", {
    name: "legacy-columns.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Distance,RideMinutes\n2026-04-01,7.3,21\n2026-04-02,8.4,25\n"),
  });
  await page.getByRole("button", { name: "Preview Import" }).click();

  await expect(page.getByText("Total rows: 2 | Valid rows: 2 | Invalid rows: 0")).toBeVisible();

  await recorder.step("Start import and verify legacy-format rows complete successfully.");
  await page.getByRole("button", { name: "Start Import" }).click();
  await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
  await expect(page.getByText("2 rides were imported successfully.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_partial_columns_omitted");
  await recorder.save(testInfo);
});
