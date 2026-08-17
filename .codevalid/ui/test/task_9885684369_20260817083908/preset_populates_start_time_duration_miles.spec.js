import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupRidePresetScenario } from "../../helpers/mock-api.js";

test("Preset correctly populates start time, duration, and miles fields", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "preset_populates_start_time_duration_miles",
    testTitle: testInfo.title,
  });

  await recorder.step("setup authenticated session and preset data", async () => {
    await setupAuthenticatedSession(page);
    await setupRidePresetScenario(page, {
      presets: [
        {
          presetId: 601,
          name: "Evening Workout",
          primaryDirection: "NE",
          periodTag: "afternoon",
          exactStartTimeLocal: "18:30",
          durationMinutes: 45,
          miles: 7.1,
          lastUsedAtUtc: null,
          updatedAtUtc: "2026-08-17T08:00:00.000Z",
        },
      ],
    });
  });

  await recorder.step("open record ride and apply the preset", async () => {
    await page.goto("/rides/record");
    await page.locator("#ridePreset").selectOption("601");
    await page.getByRole("button", { name: "Apply Preset" }).click();
  });

  await recorder.step("verify start time, duration, and miles are prefilled", async () => {
    await expect(page.locator("#rideDateTimeLocal")).toHaveValue(/T18:30$/);
    await expect(page.locator("#rideMinutes")).toHaveValue("45");
    await expect(page.locator("#miles")).toHaveValue("7.1");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:preset_populates_start_time_duration_miles");
  await recorder.save(testInfo);
});
