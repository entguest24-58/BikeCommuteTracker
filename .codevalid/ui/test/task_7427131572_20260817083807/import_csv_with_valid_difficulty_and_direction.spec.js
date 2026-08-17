import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";

const SESSION_KEY = "bike_tracking_auth_session";

function buildSession() {
  const now = new Date();
  return {
    userId: 101,
    userName: "Test Rider",
    lastActivityAtUtc: now.toISOString(),
    expiresAtUtc: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
  };
}

test("CSV import succeeds with valid Difficulty and normalized direction values", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_csv_with_valid_difficulty_and_direction", "CSV import succeeds with valid Difficulty and normalized direction values");

  await page.addInitScript(({ key, session }) => {
    window.sessionStorage.setItem(key, JSON.stringify(session));
  }, { key: SESSION_KEY, session: buildSession() });

  await page.route("**/api/imports/preview", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        importJobId: 1001,
        totalRows: 1,
        validRows: 1,
        invalidRows: 0,
        duplicateRows: 0,
        requiresDuplicateResolution: false,
        rows: [
          {
            rowNumber: 1,
            date: "2023-10-01",
            miles: 10.5,
            rideMinutes: null,
            temperature: null,
            tags: null,
            notes: null,
            isValid: true,
            errors: [],
            duplicateMatches: []
          }
        ]
      })
    });
  });

  await page.route("**/api/imports/start", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        importJobId: 1001,
        status: "processing",
        startedAtUtc: "2026-01-01T10:00:05.000Z"
      })
    });
  });

  await page.route("**/api/imports/1001/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        importJobId: 1001,
        status: "completed",
        totalRows: 1,
        processedRows: 1,
        importedRows: 1,
        skippedRows: 0,
        failedRows: 0,
        percentComplete: 100,
        etaMinutesRounded: null,
        createdAtUtc: "2026-01-01T10:00:00.000Z",
        startedAtUtc: "2026-01-01T10:00:05.000Z",
        completedAtUtc: "2026-01-01T10:00:10.000Z",
        lastError: null
      })
    });
  });

  await recorder.step("Open Import Rides page");
  await page.goto("/rides/import");
  await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();

  await recorder.step("Upload valid CSV file");
  await page.locator("#csv-upload-input").setInputFiles({
    name: "valid-difficulty-direction.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Miles,Difficulty,PrimaryTravelDirection\n2023-10-01,10.5,4,Northwest\n")
  });

  await recorder.step("Preview import");
  await page.getByRole("button", { name: "Preview Import" }).click();
  await expect(page.getByText("Total rows: 1 | Valid rows: 1 | Invalid rows: 0")).toBeVisible();
  await expect(page.getByText("Row 1: Valid")).toBeVisible();

  await recorder.step("Start import and verify completion");
  await page.getByRole("button", { name: "Start Import" }).click();
  await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
  await expect(page.getByText("Nice work. 1 rides were imported successfully.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_with_valid_difficulty_and_direction");
  await recorder.save(testInfo);
});
