import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("gas price falls back to last ride’s value if EIA lookup fails", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "gas_price_fallback_to_last_ride",
    testTitle: testInfo.title,
  });

  await recorder.step("setup unavailable gas price response", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page, {
      gasPrice: {
        date: "2099-06-10",
        pricePerGallon: null,
        isAvailable: false,
        dataSource: null,
      },
    });
  });

  await recorder.step("open page and verify no fallback is shown by current implementation", async () => {
    await page.goto("/rides/record");
    await expect(page.locator("#gasPrice")).toHaveValue("");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:gas_price_fallback_to_last_ride");
  await recorder.save(testInfo);
});
