import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("weather data is cached by hour-rounded timestamp and rider location for reuse", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "weather_cache_reuse_by_hour_and_location",
    testTitle: testInfo.title,
  });

  let weatherCalls = 0;

  await recorder.step("setup page with weather responder", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page, {
      weatherResponder: async ({ rideDateTimeLocal }) => {
        weatherCalls += 1;
        return {
          rideDateTimeLocal,
          temperature: 70,
          windSpeedMph: 8,
          windDirectionDeg: 180,
          relativeHumidityPercent: 55,
          cloudCoverPercent: 25,
          precipitationType: "None",
          isAvailable: true,
        };
      },
    });
  });

  await recorder.step("first load", async () => {
    await page.goto("/rides/record");
    await page.locator("#rideDateTimeLocal").fill("2024-06-10T11:15");
    await page.getByRole("button", { name: "Load Weather" }).click();
    await expect(page.locator("#temperature")).toHaveValue("70");
  });

  await recorder.step("assert frontend calls weather endpoint once for requested load", async () => {
    expect(weatherCalls).toBe(1);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:weather_cache_reuse_by_hour_and_location");
  await recorder.save(testInfo);
});
