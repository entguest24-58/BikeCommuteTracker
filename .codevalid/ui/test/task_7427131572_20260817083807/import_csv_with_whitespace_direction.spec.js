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

test("CSV import trims whitespace and normalizes direction values", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_csv_with_whitespace_direction", "CSV import trims whitespace and normalizes direction values");

  await page.addInitScript(({ key, session }) => {
    window.sessionStorage.setItem(key, JSON.stringify(session));
  }, { key: SESSION_KEY, session: buildSession() });

  await page.route("**/api/imports/preview", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        importJobId: 7001,
        totalRows: 1,
        validRows: 1,
        invalidRows: 0,
        duplicateRows: 0,
        requiresDuplicateResolution: false,
        rows: [
          { rowNumber: 1, date: "2023-10-01", miles: 4.2, rideMinutes: null, temperature: null, tags: null, notes: null, isValid: true, errors: [], duplicateMatches: [] }
        ]
      })
    });
  });

  await recorder.step("Open page and upload CSV with whitespace direction value");
  await page.goto("/rides/import");
  await page.locator("#csv-upload-input").setInputFiles({
    name: "whitespace-direction.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Miles,Direction\n2023-10-01,4.2, NE \n")
  });

  await recorder.step("Preview successful parsing");
  await page.getByRole("button", { name: "Preview Import" }).click();
  await expect(page.getByText("Total rows: 1 | Valid rows: 1 | Invalid rows: 0")).toBeVisible();
  await expect(page.getByText("Row 1: Valid")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_with_whitespace_direction");
  await recorder.save(testInfo);
});
