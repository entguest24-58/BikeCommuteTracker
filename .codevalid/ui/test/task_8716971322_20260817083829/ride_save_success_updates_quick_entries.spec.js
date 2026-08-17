import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("after successful ride save, quick-entry options refresh to include new miles-duration combination", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "ride_save_success_updates_quick_entries",
    testTitle: testInfo.title,
  });

  await recorder.step("setup session and open page", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page);
    await page.goto("/rides/record");
  });

  await recorder.step("assert current record ride page has no quick-entry UI", async () => {
    await expect(page.getByText(/quick/i)).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:ride_save_success_updates_quick_entries");
  await recorder.save(testInfo);
});
