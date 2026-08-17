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

test("Empty CSV file (no rows) is rejected with appropriate message", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_csv_with_empty_file", "Empty CSV file (no rows) is rejected with appropriate message");
  const message = "No data rows found. CSV must contain at least one data row.";

  await page.addInitScript(({ key, session }) => {
    window.sessionStorage.setItem(key, JSON.stringify(session));
  }, { key: SESSION_KEY, session: buildSession() });

  await page.route("**/api/imports/preview", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ message })
    });
  });

  await recorder.step("Open page and upload header-only CSV");
  await page.goto("/rides/import");
  await page.locator("#csv-upload-input").setInputFiles({
    name: "empty.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Miles,Difficulty,Direction\n")
  });

  await recorder.step("Preview error response");
  await page.getByRole("button", { name: "Preview Import" }).click();
  await expect(page.getByRole("alert")).toHaveText(message);

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_with_empty_file");
  await recorder.save(testInfo);
});
