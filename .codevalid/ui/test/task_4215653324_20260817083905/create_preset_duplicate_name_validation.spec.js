import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedAppSession, setupRidePresetCrudScenario } from "../../helpers/mock-api.js";
import { dailyCommutePreset } from "../../mock/mock-data.js";

test("Duplicate preset name is blocked during creation with clear error", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("create_preset_duplicate_name_validation", testInfo.title);

  await recorder.step("Seed preset collection with existing Daily Commute", async () => {
    await setupAuthenticatedAppSession(page, { userId: 1, userName: "johndoe" });
    await setupRidePresetCrudScenario(page, {
      initialPresets: [dailyCommutePreset],
      duplicateNameMessage: "A preset with this name already exists for your account.",
    });
  });

  await recorder.step("Open SettingsPage", async () => {
    await page.goto("/settings");
  });

  await recorder.step("Attempt to create duplicate preset", async () => {
    await page.locator("#presetName").fill("Daily Commute");
    await page.locator("#presetPeriodTag").selectOption("morning");
    await page.locator("#presetExactStartTimeLocal").fill("07:45");
    await page.locator("#presetDurationMinutes").fill("30");
    await page.locator("#presetMiles").fill("5.2");
    await page.getByRole("button", { name: "Add Preset" }).click();
  });

  await recorder.step("Verify duplicate-name error is shown and preset is not added", async () => {
    await expect(page.getByRole("alert")).toContainText("A preset with this name already exists for your account.");
    await expect(page.getByText("Daily Commute (SW, morning, 07:30, 30 min, 5.2 mi)")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:create_preset_duplicate_name_validation");
  await recorder.save(testInfo);
});
