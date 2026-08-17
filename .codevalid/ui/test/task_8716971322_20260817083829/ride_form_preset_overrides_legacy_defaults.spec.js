import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("preset values override last-ride defaults when presets exist", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "ride_form_preset_overrides_legacy_defaults",
    testTitle: testInfo.title,
  });

  await recorder.step("setup authenticated session with preset data", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page, {
      presets: [
        {
          presetId: 101,
          name: "Trail Loop",
          primaryDirection: "South",
          periodTag: "morning",
          exactStartTimeLocal: "08:00",
          durationMinutes: 60,
          miles: 15.2,
          lastUsedAtUtc: "2024-06-10T12:00:00Z",
          updatedAtUtc: "2024-06-10T12:00:00Z",
        },
      ],
      gasPrice: { date: "2024-06-10", pricePerGallon: 3.65, isAvailable: true, dataSource: "Source: U.S. Energy Information Administration (EIA)" },
      weather: {
        rideDateTimeLocal: "2024-06-10T08:00",
        temperature: 68,
        windSpeedMph: 7,
        windDirectionDeg: 45,
        relativeHumidityPercent: 50,
        cloudCoverPercent: 20,
        precipitationType: "None",
        isAvailable: true,
      },
    });
  });

  await recorder.step("open record ride page", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
    await expect(page.locator("#ridePreset")).toBeVisible();
  });

  await recorder.step("select preset and verify populated fields", async () => {
    await page.locator("#ridePreset").selectOption("101");
    await expect(page.locator("#miles")).toHaveValue("15.2");
    await expect(page.locator("#rideMinutes")).toHaveValue("60");
    await expect(page.locator("#rideDateTimeLocal")).toHaveValue(/T08:00$/);
  });

  await recorder.step("verify preset-populated values remain editable", async () => {
    await page.locator("#miles").fill("16.1");
    await page.locator("#rideMinutes").fill("65");
    await expect(page.locator("#miles")).toHaveValue("16.1");
    await expect(page.locator("#rideMinutes")).toHaveValue("65");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:ride_form_preset_overrides_legacy_defaults");
  await recorder.save(testInfo);
});
