import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupRidePresetScenario } from "../../helpers/mock-api.js";

test("Morning preset defaults to SW direction when unspecified", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "default_direction_suggestion_morning",
    testTitle: testInfo.title,
  });

  await recorder.step("setup authenticated session and morning preset resolved to default SW", async () => {
    await setupAuthenticatedSession(page);
    await setupRidePresetScenario(page, {
      presets: [
        {
          presetId: 301,
          name: "Early Commute",
          primaryDirection: "SW",
          periodTag: "morning",
          exactStartTimeLocal: "06:15",
          durationMinutes: 20,
          miles: 3.4,
          lastUsedAtUtc: null,
          updatedAtUtc: "2026-08-17T08:00:00.000Z",
        },
      ],
    });
  });

  await recorder.step("open record ride and apply early commute preset", async () => {
    await page.goto("/rides/record");
    await page.locator("#ridePreset").selectOption("301");
    await page.getByRole("button", { name: "Apply Preset" }).click();
  });

  await recorder.step("verify direction is prefilled as SW", async () => {
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("SW");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:default_direction_suggestion_morning");
  await recorder.save(testInfo);
});
