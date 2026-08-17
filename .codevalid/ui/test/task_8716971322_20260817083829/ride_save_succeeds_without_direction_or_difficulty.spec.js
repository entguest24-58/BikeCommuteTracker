import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
  rideRecordSuccessResponse,
} from "../../helpers/mock-api.js";

test("ride saves successfully without Primary Travel Direction or Difficulty", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "ride_save_succeeds_without_direction_or_difficulty",
    testTitle: testInfo.title,
  });

  let submittedBody;

  await recorder.step("setup save success scenario", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page, {
      recordRideResponder: async ({ body }) => {
        submittedBody = body;
        return rideRecordSuccessResponse;
      },
    });
  });

  await recorder.step("fill minimal required fields and submit", async () => {
    await page.goto("/rides/record");
    await page.locator("#miles").fill("10.0");
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("");
    await expect(page.locator("#difficulty")).toHaveValue("");
    await page.getByRole("button", { name: "Record Ride" }).click();
  });

  await recorder.step("assert successful save and submitted null optional direction fields", async () => {
    await expect(page.getByText("Ride recorded successfully (ID: 501)")).toBeVisible();
    expect(submittedBody.primaryTravelDirection).toBeUndefined();
    expect(submittedBody.difficulty).toBeUndefined();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:ride_save_succeeds_without_direction_or_difficulty");
  await recorder.save(testInfo);
});
