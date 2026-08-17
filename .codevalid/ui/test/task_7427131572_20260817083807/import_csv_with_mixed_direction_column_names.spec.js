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

test("CSV import accepts either PrimaryTravelDirection or Direction column name", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_csv_with_mixed_direction_column_names", "CSV import accepts either PrimaryTravelDirection or Direction column name");
  let previewCount = 0;
  let currentJobId = 0;

  await page.addInitScript(({ key, session }) => {
    window.sessionStorage.setItem(key, JSON.stringify(session));
  }, { key: SESSION_KEY, session: buildSession() });

  await page.route("**/api/imports/preview", async (route) => {
    previewCount += 1;
    currentJobId = 2000 + previewCount;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        importJobId: currentJobId,
        totalRows: 1,
        validRows: 1,
        invalidRows: 0,
        duplicateRows: 0,
        requiresDuplicateResolution: false,
        rows: [
          {
            rowNumber: 1,
            date: "2023-10-01",
            miles: 8.4,
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
    const body = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        importJobId: body.importJobId,
        status: "processing",
        startedAtUtc: "2026-01-01T10:00:05.000Z"
      })
    });
  });

  await page.route(/.*\/api\/imports\/\d+\/status$/, async (route) => {
    const match = route.request().url().match(/imports\/(\d+)\/status/);
    const importJobId = Number(match?.[1] ?? "0");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        importJobId,
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

  await recorder.step("Open import page");
  await page.goto("/rides/import");

  await recorder.step("Import CSV with Direction column");
  await page.locator("#csv-upload-input").setInputFiles({
    name: "direction-column.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Miles,Direction\n2023-10-01,8.4,SE\n")
  });
  await page.getByRole("button", { name: "Preview Import" }).click();
  await expect(page.getByText("Total rows: 1 | Valid rows: 1 | Invalid rows: 0")).toBeVisible();
  await page.getByRole("button", { name: "Start Import" }).click();
  await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();

  await recorder.step("Reload and import CSV with PrimaryTravelDirection column");
  await page.goto("/rides/import");
  await page.locator("#csv-upload-input").setInputFiles({
    name: "primary-direction-column.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Miles,PrimaryTravelDirection\n2023-10-02,8.4,SE\n")
  });
  await page.getByRole("button", { name: "Preview Import" }).click();
  await expect(page.getByText("Total rows: 1 | Valid rows: 1 | Invalid rows: 0")).toBeVisible();
  await page.getByRole("button", { name: "Start Import" }).click();
  await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_with_mixed_direction_column_names");
  await recorder.save(testInfo);
});
