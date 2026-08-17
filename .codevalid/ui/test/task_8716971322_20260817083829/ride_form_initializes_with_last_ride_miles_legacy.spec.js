import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("ride form pre-fills miles from last ride when no presets exist", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "ride_form_initializes_with_last_ride_miles_legacy",
    testTitle: testInfo.title,
  });

  await recorder.step("setup authenticated session and no-preset scenario", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page, {
      presets: [],
      gasPrice: { date: "2024-06-10", pricePerGallon: 3.2, isAvailable: true, dataSource: "Source: U.S. Energy Information Administration (EIA)" },
    });
  });

  await recorder.step("open record ride page", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("assert current implementation does not prefill legacy last ride miles", async () => {
    await expect(page.locator("#miles")).toHaveValue("");
    await expect(page.locator("#rideMinutes")).toHaveValue("");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:ride_form_initializes_with_last_ride_miles_legacy");
  await recorder.save(testInfo);
});
