import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedBikeSession,
  mockRecordRidePage,
} from "../../helpers/mock-api.js";

test("Form state preserved on validation error", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "save_preserves_all_inputs_on_validation_error",
    testTitle: testInfo.title,
  });

  await recorder.step("seed auth and record ride mocks", async () => {
    await setupAuthenticatedBikeSession(page);
    await mockRecordRidePage(page);
  });

  await recorder.step("open page and fill form with one invalid field", async () => {
    await page.goto("/rides/record");
    await page.locator("#miles").fill("0");
    await page.locator("#gasPrice").fill("3.50");
    await page.locator("#notes").fill("Great ride!");
    await page.locator("#primaryTravelDirection").selectOption("East");
    await page.locator("#difficulty").selectOption("3");
    await page.locator("#temperature").fill("72");
    await page.getByRole("button", { name: "Record Ride" }).click();
  });

  await recorder.step("verify all values remain after validation failure", async () => {
    await expect(page.getByText("Miles must be greater than 0")).toBeVisible();
    await expect(page.locator("#miles")).toHaveValue("0");
    await expect(page.locator("#gasPrice")).toHaveValue("3.50");
    await expect(page.locator("#notes")).toHaveValue("Great ride!");
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("East");
    await expect(page.locator("#difficulty")).toHaveValue("3");
    await expect(page.locator("#temperature")).toHaveValue("72");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:save_preserves_all_inputs_on_validation_error");
  await recorder.save(testInfo);
});
