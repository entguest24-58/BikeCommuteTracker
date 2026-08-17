import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedAppSession, setupRidePresetCrudScenario } from "../../helpers/mock-api.js";
import { dailyCommutePreset, dailyCommuteUpdatedPreset } from "../../mock/mock-data.js";

test("Editing preset with unchanged name succeeds", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("edit_preset_same_name_no_change", testInfo.title);

  await recorder.step("Seed preset to edit", async () => {
    await setupAuthenticatedAppSession(page, { userId: 1, userName: "johndoe" });
    await setupRidePresetCrudScenario(page, {
      initialPresets: [dailyCommutePreset],
      updatedPresetsById: {
        201: dailyCommuteUpdatedPreset,
      },
    });
  });

  await recorder.step("Open SettingsPage", async () => {
    await page.goto("/settings");
  });

  await recorder.step("Enter edit mode and update duration and miles", async () => {
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(page.getByRole("button", { name: "Save Preset" })).toBeVisible();
    await page.locator("#presetDurationMinutes").fill("45");
    await page.locator("#presetMiles").fill("6");
    await page.getByRole("button", { name: "Save Preset" }).click();
  });

  await recorder.step("Verify preset is updated and name remains unchanged", async () => {
    await expect(page.getByText("Daily Commute (SW, morning, 07:30, 45 min, 6 mi)")).toBeVisible();
    await expect(page.getByText("Preset updated.")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:edit_preset_same_name_no_change");
  await recorder.save(testInfo);
});
