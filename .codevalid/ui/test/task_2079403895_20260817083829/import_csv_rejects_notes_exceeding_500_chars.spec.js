import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedImportSession,
  mockRideImportPageShell,
  mockRideImportScenario,
} from "../../helpers/mock-api.js";

test("Import CSV rejects rows with Notes exceeding 500 characters", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "import_csv_rejects_notes_exceeding_500_chars",
    testTitle: testInfo.title,
  });

  await recorder.step("Set up authenticated session and notes-length validation mocks.");
  await setupAuthenticatedImportSession(page);
  await mockRideImportPageShell(page);
  await mockRideImportScenario(page, {
    preview: {
      importJobId: 504,
      totalRows: 2,
      validRows: 1,
      invalidRows: 1,
      duplicateRows: 0,
      requiresDuplicateResolution: false,
      rows: [
        { rowNumber: 1, date: "2026-05-01", miles: 11.1, rideMinutes: 34, notes: "Valid note", isValid: true, errors: [], duplicateMatches: [] },
        {
          rowNumber: 2,
          date: "2026-05-02",
          miles: 12.8,
          rideMinutes: 40,
          notes: null,
          isValid: false,
          errors: [
            {
              rowNumber: 2,
              code: "notes_too_long",
              field: "Notes",
              message: "Notes exceed maximum length of 500 characters.",
            },
          ],
          duplicateMatches: [],
        },
      ],
    },
    startResponse: {
      importJobId: 504,
      status: "processing",
      startedAtUtc: "2026-08-17T08:30:00.000Z",
    },
    statusResponse: {
      importJobId: 504,
      status: "completed",
      totalRows: 2,
      processedRows: 2,
      importedRows: 1,
      skippedRows: 0,
      failedRows: 1,
      percentComplete: 100,
      etaMinutesRounded: 0,
      createdAtUtc: "2026-08-17T08:30:00.000Z",
      startedAtUtc: "2026-08-17T08:30:01.000Z",
      completedAtUtc: "2026-08-17T08:30:03.000Z",
      lastError: null,
    },
  });

  await recorder.step("Open the ride CSV import page.");
  await page.goto("/rides/import");

  await recorder.step("Upload the CSV and preview notes validation results.");
  await page.setInputFiles("#csv-upload-input", {
    name: "notes-too-long.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Distance,RideMinutes,Notes\n2026-05-01,11.1,34,Valid note\n2026-05-02,12.8,40,TOO-LONG\n"),
  });
  await page.getByRole("button", { name: "Preview Import" }).click();

  await expect(page.getByText("Total rows: 2 | Valid rows: 1 | Invalid rows: 1")).toBeVisible();
  await expect(page.getByText("Notes: Notes exceed maximum length of 500 characters.")).toBeVisible();

  await recorder.step("Start import and verify the valid row still completes.");
  await page.getByRole("button", { name: "Start Import" }).click();
  await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
  await expect(page.getByText("1 rides were imported successfully.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_rejects_notes_exceeding_500_chars");
  await recorder.save(testInfo);
});
