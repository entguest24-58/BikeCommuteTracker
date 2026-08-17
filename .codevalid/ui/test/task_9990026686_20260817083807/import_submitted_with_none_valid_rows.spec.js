import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

const SESSION_KEY = "bike_tracking_auth_session";
const badNote = "A".repeat(600);
const csv = [
  "Date,Miles,Difficulty,PrimaryTravelDirection,Notes",
  `2024-05-01T08:00:00,10,6,XYZ,${badNote}`,
  `2024-05-02T08:00:00,11,6,XYZ,${badNote}`,
  `2024-05-03T08:00:00,12,6,XYZ,${badNote}`,
].join("\n");

async function seedAuthenticatedSession(page) {
  await page.addInitScript((key) => {
    const now = new Date();
    const expires = new Date(now.getTime() + 3600000);
    window.sessionStorage.setItem(key, JSON.stringify({ userId: 1, userName: "Alice", lastActivityAtUtc: now.toISOString(), expiresAtUtc: expires.toISOString() }));
  }, SESSION_KEY);
}

test("import_submitted_with_none_valid_rows", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_submitted_with_none_valid_rows", "CSV with all rows invalid shows global error and no rides imported");

  await recorder.step("Prepare session", async () => {
    await setupUnauthenticatedSession(page);
    await seedAuthenticatedSession(page);
  });

  await recorder.step("Mock preview returning all-invalid global message", async () => {
    await page.route("**/api/imports/preview", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "0 rides imported. All rows failed validation." }),
      });
    });
  });

  await recorder.step("Upload and preview all-invalid CSV", async () => {
    await page.goto("/rides/import");
    await page.locator("#csv-upload-input").setInputFiles({ name: "all-invalid.csv", mimeType: "text/csv", buffer: Buffer.from(csv, "utf8") });
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("Assert no-import global error", async () => {
    await expect(page.getByText("0 rides imported. All rows failed validation.")).toBeVisible();
    await expect(page.getByText("Start an import to see progress and cancellation controls.")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:import_submitted_with_none_valid_rows");
  await recorder.save(testInfo);
});
