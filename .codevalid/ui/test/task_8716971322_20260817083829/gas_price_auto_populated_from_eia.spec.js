import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("gas price is auto-populated from EIA API for ride date", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "gas_price_auto_populated_from_eia",
    testTitle: testInfo.title,
  });

  await recorder.step("setup gas price response", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page, {
      gasPrice: {
        date: "2024-06-10",
        pricePerGallon: 3.65,
        isAvailable: true,
        dataSource: "Source: U.S. Energy Information Administration (EIA)",
      },
    });
  });

  await recorder.step("open page and verify gas price", async () => {
    await page.goto("/rides/record");
    await expect(page.locator("#gasPrice")).toHaveValue("3.65");
    await expect(page.getByText("Source: U.S. Energy Information Administration (EIA)")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:gas_price_auto_populated_from_eia");
  await recorder.save(testInfo);
});
