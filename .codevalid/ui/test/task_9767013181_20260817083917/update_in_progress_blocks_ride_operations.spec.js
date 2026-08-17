import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRideApiRoutes,
  setupUpdateInProgressScenario,
} from "../../helpers/mock-api.js";

test("Ride operations are blocked during active app update", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "update_in_progress_blocks_ride_operations",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session and update-in-progress state");
  await setupAuthenticatedSession(page);
  await setupRecordRideApiRoutes(page);
  await page.route("**/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });
  await setupUpdateInProgressScenario(page, {
    message: "Updating Commute Bike Tracker... Please wait.",
    blockRideButton: true,
    overlayMessage: "Please wait while the app updates. Ride recording will be available after update completes.",
  });

  await recorder.step("Open record ride page while update is active");
  await page.goto("/rides/record");
  await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();

  await recorder.step("Verify ride action is blocked by update overlay");
  await expect(page.getByText("Updating Commute Bike Tracker... Please wait.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Ride" })).toBeDisabled();
  await expect(
    page.getByText("Please wait while the app updates. Ride recording will be available after update completes.")
  ).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:update_in_progress_blocks_ride_operations");
  await recorder.save(testInfo);
});
