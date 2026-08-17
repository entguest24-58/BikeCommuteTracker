import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedAppSession, setupRidePresetCrudScenario } from "../../helpers/mock-api.js";

test("New afternoon preset creation applies NE as default direction", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("create_preset_with_afternoon_defaults", testInfo.title);

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedAppSession(page, { userId: 1, userName: "johndoe" });
    await setupRidePresetCrudScenario(page, { initialPresets: [] });
  });

  await recorder.step("Open SettingsPage", async () => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Ride Presets" })).toBeVisible();
  });

  await recorder.step("Enter preset name and switch period to afternoon", async () => {
    await page.locator("#presetName").fill("Evening Ride");
    await page.locator("#presetPeriodTag").selectOption("afternoon");
  });

  await recorder.step("Verify afternoon defaults direction to NE", async () => {
    await expect(page.locator("#presetPrimaryDirection")).toHaveValue("NE");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:create_preset_with_afternoon_defaults");
  await recorder.save(testInfo);
});
