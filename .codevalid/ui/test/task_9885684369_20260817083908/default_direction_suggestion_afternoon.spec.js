import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupRidePresetScenario } from "../../helpers/mock-api.js";

test("Afternoon preset defaults to NE direction when unspecified", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "default_direction_suggestion_afternoon",
    testTitle: testInfo.title,
  });

  await recorder.step("setup authenticated session and afternoon preset resolved to default NE", async () => {
    await setupAuthenticatedSession(page);
    await setupRidePresetScenario(page, {
      presets: [
        {
          presetId: 401,
          name: "Evening Home",
          primaryDirection: "NE",
          periodTag: "afternoon",
          exactStartTimeLocal: "17:30",
          durationMinutes: 22,
          miles: 4.1,
          lastUsedAtUtc: null,
          updatedAtUtc: "2026-08-17T08:00:00.000Z",
        },
      ],
    });
  });

  await recorder.step("open record ride and apply evening home preset", async () => {
    await page.goto("/rides/record");
    await page.locator("#ridePreset").selectOption("401");
    await page.getByRole("button", { name: "Apply Preset" }).click();
  });

  await recorder.step("verify direction is prefilled as NE", async () => {
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("NE");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:default_direction_suggestion_afternoon");
  await recorder.save(testInfo);
});
