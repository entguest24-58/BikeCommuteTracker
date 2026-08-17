import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedAppSession, setupRidePresetCrudScenario } from "../../helpers/mock-api.js";

test("Preset creation fails with invalid/missing miles", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("create_preset_invalid_miles", testInfo.title);

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedAppSession(page, { userId: 1, userName: "johndoe" });
    await setupRidePresetCrudScenario(page, { initialPresets: [] });
  });

  await recorder.step("Open SettingsPage", async () => {
    await page.goto("/settings");
  });

  await recorder.step("Fill preset form with zero miles", async () => {
    await page.locator("#presetName").fill("Zero Miles Ride");
    await page.locator("#presetPeriodTag").selectOption("morning");
    await page.locator("#presetExactStartTimeLocal").fill("08:00");
    await page.locator("#presetDurationMinutes").fill("30");
    await page.locator("#presetMiles").fill("0");
    await page.getByRole("button", { name: "Add Preset" }).click();
  });

  await recorder.step("Verify real UI validation message", async () => {
    await expect(page.getByRole("alert")).toContainText("Miles must be greater than 0.");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:create_preset_invalid_miles");
  await recorder.save(testInfo);
});
