import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedImportSession,
  mockRideImportPageShell,
  mockRideImportScenario,
} from "../../helpers/mock-api.js";

test("Import CSV processes valid rows even when mixed with invalid rows", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "import_csv_mixed_valid_and_invalid_rows",
    testTitle: testInfo.title,
  });

  await recorder.step("Set up authenticated session and mixed-row validation mocks.");
  await setupAuthenticatedImportSession(page);
  await mockRideImportPageShell(page);
  await mockRideImportScenario(page, {
    preview: {
      importJobId: 507,
      totalRows: 5,
      validRows: 3,
      invalidRows: 2,
      duplicateRows: 0,
      requiresDuplicateResolution: false,
      rows: [
        { rowNumber: 1, date: "2026-05-01", miles: 9.5, rideMinutes: 28, notes: "ok", isValid: true, errors: [], duplicateMatches: [] },
        {
          rowNumber: 2,
          date: "2026-05-02",
          miles: 10.1,
          rideMinutes: 30,
          notes: null,
          isValid: false,
          errors: [{ rowNumber: 2, code: "invalid_difficulty", field: "Difficulty", message: "Invalid Difficulty: must be an integer between 1 and 5." }],
          duplicateMatches: [],
        },
        { rowNumber: 3, date: "2026-05-03", miles: 11.7, rideMinutes: 33, notes: "ok", isValid: true, errors: [], duplicateMatches: [] },
        {
          rowNumber: 4,
          date: "2026-05-04",
          miles: 12.2,
          rideMinutes: 35,
          notes: null,
          isValid: false,
          errors: [{ rowNumber: 4, code: "invalid_direction", field: "PrimaryTravelDirection", message: "Invalid PrimaryTravelDirection: accepted values are N, NE, E, SE, S, SW, W, NW or their full names (North, Northeast, etc.)." }],
          duplicateMatches: [],
        },
        { rowNumber: 5, date: "2026-05-05", miles: 13.9, rideMinutes: 41, notes: "ok", isValid: true, errors: [], duplicateMatches: [] },
      ],
    },
    startResponse: {
      importJobId: 507,
      status: "processing",
      startedAtUtc: "2026-08-17T09:00:00.000Z",
    },
    statusResponse: {
      importJobId: 507,
      status: "completed",
      totalRows: 5,
      processedRows: 5,
      importedRows: 3,
      skippedRows: 0,
      failedRows: 2,
      percentComplete: 100,
      etaMinutesRounded: 0,
      createdAtUtc: "2026-08-17T09:00:00.000Z",
      startedAtUtc: "2026-08-17T09:00:01.000Z",
      completedAtUtc: "2026-08-17T09:00:03.000Z",
      lastError: null,
    },
  });

  await recorder.step("Open the ride CSV import page.");
  await page.goto("/rides/import");

  await recorder.step("Upload the mixed-validity CSV and preview row-level results.");
  await page.setInputFiles("#csv-upload-input", {
    name: "mixed-valid-invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Distance,RideMinutes,Difficulty,PrimaryTravelDirection,Notes\n2026-05-01,9.5,28,3,N,ok\n2026-05-02,10.1,30,8,N,\n2026-05-03,11.7,33,4,SW,ok\n2026-05-04,12.2,35,3,XXX,\n2026-05-05,13.9,41,5,SE,ok\n"),
  });
  await page.getByRole("button", { name: "Preview Import" }).click();

  await expect(page.getByText("Total rows: 5 | Valid rows: 3 | Invalid rows: 2")).toBeVisible();
  await expect(page.getByText("Difficulty: Invalid Difficulty: must be an integer between 1 and 5.")).toBeVisible();
  await expect(page.getByText("PrimaryTravelDirection: Invalid PrimaryTravelDirection: accepted values are N, NE, E, SE, S, SW, W, NW or their full names (North, Northeast, etc.).")).toBeVisible();

  await recorder.step("Start import and verify successful rows are not lost.");
  await page.getByRole("button", { name: "Start Import" }).click();
  await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
  await expect(page.getByText("3 rides were imported successfully.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_mixed_valid_and_invalid_rows");
  await recorder.save(testInfo);
});
