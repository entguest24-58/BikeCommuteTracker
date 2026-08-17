import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

const SESSION_KEY = "bike_tracking_auth_session";
const csv = ["Date,Miles", "2024-05-01T08:00:00,10", "2024-05-02T08:00:00,11,NE,Note,Extra"].join("\n");

async function seedAuthenticatedSession(page) {
  await page.addInitScript((key) => {
    const now = new Date();
    const expires = new Date(now.getTime() + 3600000);
    window.sessionStorage.setItem(key, JSON.stringify({ userId: 1, userName: "Alice", lastActivityAtUtc: now.toISOString(), expiresAtUtc: expires.toISOString() }));
  }, SESSION_KEY);
}

test("import_csv_corrupted_format", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_csv_corrupted_format", "CSV with malformed structure rejected with clear error");

  await recorder.step("Prepare session", async () => {
    await setupUnauthenticatedSession(page);
    await seedAuthenticatedSession(page);
  });

  await recorder.step("Mock preview failure for malformed structure", async () => {
    await page.route("**/api/imports/preview", async (route) => {
      await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ message: "CSV format error: inconsistent number of columns. Please ensure all rows have the same structure." }) });
    });
  });

  await recorder.step("Upload malformed CSV", async () => {
    await page.goto("/rides/import");
    await page.locator("#csv-upload-input").setInputFiles({ name: "corrupted.csv", mimeType: "text/csv", buffer: Buffer.from(csv, "utf8") });
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("Assert malformed CSV error", async () => {
    await expect(page.getByText("CSV format error: inconsistent number of columns. Please ensure all rows have the same structure.")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_corrupted_format");
  await recorder.save(testInfo);
});
