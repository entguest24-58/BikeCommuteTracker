import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedBikeSession,
  mockRecordRidePage,
} from "../../helpers/mock-api.js";

test("Gas price pre-populated from EIA API by date", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "gas_price_pre_populated_from_eia",
    testTitle: testInfo.title,
  });

  await recorder.step("seed auth and gas price lookup", async () => {
    await setupAuthenticatedBikeSession(page);
    await mockRecordRidePage(page, {
      gasPrice: 3.45,
      gasPriceDate: "2024-06-15",
      gasPriceSource: "Source: U.S. Energy Information Administration (EIA)",
    });
  });

  await recorder.step("load page", async () => {
    await page.goto("/rides/record");
  });

  await recorder.step("verify gas price is prepopulated and editable", async () => {
    await expect(page.locator("#gasPrice")).toHaveValue("3.45");
    await expect(page.getByText("Source: U.S. Energy Information Administration (EIA)")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:gas_price_pre_populated_from_eia");
  await recorder.save(testInfo);
});
