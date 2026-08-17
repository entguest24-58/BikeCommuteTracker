import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedImportSession,
  mockRideImportPageShell,
  mockRideImportScenario,
} from "../../helpers/mock-api.js";

test("Import CSV with fully valid Difficulty, Direction, and Notes", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "import_csv_with_all_valid_fields",
    testTitle: testInfo.title,
  });

  await recorder.step("Set up authenticated session and valid CSV import mocks.");
  await setupAuthenticatedImportSession(page);
  await mockRideImportPageShell(page);
  await mockRideImportScenario(page, {
    preview: {
      importJobId: 501,
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      duplicateRows: 0,
      requiresDuplicateResolution: false,
      rows: [
        {
          rowNumber: 1,
          date: "2026-05-10",
          miles: 22.1,
          rideMinutes: 64,
          notes: "Beautiful trail",
          isValid: true,
          errors: [],
          duplicateMatches: [],
        },
      ],
    },
    startResponse: {
      importJobId: 501,
      status: "processing",
      startedAtUtc: "2026-08-17T08:00:00.000Z",
    },
    statusResponse: {
      importJobId: 501,
      status: "completed",
      totalRows: 1,
      processedRows: 1,
      importedRows: 1,
      skippedRows: 0,
      failedRows: 0,
      percentComplete: 100,
      etaMinutesRounded: 0,
      createdAtUtc: "2026-08-17T08:00:00.000Z",
      startedAtUtc: "2026-08-17T08:00:01.000Z",
      completedAtUtc: "2026-08-17T08:00:02.000Z",
      lastError: null,
    },
  });

  await recorder.step("Open the ride CSV import page.");
  await page.goto("/rides/import");
  await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();

  await recorder.step("Choose a CSV file and preview the import.");
  await page.setInputFiles("#csv-upload-input", {
    name: "valid-rides.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Distance,RideMinutes,Difficulty,PrimaryTravelDirection,Notes\n2026-05-10,22.1,64,4,SE,Beautiful trail\n"),
  });
  await page.getByRole("button", { name: "Preview Import" }).click();

  await expect(page.getByText("Total rows: 1 | Valid rows: 1 | Invalid rows: 0")).toBeVisible();
  await expect(page.getByText("Row 1: Valid")).toBeVisible();

  await recorder.step("Start the import and observe completion.");
  await page.getByRole("button", { name: "Start Import" }).click();

  await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
  await expect(page.getByText("1 rides were imported successfully.")).toBeVisible();
  await expect(page.getByText("Head to your dashboard to see your updated stats and trends.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_with_all_valid_fields");
  await recorder.save(testInfo);
});
