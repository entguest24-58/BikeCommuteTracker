import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedAppSession, setupRidePresetCrudScenario } from "../../helpers/mock-api.js";
import { dailyCommutePreset, eveningRunPreset } from "../../mock/mock-data.js";

test("Editing preset to duplicate name is blocked", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("edit_preset_duplicate_name", testInfo.title);

  await recorder.step("Seed two presets", async () => {
    await setupAuthenticatedAppSession(page, { userId: 1, userName: "johndoe" });
    await setupRidePresetCrudScenario(page, {
      initialPresets: [dailyCommutePreset, eveningRunPreset],
      duplicateNameMessage: "A preset with this name already exists for your account.",
    });
  });

  await recorder.step("Open SettingsPage", async () => {
    await page.goto("/settings");
  });

  await recorder.step("Edit Evening Run to duplicate Daily Commute name", async () => {
    await page.getByText("Evening Run (NE, afternoon, 18:00, 40 min, 4.8 mi)").locator("..")
      .getByRole("button", { name: "Edit" }).click();
    await page.locator("#presetName").fill("Daily Commute");
    await page.getByRole("button", { name: "Save Preset" }).click();
  });

  await recorder.step("Verify duplicate error and unchanged list", async () => {
    await expect(page.getByRole("alert")).toContainText("A preset with this name already exists for your account.");
    await expect(page.getByText("Evening Run (NE, afternoon, 18:00, 40 min, 4.8 mi)")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:edit_preset_duplicate_name");
  await recorder.save(testInfo);
});
