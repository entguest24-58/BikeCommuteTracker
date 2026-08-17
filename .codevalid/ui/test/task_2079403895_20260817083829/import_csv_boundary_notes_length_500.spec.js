import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedImportSession,
  mockRideImportPageShell,
  mockRideImportScenario,
} from "../../helpers/mock-api.js";

test("Import CSV accepts Notes field with exactly 500 characters", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "import_csv_boundary_notes_length_500",
    testTitle: `${testInfo.title} - 500 chars accepted`,
  });

  const note500 = "a".repeat(500);

  await recorder.step("Set up authenticated session and exact-500-character success mocks.");
  await setupAuthenticatedImportSession(page);
  await mockRideImportPageShell(page);
  await mockRideImportScenario(page, {
    preview: {
      importJobId: 508,
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      duplicateRows: 0,
      requiresDuplicateResolution: false,
      rows: [
        { rowNumber: 1, date: "2026-05-06", miles: 14.1, rideMinutes: 43, notes: note500, isValid: true, errors: [], duplicateMatches: [] },
      ],
    },
    startResponse: {
      importJobId: 508,
      status: "processing",
      startedAtUtc: "2026-08-17T09:10:00.000Z",
    },
    statusResponse: {
      importJobId: 508,
      status: "completed",
      totalRows: 1,
      processedRows: 1,
      importedRows: 1,
      skippedRows: 0,
      failedRows: 0,
      percentComplete: 100,
      etaMinutesRounded: 0,
      createdAtUtc: "2026-08-17T09:10:00.000Z",
      startedAtUtc: "2026-08-17T09:10:01.000Z",
      completedAtUtc: "2026-08-17T09:10:03.000Z",
      lastError: null,
    },
  });

  await recorder.step("Open the ride CSV import page.");
  await page.goto("/rides/import");
  await page.setInputFiles("#csv-upload-input", {
    name: "notes-500.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(`Date,Distance,RideMinutes,Notes\n2026-05-06,14.1,43,${note500}\n`),
  });
  await page.getByRole("button", { name: "Preview Import" }).click();
  await expect(page.getByText("Total rows: 1 | Valid rows: 1 | Invalid rows: 0")).toBeVisible();
  await page.getByRole("button", { name: "Start Import" }).click();
  await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
  await expect(page.getByText("1 rides were imported successfully.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_boundary_notes_length_500");
  await recorder.save(testInfo);
});

test("Import CSV rejects Notes field with 501 characters", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "import_csv_boundary_notes_length_500",
    testTitle: `${testInfo.title} - 501 chars rejected`,
  });

  const note501 = "b".repeat(501);

  await recorder.step("Set up authenticated session and 501-character failure mocks.");
  await setupAuthenticatedImportSession(page);
  await mockRideImportPageShell(page);
  await mockRideImportScenario(page, {
    preview: {
      importJobId: 509,
      totalRows: 1,
      validRows: 0,
      invalidRows: 1,
      duplicateRows: 0,
      requiresDuplicateResolution: false,
      rows: [
        {
          rowNumber: 1,
          date: "2026-05-07",
          miles: 14.8,
          rideMinutes: 45,
          notes: null,
          isValid: false,
          errors: [
            {
              rowNumber: 1,
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
      importJobId: 509,
      status: "processing",
      startedAtUtc: "2026-08-17T09:11:00.000Z",
    },
    statusResponse: {
      importJobId: 509,
      status: "completed",
      totalRows: 1,
      processedRows: 1,
      importedRows: 0,
      skippedRows: 0,
      failedRows: 1,
      percentComplete: 100,
      etaMinutesRounded: 0,
      createdAtUtc: "2026-08-17T09:11:00.000Z",
      startedAtUtc: "2026-08-17T09:11:01.000Z",
      completedAtUtc: "2026-08-17T09:11:03.000Z",
      lastError: null,
    },
  });

  await recorder.step("Open the ride CSV import page.");
  await page.goto("/rides/import");
  await page.setInputFiles("#csv-upload-input", {
    name: "notes-501.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(`Date,Distance,RideMinutes,Notes\n2026-05-07,14.8,45,${note501}\n`),
  });
  await page.getByRole("button", { name: "Preview Import" }).click();
  await expect(page.getByText("Notes: Notes exceed maximum length of 500 characters.")).toBeVisible();
  await page.getByRole("button", { name: "Start Import" }).click();
  await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
  await expect(page.getByText("0 rides were imported successfully.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_boundary_notes_length_500");
  await recorder.save(testInfo);
});
