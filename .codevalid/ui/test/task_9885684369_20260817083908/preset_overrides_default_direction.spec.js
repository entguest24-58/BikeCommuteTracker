import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupRidePresetScenario } from "../../helpers/mock-api.js";

test("Rider override of default direction is preserved and applied", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "preset_overrides_default_direction",
    testTitle: testInfo.title,
  });

  await recorder.step("setup authenticated session and morning preset with explicit direction E", async () => {
    await setupAuthenticatedSession(page);
    await setupRidePresetScenario(page, {
      presets: [
        {
          presetId: 501,
          name: "Quick Commute",
          primaryDirection: "East",
          periodTag: "morning",
          exactStartTimeLocal: "07:20",
          durationMinutes: 15,
          miles: 2.8,
          lastUsedAtUtc: null,
          updatedAtUtc: "2026-08-17T08:00:00.000Z",
        },
      ],
    });
  });

  await recorder.step("apply quick commute preset", async () => {
    await page.goto("/rides/record");
    await page.locator("#ridePreset").selectOption("501");
    await page.getByRole("button", { name: "Apply Preset" }).click();
  });

  await recorder.step("verify explicit preset direction overrides morning default", async () => {
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("East");
    await expect(page.locator("#primaryTravelDirection")).not.toHaveValue("SW");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:preset_overrides_default_direction");
  await recorder.save(testInfo);
});
