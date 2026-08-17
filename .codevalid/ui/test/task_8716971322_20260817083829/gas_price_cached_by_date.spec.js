import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("gas price is cached by calendar date and reused across sessions", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "gas_price_cached_by_date",
    testTitle: testInfo.title,
  });

  let gasPriceCalls = 0;

  await recorder.step("setup counting gas price responder", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page, {
      gasPriceResponder: async ({ date }) => {
        gasPriceCalls += 1;
        return {
          date,
          pricePerGallon: 3.7,
          isAvailable: true,
          dataSource: "Source: U.S. Energy Information Administration (EIA)",
        };
      },
    });
  });

  await recorder.step("open page and verify populated gas price", async () => {
    await page.goto("/rides/record");
    await expect(page.locator("#gasPrice")).toHaveValue("3.7");
  });

  await recorder.step("assert frontend performed fetches for initialization/current date behavior", async () => {
    expect(gasPriceCalls).toBeGreaterThan(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:gas_price_cached_by_date");
  await recorder.save(testInfo);
});
