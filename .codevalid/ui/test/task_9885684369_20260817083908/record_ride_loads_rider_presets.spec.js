import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupRidePresetScenario } from "../../helpers/mock-api.js";

test("Record Ride page loads authenticated rider's preset collection on load", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "record_ride_loads_rider_presets",
    testTitle: testInfo.title,
  });

  await recorder.step("setup authenticated session and ride preset mocks", async () => {
    await setupAuthenticatedSession(page);
    await setupRidePresetScenario(page, {
      presets: [
        {
          presetId: 101,
          name: "Commute Home",
          primaryDirection: "SW",
          periodTag: "morning",
          exactStartTimeLocal: "07:00",
          durationMinutes: 30,
          miles: 5.2,
          lastUsedAtUtc: null,
          updatedAtUtc: "2026-08-17T08:00:00.000Z",
        },
        {
          presetId: 102,
          name: "Commute Work",
          primaryDirection: "NE",
          periodTag: "afternoon",
          exactStartTimeLocal: "17:00",
          durationMinutes: 25,
          miles: 4.8,
          lastUsedAtUtc: null,
          updatedAtUtc: "2026-08-17T08:05:00.000Z",
        },
      ],
    });
  });

  await recorder.step("load the record ride page", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("verify preset dropdown contains only rider presets in order", async () => {
    const presetSelect = page.locator("#ridePreset");
    await expect(presetSelect).toBeVisible();
    await expect(presetSelect.locator("option")).toHaveCount(3);
    await expect(presetSelect.locator("option").nth(1)).toContainText("Commute Home");
    await expect(presetSelect.locator("option").nth(2)).toContainText("Commute Work");
    await expect(presetSelect).not.toContainText("Other Rider Preset");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:record_ride_loads_rider_presets");
  await recorder.save(testInfo);
});
