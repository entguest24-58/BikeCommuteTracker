import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRideApiRoutes,
  setupInstallFailureScenario,
} from "../../helpers/mock-api.js";

test("Core ride tracking remains accessible even if installation fails", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "core_ride_tracking_accessible_during_install_failure",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated browser-mode session and ride APIs");
  await setupAuthenticatedSession(page);
  await setupRecordRideApiRoutes(page);
  await page.route("**/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });
  await setupInstallFailureScenario(page, {
    alertMessage: "Installation failed. You can still use the app in your browser.",
    retryLabel: "Retry Installation",
    continueLabel: "Continue in Browser",
    browserModeOnly: true,
  });

  await recorder.step("Open record ride page in browser mode");
  await page.goto("/rides/record");
  await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();

  await recorder.step("Verify browser-mode continuity and functional ride start");
  await expect(page.getByRole("button", { name: "Start Ride" })).toBeEnabled();
  await page.getByRole("button", { name: "Start Ride" }).click();
  await expect(page.getByText("Ride recorded successfully (ID: 501)")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:core_ride_tracking_accessible_during_install_failure");
  await recorder.save(testInfo);
});
