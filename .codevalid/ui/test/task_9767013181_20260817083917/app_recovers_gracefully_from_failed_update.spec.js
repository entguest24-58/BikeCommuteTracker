import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRideApiRoutes,
  setupFailedUpdateScenario,
} from "../../helpers/mock-api.js";

test("App allows continued use if automatic update fails", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "app_recovers_gracefully_from_failed_update",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session and record-ride API routes");
  await setupAuthenticatedSession(page);
  await setupRecordRideApiRoutes(page);
  await page.route("**/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });

  await recorder.step("Inject failed update banner and retry action");
  await setupFailedUpdateScenario(page, {
    message: "Update failed. Please try again later.",
    buttonLabel: "Retry Update",
  });

  await recorder.step("Open record ride page after failed update");
  await page.goto("/rides/record");
  await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();

  await recorder.step("Verify non-blocking failure messaging and continued access");
  await expect(page.getByText("Update failed. Please try again later.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry Update" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Ride" })).toBeEnabled();

  console.log("CODEVALID_TEST_ASSERTION_OK:app_recovers_gracefully_from_failed_update");
  await recorder.save(testInfo);
});
