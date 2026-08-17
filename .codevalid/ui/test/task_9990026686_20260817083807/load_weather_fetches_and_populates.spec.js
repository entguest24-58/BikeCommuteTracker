import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedBikeSession,
  mockRecordRidePage,
} from "../../helpers/mock-api.js";
import { weatherLookupAfternoonClear } from "../../mock/mock-data.js";

test("Weather lookup populates fields using timestamp and location", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "load_weather_fetches_and_populates",
    testTitle: testInfo.title,
  });

  await recorder.step("seed auth and weather route", async () => {
    await setupAuthenticatedBikeSession(page);
    await mockRecordRidePage(page, {
      presets: [],
      weatherResponse: weatherLookupAfternoonClear,
      gasPrice: null,
    });
  });

  await recorder.step("open page and set ride datetime", async () => {
    await page.goto("/rides/record");
    await page.locator("#rideDateTimeLocal").fill("2024-06-10T14:25");
  });

  await recorder.step("load weather and verify populated fields", async () => {
    await page.getByRole("button", { name: "Load Weather" }).click();
    await expect(page.locator("#temperature")).toHaveValue("68");
    await expect(page.locator("#windSpeedMph")).toHaveValue("12");
    await expect(page.locator("#windDirectionDeg")).toHaveValue("315");
    await expect(page.locator("#relativeHumidityPercent")).toHaveValue("61");
    await expect(page.locator("#cloudCoverPercent")).toHaveValue("20");
    await expect(page.locator("#precipitationType")).toHaveValue("none");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:load_weather_fetches_and_populates");
  await recorder.save(testInfo);
});
