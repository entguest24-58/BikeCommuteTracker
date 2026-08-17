import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupInstalledOfflineMode,
  setupRecordRideApiRoutes,
} from "../../helpers/mock-api.js";

test("Ride operation blocked when installed app is offline", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "record_ride_offline_blocked",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated installed-app session and offline mode");
  await setupAuthenticatedSession(page);
  await setupInstalledOfflineMode(page, { isOnline: false });
  await setupRecordRideApiRoutes(page);

  await recorder.step("Allow startup health check to succeed");
  await page.route("**/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });

  await recorder.step("Open record ride page");
  await page.goto("/rides/record");
  await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();

  await recorder.step("Verify offline installed-mode banner is shown");
  await expect(
    page.getByText("Connectivity required: this installed app needs an internet connection for ride operations.")
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry connection" })).toBeVisible();

  await recorder.step("Attempt the blocked ride operation");
  await page.getByRole("button", { name: "Start Ride" }).click();

  await recorder.step("Verify operation is prevented with offline messaging");
  await expect(
    page.getByText("Connectivity required: reconnect to the internet to record rides in installed mode.")
  ).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:record_ride_offline_blocked");
  await recorder.save(testInfo);
});
