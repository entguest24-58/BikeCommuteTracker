import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedAppSession, setupRidePresetCrudScenario } from "../../helpers/mock-api.js";

test("New preset creation applies default direction based on period tag", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("create_preset_with_defaults", testInfo.title);

  await recorder.step("Seed authenticated session with empty presets", async () => {
    await setupAuthenticatedAppSession(page, { userId: 1, userName: "johndoe" });
    await setupRidePresetCrudScenario(page, { initialPresets: [] });
  });

  await recorder.step("Open SettingsPage", async () => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Ride Presets" })).toBeVisible();
  });

  await recorder.step("Enter preset name and select morning", async () => {
    await page.locator("#presetName").fill("Workday Morning");
    await page.locator("#presetPeriodTag").selectOption("morning");
  });

  await recorder.step("Verify morning defaults direction to SW", async () => {
    await expect(page.locator("#presetPrimaryDirection")).toHaveValue("SW");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:create_preset_with_defaults");
  await recorder.save(testInfo);
});
