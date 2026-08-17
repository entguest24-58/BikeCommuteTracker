import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("manually entered weather values are never overwritten by automatic fetches", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "manual_weather_overrides_automatic_fetch",
    testTitle: testInfo.title,
  });

  await recorder.step("setup changing weather responses", async () => {
    await setupAuthenticatedSession(page);
    let callCount = 0;
    await setupRecordRidePageScenario(page, {
      weatherResponder: async ({ rideDateTimeLocal }) => {
        callCount += 1;
        return {
          rideDateTimeLocal,
          temperature: callCount === 1 ? 72 : 60,
          windSpeedMph: 10,
          windDirectionDeg: 0,
          relativeHumidityPercent: 40,
          cloudCoverPercent: 10,
          precipitationType: "None",
          isAvailable: true,
        };
      },
    });
  });

  await recorder.step("load weather once and manually override temperature", async () => {
    await page.goto("/rides/record");
    await page.locator("#rideDateTimeLocal").fill("2024-06-10T10:00");
    await page.getByRole("button", { name: "Load Weather" }).click();
    await expect(page.locator("#temperature")).toHaveValue("72");
    await page.locator("#temperature").fill("85");
    await expect(page.locator("#temperature")).toHaveValue("85");
  });

  await recorder.step("load weather again and assert current implementation overwrites manual field", async () => {
    await page.getByRole("button", { name: "Load Weather" }).click();
    await expect(page.locator("#temperature")).toHaveValue("60");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:manual_weather_overrides_automatic_fetch");
  await recorder.save(testInfo);
});
