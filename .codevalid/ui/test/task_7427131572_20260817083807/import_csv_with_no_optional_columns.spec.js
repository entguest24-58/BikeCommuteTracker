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

test("CSV without Difficulty or Direction columns imports successfully", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_csv_with_no_optional_columns", "CSV without Difficulty or Direction columns imports successfully");

  await page.addInitScript(({ key, session }) => {
    window.sessionStorage.setItem(key, JSON.stringify(session));
  }, { key: SESSION_KEY, session: buildSession() });

  await page.route("**/api/imports/preview", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        importJobId: 9001,
        totalRows: 2,
        validRows: 2,
        invalidRows: 0,
        duplicateRows: 0,
        requiresDuplicateResolution: false,
        rows: [
          { rowNumber: 1, date: "2023-10-01", miles: 5, rideMinutes: null, temperature: null, tags: null, notes: null, isValid: true, errors: [], duplicateMatches: [] },
          { rowNumber: 2, date: "2023-10-02", miles: 7, rideMinutes: null, temperature: null, tags: null, notes: null, isValid: true, errors: [], duplicateMatches: [] }
        ]
      })
    });
  });

  await page.route("**/api/imports/start", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ importJobId: 9001, status: "processing", startedAtUtc: "2026-01-01T10:00:05.000Z" })
    });
  });

  await page.route("**/api/imports/9001/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        importJobId: 9001,
        status: "completed",
        totalRows: 2,
        processedRows: 2,
        importedRows: 2,
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

  await recorder.step("Open page and upload legacy CSV without optional columns");
  await page.goto("/rides/import");
  await page.locator("#csv-upload-input").setInputFiles({
    name: "legacy.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Miles\n2023-10-01,5\n2023-10-02,7\n")
  });

  await recorder.step("Preview and import legacy CSV");
  await page.getByRole("button", { name: "Preview Import" }).click();
  await expect(page.getByText("Total rows: 2 | Valid rows: 2 | Invalid rows: 0")).toBeVisible();
  await page.getByRole("button", { name: "Start Import" }).click();
  await expect(page.getByText("Nice work. 2 rides were imported successfully.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_with_no_optional_columns");
  await recorder.save(testInfo);
});
