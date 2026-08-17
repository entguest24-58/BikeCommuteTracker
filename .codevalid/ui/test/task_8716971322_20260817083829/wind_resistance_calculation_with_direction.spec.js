import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("wind resistance rating and difficulty suggestion are auto-calculated when wind speed and direction are set", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "wind_resistance_calculation_with_direction",
    testTitle: testInfo.title,
  });

  await recorder.step("setup session and open page", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page);
    await page.goto("/rides/record");
  });

  await recorder.step("enter wind data and select direction", async () => {
    await page.locator("#windSpeedMph").fill("15");
    await page.locator("#windDirectionDeg").fill("0");
    await page.locator("#primaryTravelDirection").selectOption("South");
  });

  await recorder.step("assert difficulty was auto-suggested", async () => {
    await expect(page.locator("#difficulty")).toHaveValue("5");
    await expect(page.getByText("auto-suggested")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:wind_resistance_calculation_with_direction");
  await recorder.save(testInfo);
});
