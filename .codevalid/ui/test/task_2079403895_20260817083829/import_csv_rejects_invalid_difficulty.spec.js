import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedImportSession,
  mockRideImportPageShell,
  mockRideImportScenario,
} from "../../helpers/mock-api.js";

test("Import CSV rejects rows with Difficulty outside 1–5 range", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "import_csv_rejects_invalid_difficulty",
    testTitle: testInfo.title,
  });

  await recorder.step("Set up authenticated session and difficulty validation preview/start/status mocks.");
  await setupAuthenticatedImportSession(page);
  await mockRideImportPageShell(page);
  await mockRideImportScenario(page, {
    preview: {
      importJobId: 502,
      totalRows: 3,
      validRows: 2,
      invalidRows: 1,
      duplicateRows: 0,
      requiresDuplicateResolution: false,
      rows: [
        { rowNumber: 1, date: "2026-05-01", miles: 10.2, rideMinutes: 30, notes: null, isValid: true, errors: [], duplicateMatches: [] },
        {
          rowNumber: 2,
          date: "2026-05-02",
          miles: 14.5,
          rideMinutes: 42,
          notes: null,
          isValid: false,
          errors: [
            {
              rowNumber: 2,
              code: "invalid_difficulty",
              field: "Difficulty",
              message: "Invalid Difficulty: must be an integer between 1 and 5.",
            },
          ],
          duplicateMatches: [],
        },
        { rowNumber: 3, date: "2026-05-03", miles: 9.8, rideMinutes: 28, notes: null, isValid: true, errors: [], duplicateMatches: [] },
      ],
    },
    startResponse: {
      importJobId: 502,
      status: "processing",
      startedAtUtc: "2026-08-17T08:10:00.000Z",
    },
    statusResponse: {
      importJobId: 502,
      status: "completed",
      totalRows: 3,
      processedRows: 3,
      importedRows: 2,
      skippedRows: 0,
      failedRows: 1,
      percentComplete: 100,
      etaMinutesRounded: 0,
      createdAtUtc: "2026-08-17T08:10:00.000Z",
      startedAtUtc: "2026-08-17T08:10:01.000Z",
      completedAtUtc: "2026-08-17T08:10:03.000Z",
      lastError: null,
    },
  });

  await recorder.step("Open the ride CSV import page.");
  await page.goto("/rides/import");

  await recorder.step("Upload the CSV and preview validation results.");
  await page.setInputFiles("#csv-upload-input", {
    name: "invalid-difficulty.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Distance,RideMinutes,Difficulty\n2026-05-01,10.2,30,2\n2026-05-02,14.5,42,6\n2026-05-03,9.8,28,4\n"),
  });
  await page.getByRole("button", { name: "Preview Import" }).click();

  await expect(page.getByText("Total rows: 3 | Valid rows: 2 | Invalid rows: 1")).toBeVisible();
  await expect(page.getByText("Row 2: Invalid")).toBeVisible();
  await expect(page.getByText("Difficulty: Invalid Difficulty: must be an integer between 1 and 5.")).toBeVisible();

  await recorder.step("Start the import and verify valid rows still complete.");
  await page.getByRole("button", { name: "Start Import" }).click();
  await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
  await expect(page.getByText("2 rides were imported successfully.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_rejects_invalid_difficulty");
  await recorder.save(testInfo);
});
