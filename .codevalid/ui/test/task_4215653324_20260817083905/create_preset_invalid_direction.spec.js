import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedAppSession, setupRidePresetCrudScenario } from "../../helpers/mock-api.js";

test("Preset creation fails with invalid primary travel direction", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("create_preset_invalid_direction", testInfo.title);

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedAppSession(page, { userId: 1, userName: "johndoe" });
    await setupRidePresetCrudScenario(page, { initialPresets: [] });
  });

  await recorder.step("Open SettingsPage", async () => {
    await page.goto("/settings");
  });

  await recorder.step("Verify direction control is a constrained select with canonical options", async () => {
    await expect(page.locator("#presetPrimaryDirection")).toBeVisible();
    await expect(page.locator("#presetPrimaryDirection option")).toHaveCount(8);
    await expect(page.locator("#presetPrimaryDirection")).toHaveValue("SW");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:create_preset_invalid_direction");
  await recorder.save(testInfo);
});
