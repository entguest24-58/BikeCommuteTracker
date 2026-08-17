import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("ride submission validates gas price is blank or positive decimal", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "ride_submission_validates_gas_price",
    testTitle: testInfo.title,
  });

  await recorder.step("setup session and open page", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page, {
      gasPrice: { date: "2024-06-10", pricePerGallon: null, isAvailable: false, dataSource: null },
    });
    await page.goto("/rides/record");
    await page.locator("#miles").fill("10");
  });

  await recorder.step("invalid non-numeric becomes empty in number input and passes once blank", async () => {
    await page.locator("#gasPrice").fill("abc");
    await expect(page.locator("#gasPrice")).toHaveValue("");
    await page.getByRole("button", { name: "Record Ride" }).click();
  });

  await recorder.step("negative value is blocked by client validation logic", async () => {
    await page.locator("#gasPrice").fill("-2.5");
    await page.getByRole("button", { name: "Record Ride" }).click();
    await expect(page.getByText("Gas price must be a number between 0.01 and 999.9999")).toBeVisible();
    await expect(page.locator("#gasPrice")).toHaveValue("-2.5");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:ride_submission_validates_gas_price");
  await recorder.save(testInfo);
});
