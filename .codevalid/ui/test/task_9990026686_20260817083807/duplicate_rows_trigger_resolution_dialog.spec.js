import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

const SESSION_KEY = "bike_tracking_auth_session";
const csv = ["Date,Miles", "2024-05-01T08:00:00,10"].join("\n");

async function seedAuthenticatedSession(page) {
  await page.addInitScript((key) => {
    const now = new Date();
    const expires = new Date(now.getTime() + 3600000);
    window.sessionStorage.setItem(key, JSON.stringify({ userId: 1, userName: "Alice", lastActivityAtUtc: now.toISOString(), expiresAtUtc: expires.toISOString() }));
  }, SESSION_KEY);
}

test("duplicate_rows_trigger_resolution_dialog", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("duplicate_rows_trigger_resolution_dialog", "Duplicate rides detected during import open DuplicateResolutionDialog for user choice");

  await recorder.step("Prepare session", async () => {
    await setupUnauthenticatedSession(page);
    await seedAuthenticatedSession(page);
  });

  await recorder.step("Mock duplicate preview response", async () => {
    await page.route("**/api/imports/preview", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ importJobId: 110, totalRows: 1, validRows: 1, invalidRows: 0, duplicateRows: 1, requiresDuplicateResolution: true, rows: [{ rowNumber: 1, date: "2024-05-01T08:00:00", miles: 10, isValid: true, errors: [], duplicateMatches: [{ existingRideId: 77, existingRideDate: "2024-05-01T08:00:00", existingMiles: 10 }] }] }) });
    });
  });

  await recorder.step("Preview duplicate CSV and open dialog", async () => {
    await page.goto("/rides/import");
    await page.locator("#csv-upload-input").setInputFiles({ name: "duplicate.csv", mimeType: "text/csv", buffer: Buffer.from(csv, "utf8") });
    await page.getByRole("button", { name: "Preview Import" }).click();
    await page.getByRole("button", { name: "Start Import" }).click();
  });

  await recorder.step("Verify duplicate resolution dialog", async () => {
    await expect(page.getByRole("heading", { name: "Resolve duplicates" })).toBeVisible();
    await expect(page.getByText("1 duplicate row requires a decision before import can start.")).toBeVisible();
    await expect(page.getByText("Incoming ride: 2024-05-01T08:00:00 • 10.0 mi")).toBeVisible();
    await expect(page.getByText("Existing ride #77: 2024-05-01T08:00:00 • 10.0 mi")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Import" })).toBeDisabled();
    await expect(page.getByText("Row 1 keep existing")).toBeVisible();
    await expect(page.getByText("Row 1 replace with import")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:duplicate_rows_trigger_resolution_dialog");
  await recorder.save(testInfo);
});
