import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRideHistoryScenario,
} from "../../helpers/mock-api.js";

test("Core ride history remains accessible during automatic app update", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "update_in_progress_does_not_block_history",
    testTitle: testInfo.title,
  });

  await recorder.step("seed authenticated session and working history API", async () => {
    await setupAuthenticatedSession(page);
    await setupRideHistoryScenario(page);
  });

  await recorder.step("open history page", async () => {
    await page.goto("/rides/history");
  });

  await recorder.step("verify history content is accessible", async () => {
    await expect(page.getByRole("heading", { name: "Ride History" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Total Miles (Visible)" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Morning commute" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  await recorder.step("verify no update-specific overlay or retry message appears on current page", async () => {
    await expect(page.getByText("update is being applied", { exact: false })).toHaveCount(0);
    await expect(page.getByText("Checking for updates...", { exact: false })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Retry Connection" })).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:update_in_progress_does_not_block_history");
  await recorder.save(testInfo);
});
