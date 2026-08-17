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

test("Row with invalid Difficulty (e.g., 0, 6, 'high') is rejected with specific error", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_csv_with_invalid_difficulty_outside_range", "Row with invalid Difficulty (e.g., 0, 6, 'high') is rejected with specific error");

  await page.addInitScript(({ key, session }) => {
    window.sessionStorage.setItem(key, JSON.stringify(session));
  }, { key: SESSION_KEY, session: buildSession() });

  await page.route("**/api/imports/preview", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        importJobId: 4001,
        totalRows: 3,
        validRows: 1,
        invalidRows: 2,
        duplicateRows: 0,
        requiresDuplicateResolution: false,
        rows: [
          { rowNumber: 1, date: "2023-10-01", miles: 10.5, rideMinutes: null, temperature: null, tags: null, notes: null, isValid: true, errors: [], duplicateMatches: [] },
          { rowNumber: 2, date: "2023-10-02", miles: 8.2, rideMinutes: null, temperature: null, tags: null, notes: null, isValid: false, errors: [{ rowNumber: 2, code: "difficulty_invalid", field: "Difficulty", message: "Difficulty must be an integer between 1 and 5." }], duplicateMatches: [] },
          { rowNumber: 3, date: "2023-10-03", miles: 7.8, rideMinutes: null, temperature: null, tags: null, notes: null, isValid: false, errors: [{ rowNumber: 3, code: "difficulty_invalid", field: "Difficulty", message: "Difficulty must be an integer between 1 and 5." }], duplicateMatches: [] }
        ]
      })
    });
  });

  await recorder.step("Open page and upload CSV with invalid difficulty rows");
  await page.goto("/rides/import");
  await page.locator("#csv-upload-input").setInputFiles({
    name: "invalid-difficulty.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Miles,Difficulty\n2023-10-01,10.5,3\n2023-10-02,8.2,0\n2023-10-03,7.8,High\n")
  });

  await recorder.step("Preview validation errors");
  await page.getByRole("button", { name: "Preview Import" }).click();
  await expect(page.getByText("Total rows: 3 | Valid rows: 1 | Invalid rows: 2")).toBeVisible();
  await expect(page.getByText("Row 1: Valid")).toBeVisible();
  await expect(page.getByText("Row 2: Invalid")).toBeVisible();
  await expect(page.getByText("Row 3: Invalid")).toBeVisible();
  await expect(page.getByText("Difficulty: Difficulty must be an integer between 1 and 5.")).toHaveCount(2);

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_with_invalid_difficulty_outside_range");
  await recorder.save(testInfo);
});
