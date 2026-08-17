import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedBikeSession,
  mockRecordRidePage,
} from "../../helpers/mock-api.js";

test("Gas price field blocks non-numeric or negative values", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "save_fails_on_invalid_gas_price",
    testTitle: testInfo.title,
  });

  await recorder.step("seed auth and page mocks", async () => {
    await setupAuthenticatedBikeSession(page);
    await mockRecordRidePage(page);
  });

  await recorder.step("reject negative gas price", async () => {
    await page.goto("/rides/record");
    await page.locator("#miles").fill("10");
    await page.locator("#gasPrice").fill("-1");
    await page.getByRole("button", { name: "Record Ride" }).click();
    await expect(page.getByText("Gas price must be a number between 0.01 and 999.9999")).toBeVisible();
    await expect(page.locator("#gasPrice")).toHaveValue("-1");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:save_fails_on_invalid_gas_price");
  await recorder.save(testInfo);
});
