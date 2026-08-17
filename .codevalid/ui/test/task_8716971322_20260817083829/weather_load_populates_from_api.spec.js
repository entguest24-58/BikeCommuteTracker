import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("weather data auto-populates from API call when Load Weather is triggered", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "weather_load_populates_from_api",
    testTitle: testInfo.title,
  });

  await recorder.step("setup page with weather response", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page, {
      weather: {
        rideDateTimeLocal: "2024-06-10T10:00",
        temperature: 72,
        windSpeedMph: 15,
        windDirectionDeg: 0,
        relativeHumidityPercent: 45,
        cloudCoverPercent: 35,
        precipitationType: "Rain",
        isAvailable: true,
      },
    });
  });

  await recorder.step("open page and set ride datetime", async () => {
    await page.goto("/rides/record");
    await page.locator("#rideDateTimeLocal").fill("2024-06-10T10:00");
  });

  await recorder.step("load weather and assert fields populated", async () => {
    await page.getByRole("button", { name: "Load Weather" }).click();
    await expect(page.locator("#temperature")).toHaveValue("72");
    await expect(page.locator("#windSpeedMph")).toHaveValue("15");
    await expect(page.locator("#windDirectionDeg")).toHaveValue("0");
    await expect(page.locator("#relativeHumidityPercent")).toHaveValue("45");
    await expect(page.locator("#cloudCoverPercent")).toHaveValue("35");
    await expect(page.locator("#precipitationType")).toHaveValue("Rain");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:weather_load_populates_from_api");
  await recorder.save(testInfo);
});
