import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupRidePresetSynchronizationScenario } from "../../helpers/mock-api.js";

test("Changes to presets in settings section are reflected instantly on RecordRidePage", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "record_ride_presets_synchronize_with_settings",
    testTitle: testInfo.title,
  });

  await recorder.step("setup authenticated session and shared preset state", async () => {
    await setupAuthenticatedSession(page);
    await setupRidePresetSynchronizationScenario(page, {
      initialPresets: [
        {
          presetId: 801,
          name: "Test Preset",
          primaryDirection: "SW",
          periodTag: "morning",
          exactStartTimeLocal: "07:10",
          durationMinutes: 28,
          miles: 4.9,
          lastUsedAtUtc: null,
          updatedAtUtc: "2026-08-17T08:00:00.000Z",
        },
      ],
    });
  });

  await recorder.step("verify preset appears on record ride page", async () => {
    await page.goto("/rides/record");
    await expect(page.locator("#ridePreset")).toBeVisible();
    await expect(page.locator("#ridePreset")).toContainText("Test Preset");
  });

  await recorder.step("open username menu, navigate to settings, and delete the preset", async () => {
    await page.getByRole("button", { name: "johndoe" }).click();
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ride Presets" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Preset deleted.")).toBeVisible();
  });

  await recorder.step("return to record ride page and verify preset is gone", async () => {
    await page.goto("/rides/record");
    await expect(page.locator("#ridePreset")).toHaveCount(0);
    await expect(page.getByText("Test Preset")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:record_ride_presets_synchronize_with_settings");
  await recorder.save(testInfo);
});
