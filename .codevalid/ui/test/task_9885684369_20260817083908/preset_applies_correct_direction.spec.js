import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupRidePresetScenario } from "../../helpers/mock-api.js";

test("Preset direction is correctly pre-populated and normalized to canonical value", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "preset_applies_correct_direction",
    testTitle: testInfo.title,
  });

  await recorder.step("setup authenticated session and canonical preset payload", async () => {
    await setupAuthenticatedSession(page);
    await setupRidePresetScenario(page, {
      presets: [
        {
          presetId: 201,
          name: "Morning Commute",
          primaryDirection: "SW",
          periodTag: "morning",
          exactStartTimeLocal: "07:00",
          durationMinutes: 30,
          miles: 5.2,
          lastUsedAtUtc: null,
          updatedAtUtc: "2026-08-17T08:00:00.000Z",
        },
      ],
    });
  });

  await recorder.step("open record ride page", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("select morning commute preset and apply it", async () => {
    await page.locator("#ridePreset").selectOption("201");
    await page.getByRole("button", { name: "Apply Preset" }).click();
  });

  await recorder.step("verify canonical SW direction is displayed", async () => {
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("SW");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:preset_applies_correct_direction");
  await recorder.save(testInfo);
});
