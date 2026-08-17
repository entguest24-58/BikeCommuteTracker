import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

const SESSION_KEY = "bike_tracking_auth_session";
async function seedAuthenticatedSession(page) {
  await page.addInitScript((key) => {
    const now = new Date();
    const expires = new Date(now.getTime() + 3600000);
    window.sessionStorage.setItem(key, JSON.stringify({ userId: 1, userName: "Alice", lastActivityAtUtc: now.toISOString(), expiresAtUtc: expires.toISOString() }));
  }, SESSION_KEY);
}

const csv = ["Date,Miles,Difficulty", "2024-05-01T08:00:00,10,0", "2024-05-02T08:00:00,12,4"].join("\n");

test("import_csv_invalid_difficulty_below_1", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_csv_invalid_difficulty_below_1", "CSV with Difficulty < 1 rejected with row-level error");

  await recorder.step("Prepare authenticated session", async () => {
    await setupUnauthenticatedSession(page);
    await seedAuthenticatedSession(page);
  });

  await recorder.step("Mock preview with one invalid and one valid row", async () => {
    await page.route("**/api/imports/preview", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          importJobId: 103,
          totalRows: 2,
          validRows: 1,
          invalidRows: 1,
          duplicateRows: 0,
          requiresDuplicateResolution: false,
          rows: [
            { rowNumber: 1, date: "2024-05-01T08:00:00", miles: 10, isValid: false, errors: [{ rowNumber: 1, code: "difficulty_range", field: "Difficulty", message: "Difficulty must be an integer between 1 and 5" }], duplicateMatches: [] },
            { rowNumber: 2, date: "2024-05-02T08:00:00", miles: 12, isValid: true, errors: [], duplicateMatches: [] },
          ],
        }),
      });
    });
  });

  await recorder.step("Open page and preview CSV", async () => {
    await page.goto("/rides/import");
    await page.locator("#csv-upload-input").setInputFiles({ name: "difficulty-below-1.csv", mimeType: "text/csv", buffer: Buffer.from(csv, "utf8") });
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("Verify row-level difficulty error", async () => {
    await expect(page.getByText("Total rows: 2 | Valid rows: 1 | Invalid rows: 1")).toBeVisible();
    await expect(page.getByText("Row 1: Invalid")).toBeVisible();
    await expect(page.getByText("Difficulty: Difficulty must be an integer between 1 and 5")).toBeVisible();
    await expect(page.getByText("Row 2: Valid")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_invalid_difficulty_below_1");
  await recorder.save(testInfo);
});
