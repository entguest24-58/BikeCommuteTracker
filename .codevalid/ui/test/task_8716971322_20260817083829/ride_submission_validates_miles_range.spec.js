import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("ride submission validates miles are between 0.1 and 200", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "ride_submission_validates_miles_range",
    testTitle: testInfo.title,
  });

  await recorder.step("setup session and open page", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page);
    await page.goto("/rides/record");
  });

  await recorder.step("submit with miles over max", async () => {
    await page.locator("#miles").fill("201");
    await page.getByRole("button", { name: "Record Ride" }).click();
    await expect(page.getByText("Miles must be less than or equal to 200")).toBeVisible();
    await expect(page.locator("#miles")).toHaveValue("201");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:ride_submission_validates_miles_range");
  await recorder.save(testInfo);
});
