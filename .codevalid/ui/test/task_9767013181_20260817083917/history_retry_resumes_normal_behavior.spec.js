import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRideHistoryScenario,
  mockRideHistoryFailure,
} from "../../helpers/mock-api.js";

test("Retry action resumes normal ride history behavior after network restoration", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "history_retry_resumes_normal_behavior",
    testTitle: testInfo.title,
  });

  await recorder.step("seed authenticated session and fail initial history load", async () => {
    await setupAuthenticatedSession(page);
    await mockRideHistoryFailure(page, {
      status: 503,
      message: "Failed to fetch ride history",
    });
  });

  await recorder.step("open history page in failed state", async () => {
    await page.goto("/rides/history");
    await expect(page.getByRole("alert")).toContainText("Failed to fetch ride history");
  });

  await recorder.step("confirm business-required retry connection action is not present", async () => {
    await expect(page.getByRole("button", { name: "Retry Connection" })).toHaveCount(0);
  });

  await recorder.step("simulate restored connectivity by reloading with healthy history mocks", async () => {
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await setupRideHistoryScenario(page);
    await page.reload();
  });

  await recorder.step("verify ride history renders normally after refresh", async () => {
    await expect(page.getByRole("heading", { name: "Ride History" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Total Miles (Visible)" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Morning commute" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:history_retry_resumes_normal_behavior");
  await recorder.save(testInfo);
});
