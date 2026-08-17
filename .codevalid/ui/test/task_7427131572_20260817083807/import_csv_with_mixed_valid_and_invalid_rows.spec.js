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

test("CSV with mixed valid and invalid rows processes valid rows and reports per-row errors", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_csv_with_mixed_valid_and_invalid_rows", "CSV with mixed valid and invalid rows processes valid rows and reports per-row errors");
  const directionMessage = "Direction must be one of: N, NE, E, SE, S, SW, W, NW, North, Northeast, East, Southeast, South, Southwest, West, Northwest.";

  await page.addInitScript(({ key, session }) => {
    window.sessionStorage.setItem(key, JSON.stringify(session));
  }, { key: SESSION_KEY, session: buildSession() });

  await page.route("**/api/imports/preview", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        importJobId: 10001,
        totalRows: 5,
        validRows: 3,
        invalidRows: 2,
        duplicateRows: 0,
        requiresDuplicateResolution: false,
        rows: [
          { rowNumber: 1, date: "2023-10-01", miles: 5, rideMinutes: null, temperature: null, tags: null, notes: null, isValid: true, errors: [], duplicateMatches: [] },
          { rowNumber: 2, date: "2023-10-02", miles: 6, rideMinutes: null, temperature: null, tags: null, notes: null, isValid: true, errors: [], duplicateMatches: [] },
          { rowNumber: 3, date: "2023-10-03", miles: 7, rideMinutes: null, temperature: null, tags: null, notes: null, isValid: true, errors: [], duplicateMatches: [] },
          { rowNumber: 4, date: "2023-10-04", miles: 8, rideMinutes: null, temperature: null, tags: null, notes: null, isValid: false, errors: [{ rowNumber: 4, code: "difficulty_invalid", field: "Difficulty", message: "Difficulty must be an integer between 1 and 5." }], duplicateMatches: [] },
          { rowNumber: 5, date: "2023-10-05", miles: 9, rideMinutes: null, temperature: null, tags: null, notes: null, isValid: false, errors: [{ rowNumber: 5, code: "direction_invalid", field: "Direction", message: directionMessage }], duplicateMatches: [] }
        ]
      })
    });
  });

  await recorder.step("Open page and upload mixed valid/invalid CSV");
  await page.goto("/rides/import");
  await page.locator("#csv-upload-input").setInputFiles({
    name: "mixed-valid-invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Miles,Difficulty,Direction\n2023-10-01,5,3,N\n2023-10-02,6,4,SE\n2023-10-03,7,,\n2023-10-04,8,0,E\n2023-10-05,9,2,Up\n")
  });

  await recorder.step("Preview row-level errors");
  await page.getByRole("button", { name: "Preview Import" }).click();
  await expect(page.getByText("Total rows: 5 | Valid rows: 3 | Invalid rows: 2")).toBeVisible();
  await expect(page.getByText("Row 4: Invalid")).toBeVisible();
  await expect(page.getByText("Row 5: Invalid")).toBeVisible();
  await expect(page.getByText("Difficulty: Difficulty must be an integer between 1 and 5.")).toBeVisible();
  await expect(page.getByText(`Direction: ${directionMessage}`)).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_with_mixed_valid_and_invalid_rows");
  await recorder.save(testInfo);
});
