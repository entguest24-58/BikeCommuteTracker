import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedAppSession, setupRidePresetCrudScenario } from "../../helpers/mock-api.js";

test("Preset creation fails with invalid start time format", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("create_preset_invalid_start_time", testInfo.title);

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedAppSession(page, { userId: 1, userName: "johndoe" });
    await setupRidePresetCrudScenario(page, { initialPresets: [] });
  });

  await recorder.step("Open SettingsPage", async () => {
    await page.goto("/settings");
  });

  await recorder.step("Attempt to enter invalid time in native time input", async () => {
    await page.locator("#presetName").fill("Bad Time Ride");
    await page.locator("#presetDurationMinutes").fill("30");
    await page.locator("#presetMiles").fill("5.0");
    await page.locator("#presetExactStartTimeLocal").fill("25:60");
  });

  await recorder.step("Verify invalid value is not retained by time input", async () => {
    await expect(page.locator("#presetExactStartTimeLocal")).not.toHaveValue("25:60");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:create_preset_invalid_start_time");
  await recorder.save(testInfo);
});
