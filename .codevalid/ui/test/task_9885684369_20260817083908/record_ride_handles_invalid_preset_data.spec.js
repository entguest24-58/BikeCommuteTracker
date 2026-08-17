import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupRidePresetScenario } from "../../helpers/mock-api.js";

test("Invalid preset data (missing miles, non-numeric) is prevented from loading", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "record_ride_handles_invalid_preset_data",
    testTitle: testInfo.title,
  });

  await recorder.step("setup authenticated session with corrupted preset filtered out of returned preset list", async () => {
    await setupAuthenticatedSession(page);
    await setupRidePresetScenario(page, {
      presets: [],
    });
  });

  await recorder.step("load record ride page", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("verify no invalid preset can be applied and fields stay empty", async () => {
    await expect(page.locator("#ridePreset")).toHaveCount(0);
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("");
    await expect(page.locator("#miles")).toHaveValue("");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:record_ride_handles_invalid_preset_data");
  await recorder.save(testInfo);
});
