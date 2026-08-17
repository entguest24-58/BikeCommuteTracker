import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupInstalledOfflineMode,
  setupRecordRideApiRoutes,
} from "../../helpers/mock-api.js";

test("Ride operation resumes after network restoration and retry", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "record_ride_retries_and_succeeds_after_connectivity_restored",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session, startup health, and initial offline installed mode");
  await setupAuthenticatedSession(page);
  await setupInstalledOfflineMode(page, { isOnline: false });
  await setupRecordRideApiRoutes(page);
  await page.route("**/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });

  await recorder.step("Open record ride page while offline");
  await page.goto("/rides/record");
  await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry connection" })).toBeVisible();

  await recorder.step("Restore network connectivity in the installed app context");
  await page.evaluate(() => {
    window.dispatchEvent(new Event("online"));
  });

  await recorder.step("Retry connectivity");
  await page.getByRole("button", { name: "Retry connection" }).click();

  await recorder.step("Verify recovery message and available ride action");
  await expect(page.getByText("Connection restored. Retry your action.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Ride" })).toBeEnabled();

  await recorder.step("Submit the ride after connectivity is restored");
  await page.getByRole("button", { name: "Start Ride" }).click();
  await expect(page.getByText("Ride recorded successfully (ID: 501)")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:record_ride_retries_and_succeeds_after_connectivity_restored");
  await recorder.save(testInfo);
});
