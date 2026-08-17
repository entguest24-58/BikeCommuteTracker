import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedBikeSession,
  mockRecordRidePage,
} from "../../helpers/mock-api.js";

test("No defaults when no presets and no prior rides", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "ride_creation_no_presets_no_last_ride_defaults",
    testTitle: testInfo.title,
  });

  await recorder.step("seed auth and blank record ride state", async () => {
    await setupAuthenticatedBikeSession(page);
    await mockRecordRidePage(page, {
      presets: [],
      gasPrice: null,
    });
  });

  await recorder.step("load record ride page", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("verify only datetime is defaulted and other fields blank", async () => {
    await expect(page.locator("#rideDateTimeLocal")).not.toHaveValue("");
    await expect(page.locator("#miles")).toHaveValue("");
    await expect(page.locator("#rideMinutes")).toHaveValue("");
    await expect(page.locator("#gasPrice")).toHaveValue("");
    await expect(page.locator("#temperature")).toHaveValue("");
    await expect(page.locator("#windSpeedMph")).toHaveValue("");
    await expect(page.locator("#windDirectionDeg")).toHaveValue("");
    await expect(page.locator("#relativeHumidityPercent")).toHaveValue("");
    await expect(page.locator("#cloudCoverPercent")).toHaveValue("");
    await expect(page.locator("#precipitationType")).toHaveValue("");
    await expect(page.locator("#notes")).toHaveValue("");
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("");
    await expect(page.locator("#difficulty")).toHaveValue("");
    await expect(page.locator("#ridePreset")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:ride_creation_no_presets_no_last_ride_defaults");
  await recorder.save(testInfo);
});
