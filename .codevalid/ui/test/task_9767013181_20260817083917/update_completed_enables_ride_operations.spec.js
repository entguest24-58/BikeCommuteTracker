import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRideApiRoutes,
  setupUpdateCompletedScenario,
} from "../../helpers/mock-api.js";

test("Ride operations are enabled immediately after successful update", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "update_completed_enables_ride_operations",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session, health, and completed-update state");
  await setupAuthenticatedSession(page);
  await setupRecordRideApiRoutes(page);
  await page.route("**/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });
  await setupUpdateCompletedScenario(page);

  await recorder.step("Open record ride page after update completion");
  await page.goto("/rides/record");
  await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();

  await recorder.step("Verify update message is gone and ride action is enabled");
  await expect(page.getByText("Updating Commute Bike Tracker... Please wait.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Start Ride" })).toBeEnabled();

  console.log("CODEVALID_TEST_ASSERTION_OK:update_completed_enables_ride_operations");
  await recorder.save(testInfo);
});
