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

test("import_csv_empty_file", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_csv_empty_file", "Empty CSV file rejected with clear error message");

  await recorder.step("Prepare session", async () => {
    await setupUnauthenticatedSession(page);
    await seedAuthenticatedSession(page);
  });

  await recorder.step("Mock preview failure for empty CSV", async () => {
    await page.route("**/api/imports/preview", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "No valid rows found in CSV file. Please check formatting and try again." }),
      });
    });
  });

  await recorder.step("Upload empty file and preview", async () => {
    await page.goto("/rides/import");
    await page.locator("#csv-upload-input").setInputFiles({ name: "empty.csv", mimeType: "text/csv", buffer: Buffer.from("", "utf8") });
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("Assert global empty-file error", async () => {
    await expect(page.getByText("No valid rows found in CSV file. Please check formatting and try again.")).toBeVisible();
    await expect(page.getByText("Start an import to see progress and cancellation controls.")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_empty_file");
  await recorder.save(testInfo);
});
