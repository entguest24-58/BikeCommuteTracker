import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("when wind speed is zero, calculated difficulty defaults to 1 regardless of direction", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "zero_wind_speed_defaults_difficulty_to_1",
    testTitle: testInfo.title,
  });

  await recorder.step("setup session and open page", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page);
    await page.goto("/rides/record");
  });

  await recorder.step("set zero wind and choose direction", async () => {
    await page.locator("#windSpeedMph").fill("0");
    await page.locator("#primaryTravelDirection").selectOption("East");
    await expect(page.locator("#difficulty")).toHaveValue("1");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:zero_wind_speed_defaults_difficulty_to_1");
  await recorder.save(testInfo);
});
