import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedBikeSession,
  mockRecordRidePage,
} from "../../helpers/mock-api.js";
import { morningCommutePreset, weatherLookupAfternoonClear } from "../../mock/mock-data.js";

test("Preset selection populates direction, time, duration, and miles", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "preset_selection_populates_fields",
    testTitle: testInfo.title,
  });

  await recorder.step("seed auth and preset-driven page", async () => {
    await setupAuthenticatedBikeSession(page);
    await mockRecordRidePage(page, {
      presets: [morningCommutePreset],
      weatherResponse: weatherLookupAfternoonClear,
      gasPrice: 3.45,
    });
  });

  await recorder.step("load page with preset selector", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
    await expect(page.locator("#ridePreset")).toBeVisible();
  });

  await recorder.step("select preset and verify form values", async () => {
    await page.locator("#ridePreset").selectOption(String(morningCommutePreset.presetId));
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("North");
    await expect(page.locator("#rideMinutes")).toHaveValue("55");
    await expect(page.locator("#miles")).toHaveValue("12");
    await expect(page.locator("#rideDateTimeLocal")).toHaveValue(/T07:30$/);
  });

  await recorder.step("verify editable untouched fields remain usable", async () => {
    await expect(page.locator("#difficulty")).toHaveValue("");
    await expect(page.locator("#notes")).toHaveValue("");
    await page.locator("#miles").fill("13");
    await expect(page.locator("#miles")).toHaveValue("13");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:preset_selection_populates_fields");
  await recorder.save(testInfo);
});
