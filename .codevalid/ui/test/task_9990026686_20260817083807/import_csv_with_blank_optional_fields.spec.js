import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

const SESSION_KEY = "bike_tracking_auth_session";

async function seedAuthenticatedSession(page) {
  await page.addInitScript((sessionKey) => {
    const now = new Date();
    const expires = new Date(now.getTime() + 60 * 60 * 1000);
    window.sessionStorage.setItem(sessionKey, JSON.stringify({ userId: 1, userName: "Alice", lastActivityAtUtc: now.toISOString(), expiresAtUtc: expires.toISOString() }));
  }, SESSION_KEY);
}

const csv = [
  "Date,Miles,Difficulty,PrimaryTravelDirection,Notes",
  "2024-05-01T08:00:00,15.2,,,”,
].join("\n").replace(",,,”, ",,,");

test("import_csv_with_blank_optional_fields", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_csv_with_blank_optional_fields", "CSV with missing optional fields imports successfully");

  await recorder.step("Prepare authenticated session", async () => {
    await setupUnauthenticatedSession(page);
    await seedAuthenticatedSession(page);
  });

  await recorder.step("Mock preview/start/status for blank optional fields success", async () => {
    await page.route("**/api/imports/preview", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          importJobId: 102,
          totalRows: 1,
          validRows: 1,
          invalidRows: 0,
          duplicateRows: 0,
          requiresDuplicateResolution: false,
          rows: [{ rowNumber: 1, date: "2024-05-01T08:00:00", miles: 15.2, rideMinutes: null, notes: "", isValid: true, errors: [], duplicateMatches: [] }],
        }),
      });
    });
    await page.route("**/api/imports/start", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ importJobId: 102, status: "processing", startedAtUtc: "2024-05-01T08:00:00Z" }) });
    });
    await page.route("**/api/imports/102/status", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ importJobId: 102, status: "completed", totalRows: 1, processedRows: 1, importedRows: 1, skippedRows: 0, failedRows: 0, percentComplete: 100, etaMinutesRounded: null, createdAtUtc: "2024-05-01T08:00:00Z", startedAtUtc: "2024-05-01T08:00:01Z", completedAtUtc: "2024-05-01T08:00:02Z", lastError: null }) });
    });
  });

  await recorder.step("Open page and upload CSV", async () => {
    await page.goto("/rides/import");
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();
    await page.locator("#csv-upload-input").setInputFiles({ name: "blank-optional.csv", mimeType: "text/csv", buffer: Buffer.from(csv, "utf8") });
    await page.getByRole("button", { name: "Preview Import" }).click();
    await expect(page.getByText("Row 1: Valid")).toBeVisible();
    await expect(page.getByText("Total rows: 1 | Valid rows: 1 | Invalid rows: 0")).toBeVisible();
  });

  await recorder.step("Submit import and verify completion", async () => {
    await page.getByRole("button", { name: "Start Import" }).click();
    await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
    await expect(page.getByText("Nice work. 1 rides were imported successfully.")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_with_blank_optional_fields");
  await recorder.save(testInfo);
});
