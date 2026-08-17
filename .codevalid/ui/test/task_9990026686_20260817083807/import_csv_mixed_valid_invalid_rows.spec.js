import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

const SESSION_KEY = "bike_tracking_auth_session";
const csv = [
  "Date,Miles,Difficulty,PrimaryTravelDirection",
  "2024-05-01T08:00:00,10,3,N",
  "2024-05-02T08:00:00,11,0,N",
  "2024-05-03T08:00:00,12,3,XYZ",
  "2024-05-04T08:00:00,13,4,SW",
].join("\n");

async function seedAuthenticatedSession(page) {
  await page.addInitScript((key) => {
    const now = new Date();
    const expires = new Date(now.getTime() + 3600000);
    window.sessionStorage.setItem(key, JSON.stringify({ userId: 1, userName: "Alice", lastActivityAtUtc: now.toISOString(), expiresAtUtc: expires.toISOString() }));
  }, SESSION_KEY);
}

test("import_csv_mixed_valid_invalid_rows", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_csv_mixed_valid_invalid_rows", "CSV with mixture of valid and invalid rows imports only valid rows with per-row error labels");

  await recorder.step("Prepare session", async () => {
    await setupUnauthenticatedSession(page);
    await seedAuthenticatedSession(page);
  });

  await recorder.step("Mock mixed preview response", async () => {
    await page.route("**/api/imports/preview", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ importJobId: 109, totalRows: 4, validRows: 2, invalidRows: 2, duplicateRows: 0, requiresDuplicateResolution: false, rows: [ { rowNumber: 1, date: "2024-05-01T08:00:00", miles: 10, isValid: true, errors: [], duplicateMatches: [] }, { rowNumber: 2, date: "2024-05-02T08:00:00", miles: 11, isValid: false, errors: [{ rowNumber: 2, code: "difficulty_range", field: "Difficulty", message: "Difficulty must be 1–5" }], duplicateMatches: [] }, { rowNumber: 3, date: "2024-05-03T08:00:00", miles: 12, isValid: false, errors: [{ rowNumber: 3, code: "direction_invalid", field: "PrimaryTravelDirection", message: "Invalid direction. Accepted values: N, NE, E, SE, S, SW, W, NW or full names: North, Northeast, etc." }], duplicateMatches: [] }, { rowNumber: 4, date: "2024-05-04T08:00:00", miles: 13, isValid: true, errors: [], duplicateMatches: [] } ] }) });
    });
  });

  await recorder.step("Preview import", async () => {
    await page.goto("/rides/import");
    await page.locator("#csv-upload-input").setInputFiles({ name: "mixed.csv", mimeType: "text/csv", buffer: Buffer.from(csv, "utf8") });
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("Assert row labels and messages", async () => {
    await expect(page.getByText("Total rows: 4 | Valid rows: 2 | Invalid rows: 2")).toBeVisible();
    await expect(page.getByText("Row 1: Valid")).toBeVisible();
    await expect(page.getByText("Row 2: Invalid")).toBeVisible();
    await expect(page.getByText("Difficulty: Difficulty must be 1–5")).toBeVisible();
    await expect(page.getByText("Row 3: Invalid")).toBeVisible();
    await expect(page.getByText("PrimaryTravelDirection: Invalid direction. Accepted values: N, NE, E, SE, S, SW, W, NW or full names: North, Northeast, etc.")).toBeVisible();
    await expect(page.getByText("Row 4: Valid")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_mixed_valid_invalid_rows");
  await recorder.save(testInfo);
});
