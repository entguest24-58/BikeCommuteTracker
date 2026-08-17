import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("ride submission validates required fields before save", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "ride_submission_validates_required_fields",
    testTitle: testInfo.title,
  });

  await recorder.step("setup session and route mocks", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page);
  });

  await recorder.step("open page and clear date time and miles", async () => {
    await page.goto("/rides/record");
    await page.locator("#rideDateTimeLocal").fill("");
    await page.locator("#miles").fill("0");
  });

  await recorder.step("submit and verify blocking validation message with preserved values", async () => {
    await page.getByRole("button", { name: "Record Ride" }).click();
    await expect(page.getByText("Miles must be greater than 0")).toBeVisible();
    await expect(page.locator("#rideDateTimeLocal")).toHaveValue("");
    await expect(page.locator("#miles")).toHaveValue("0");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:ride_submission_validates_required_fields");
  await recorder.save(testInfo);
});
