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

test("import_cancelled_by_user", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_cancelled_by_user", "User cancels import before submission preserves form state");
  let startCalled = false;

  await recorder.step("Prepare session", async () => {
    await setupUnauthenticatedSession(page);
    await seedAuthenticatedSession(page);
  });

  await recorder.step("Mock duplicate preview and cancel only", async () => {
    await page.route("**/api/imports/preview", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ importJobId: 111, totalRows: 1, validRows: 1, invalidRows: 0, duplicateRows: 1, requiresDuplicateResolution: true, rows: [{ rowNumber: 1, date: "2024-05-01T08:00:00", miles: 10, isValid: true, errors: [], duplicateMatches: [{ existingRideId: 88, existingRideDate: "2024-05-01T08:00:00", existingMiles: 10 }] }] }) });
    });
    await page.route("**/api/imports/start", async (route) => {
      startCalled = true;
      await route.abort();
    });
    await page.route("**/api/imports/111/cancel", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ importJobId: 111, status: "cancelled", processedRows: 0, importedRows: 0, skippedRows: 0, failedRows: 0, cancelledAtUtc: "2024-05-01T08:00:00Z" }) });
    });
  });

  await recorder.step("Open preview and then cancel", async () => {
    await page.goto("/rides/import");
    await page.locator("#csv-upload-input").setInputFiles({ name: "cancel-before-submit.csv", mimeType: "text/csv", buffer: Buffer.from(csv, "utf8") });
    await expect(page.getByText("Selected file: cancel-before-submit.csv")).toBeVisible();
    await page.getByRole("button", { name: "Preview Import" }).click();
    await page.getByRole("button", { name: "Start Import" }).click();
    await expect(page.getByRole("heading", { name: "Resolve duplicates" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  await recorder.step("Verify reset state and no start API call", async () => {
    expect(startCalled).toBe(false);
    await expect(page.getByText("No file selected.")).toBeVisible();
    await expect(page.getByText("Start an import to see progress and cancellation controls.")).toBeVisible();
    await expect(page.getByText("Selected file: cancel-before-submit.csv")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:import_cancelled_by_user");
  await recorder.save(testInfo);
});
