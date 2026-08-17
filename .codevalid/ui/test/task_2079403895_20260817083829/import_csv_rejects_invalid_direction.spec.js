import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedImportSession,
  mockRideImportPageShell,
  mockRideImportScenario,
} from "../../helpers/mock-api.js";

test("Import CSV rejects rows with unrecognized PrimaryTravelDirection values", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "import_csv_rejects_invalid_direction",
    testTitle: testInfo.title,
  });

  await recorder.step("Set up authenticated session and direction validation mocks.");
  await setupAuthenticatedImportSession(page);
  await mockRideImportPageShell(page);
  await mockRideImportScenario(page, {
    preview: {
      importJobId: 503,
      totalRows: 3,
      validRows: 2,
      invalidRows: 1,
      duplicateRows: 0,
      requiresDuplicateResolution: false,
      rows: [
        { rowNumber: 1, date: "2026-05-01", miles: 8.1, rideMinutes: 24, notes: null, isValid: true, errors: [], duplicateMatches: [] },
        {
          rowNumber: 2,
          date: "2026-05-02",
          miles: 12.3,
          rideMinutes: 38,
          notes: null,
          isValid: false,
          errors: [
            {
              rowNumber: 2,
              code: "invalid_direction",
              field: "PrimaryTravelDirection",
              message: "Invalid PrimaryTravelDirection: accepted values are N, NE, E, SE, S, SW, W, NW or their full names (North, Northeast, etc.).",
            },
          ],
          duplicateMatches: [],
        },
        { rowNumber: 3, date: "2026-05-03", miles: 15.4, rideMinutes: 46, notes: null, isValid: true, errors: [], duplicateMatches: [] },
      ],
    },
    startResponse: {
      importJobId: 503,
      status: "processing",
      startedAtUtc: "2026-08-17T08:20:00.000Z",
    },
    statusResponse: {
      importJobId: 503,
      status: "completed",
      totalRows: 3,
      processedRows: 3,
      importedRows: 2,
      skippedRows: 0,
      failedRows: 1,
      percentComplete: 100,
      etaMinutesRounded: 0,
      createdAtUtc: "2026-08-17T08:20:00.000Z",
      startedAtUtc: "2026-08-17T08:20:01.000Z",
      completedAtUtc: "2026-08-17T08:20:03.000Z",
      lastError: null,
    },
  });

  await recorder.step("Open the ride CSV import page.");
  await page.goto("/rides/import");

  await recorder.step("Upload the CSV and preview direction validation results.");
  await page.setInputFiles("#csv-upload-input", {
    name: "invalid-direction.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Distance,RideMinutes,PrimaryTravelDirection\n2026-05-01,8.1,24,N\n2026-05-02,12.3,38,XX\n2026-05-03,15.4,46,North\n"),
  });
  await page.getByRole("button", { name: "Preview Import" }).click();

  await expect(page.getByText("Total rows: 3 | Valid rows: 2 | Invalid rows: 1")).toBeVisible();
  await expect(page.getByText("PrimaryTravelDirection: Invalid PrimaryTravelDirection: accepted values are N, NE, E, SE, S, SW, W, NW or their full names (North, Northeast, etc.).")).toBeVisible();

  await recorder.step("Start import and verify only valid rows complete.");
  await page.getByRole("button", { name: "Start Import" }).click();
  await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
  await expect(page.getByText("2 rides were imported successfully.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_rejects_invalid_direction");
  await recorder.save(testInfo);
});
