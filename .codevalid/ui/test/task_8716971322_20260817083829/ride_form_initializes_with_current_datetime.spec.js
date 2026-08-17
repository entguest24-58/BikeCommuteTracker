import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("ride form initializes with current local date/time on new ride", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "ride_form_initializes_with_current_datetime",
    testTitle: testInfo.title,
  });

  await recorder.step("setup authenticated session and page mocks", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page, {
      gasPrice: { date: "2024-06-10", pricePerGallon: 3.65, isAvailable: true, dataSource: "Source: U.S. Energy Information Administration (EIA)" },
      presets: [],
    });
  });

  await recorder.step("open record ride page", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("assert date time is initialized and other fields are blank/default", async () => {
    const dateTime = page.locator("#rideDateTimeLocal");
    const miles = page.locator("#miles");
    const rideMinutes = page.locator("#rideMinutes");
    const temperature = page.locator("#temperature");
    const windSpeedMph = page.locator("#windSpeedMph");
    const windDirectionDeg = page.locator("#windDirectionDeg");
    const relativeHumidityPercent = page.locator("#relativeHumidityPercent");
    const cloudCoverPercent = page.locator("#cloudCoverPercent");
    const precipitationType = page.locator("#precipitationType");
    const notes = page.locator("#notes");
    const primaryTravelDirection = page.locator("#primaryTravelDirection");
    const difficulty = page.locator("#difficulty");

    const value = await dateTime.inputValue();
    expect(value).not.toBe("");
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

    await expect(miles).toHaveValue("");
    await expect(rideMinutes).toHaveValue("");
    await expect(temperature).toHaveValue("");
    await expect(windSpeedMph).toHaveValue("");
    await expect(windDirectionDeg).toHaveValue("");
    await expect(relativeHumidityPercent).toHaveValue("");
    await expect(cloudCoverPercent).toHaveValue("");
    await expect(precipitationType).toHaveValue("");
    await expect(notes).toHaveValue("");
    await expect(primaryTravelDirection).toHaveValue("");
    await expect(difficulty).toHaveValue("");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:ride_form_initializes_with_current_datetime");
  await recorder.save(testInfo);
});
