import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("ride submission validates minutes are positive when provided", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "ride_submission_validates_minutes_positive",
    testTitle: testInfo.title,
  });

  await recorder.step("setup session and open page", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page);
    await page.goto("/rides/record");
  });

  await recorder.step("enter valid miles and invalid duration", async () => {
    await page.locator("#miles").fill("10");
    await page.locator("#rideMinutes").fill("0");
    await page.getByRole("button", { name: "Record Ride" }).click();
    await expect(page.getByText("Ride minutes must be greater than 0")).toBeVisible();
    await expect(page.locator("#rideMinutes")).toHaveValue("0");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:ride_submission_validates_minutes_positive");
  await recorder.save(testInfo);
});
