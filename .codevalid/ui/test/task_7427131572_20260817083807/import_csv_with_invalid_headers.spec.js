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

test("CSV with invalid or missing mandatory headers fails with clear error", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_csv_with_invalid_headers", "CSV with invalid or missing mandatory headers fails with clear error");
  const message = "Missing required column: Miles. Required columns: Date, Miles.";

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

  await recorder.step("Open page and upload CSV with invalid headers");
  await page.goto("/rides/import");
  await page.locator("#csv-upload-input").setInputFiles({
    name: "invalid-headers.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Distance,Difficulty\n2023-10-01,8,3\n")
  });

  await recorder.step("Verify header-specific alert");
  await page.getByRole("button", { name: "Preview Import" }).click();
  await expect(page.getByRole("alert")).toHaveText(message);

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_with_invalid_headers");
  await recorder.save(testInfo);
});
