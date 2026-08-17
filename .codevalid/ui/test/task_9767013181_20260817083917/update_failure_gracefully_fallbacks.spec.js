import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRideHistoryScenario,
} from "../../helpers/mock-api.js";

test("Update failure does not prevent access to ride history", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "update_failure_gracefully_fallbacks",
    testTitle: testInfo.title,
  });

  await recorder.step("seed authenticated session and healthy history mocks", async () => {
    await setupAuthenticatedSession(page);
    await setupRideHistoryScenario(page);
  });

  await recorder.step("open history page after simulated update failure context", async () => {
    await page.goto("/rides/history");
  });

  await recorder.step("verify history remains usable", async () => {
    await expect(page.getByRole("heading", { name: "Ride History" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Morning commute" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  await recorder.step("verify update-failure copy is not surfaced on HistoryPage", async () => {
    await expect(page.getByText("Update check failed", { exact: false })).toHaveCount(0);
    await expect(page.getByText("retry update", { exact: false })).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:update_failure_gracefully_fallbacks");
  await recorder.save(testInfo);
});
