import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Ride import blocked when offline with clear message and retry option", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "import_rides_offline_blocked",
    testTitle: "Ride import blocked when offline with clear message and retry option",
  });

  let previewRequestCount = 0;

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock startup health and offline import failure", async () => {
    await page.route("**/health", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
    });

    await page.route("**/api/imports/preview", async (route) => {
      previewRequestCount += 1;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          message:
            "Ride operations require an online connection. Offline creation, editing, or viewing is not supported in v1.",
        }),
      });
    });
  });

  await recorder.step("Open import page and attempt import while offline", async () => {
    await page.goto("/rides/import");
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();

    await page.locator("#csv-upload-input").setInputFiles({
      name: "rides.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("date,miles\n2026-08-01,10\n"),
    });

    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("Verify clear offline messaging and retry action", async () => {
    await expect(
      page.getByText(
        "Ride operations require an online connection. Offline creation, editing, or viewing is not supported in v1."
      )
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry Connection" })).toBeVisible();
    expect(previewRequestCount).toBe(1);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:import_rides_offline_blocked");
  await recorder.save(testInfo);
});
