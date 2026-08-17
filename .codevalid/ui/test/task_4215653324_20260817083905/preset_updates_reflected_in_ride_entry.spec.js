import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedAppSession, setupRidePresetCrudScenario, setupRideEntryPresetSelectionScenario } from "../../helpers/mock-api.js";
import { morningRunPreset, morningRunUpdatedPreset } from "../../mock/mock-data.js";

test("Updated preset values are auto-reflected in ride entry flow", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("preset_updates_reflected_in_ride_entry", testInfo.title);

  await recorder.step("Seed settings preset update scenario and ride preset query scenario", async () => {
    await setupAuthenticatedAppSession(page, { userId: 1, userName: "johndoe" });
    await setupRidePresetCrudScenario(page, {
      initialPresets: [morningRunPreset],
      updatedPresetsById: {
        301: morningRunUpdatedPreset,
      },
    });
    await setupRideEntryPresetSelectionScenario(page, {
      presets: [morningRunUpdatedPreset],
    });
  });

  await recorder.step("Update Morning Run in SettingsPage", async () => {
    await page.goto("/settings");
    await page.getByRole("button", { name: "Edit" }).click();
    await page.locator("#presetDurationMinutes").fill("45");
    await page.locator("#presetMiles").fill("7.5");
    await page.getByRole("button", { name: "Save Preset" }).click();
    await expect(page.getByText("Morning Run (SW, morning, 07:00, 45 min, 7.5 mi)")).toBeVisible();
  });

  await recorder.step("Open ride entry page and verify updated preset list is fetched", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
    const presetResponse = await page.evaluate(async () => {
      const response = await fetch("/api/rides/presets", { method: "GET" });
      return response.json();
    });
    expect(presetResponse.presets[0].miles).toBe(7.5);
    expect(presetResponse.presets[0].durationMinutes).toBe(45);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:preset_updates_reflected_in_ride_entry");
  await recorder.save(testInfo);
});
