import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedAppSession, setupRidePresetCrudScenario } from "../../helpers/mock-api.js";
import { dailyCommutePreset, normalizedDirectionPreset } from "../../mock/mock-data.js";

test("Editing preset normalizes direction to canonical form", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("edit_preset_normalized_direction", testInfo.title);

  await recorder.step("Seed editable preset", async () => {
    await setupAuthenticatedAppSession(page, { userId: 1, userName: "johndoe" });
    await setupRidePresetCrudScenario(page, {
      initialPresets: [dailyCommutePreset],
      updatedPresetsById: {
        201: normalizedDirectionPreset,
      },
    });
  });

  await recorder.step("Open SettingsPage and enter edit mode", async () => {
    await page.goto("/settings");
    await page.getByRole("button", { name: "Edit" }).click();
  });

  await recorder.step("Choose canonical NE direction and save", async () => {
    await page.locator("#presetPrimaryDirection").selectOption("NE");
    await page.getByRole("button", { name: "Save Preset" }).click();
  });

  await recorder.step("Verify rendered direction is canonical", async () => {
    await expect(page.getByText("Daily Commute (NE, morning, 07:30, 30 min, 5.2 mi)")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:edit_preset_normalized_direction");
  await recorder.save(testInfo);
});
