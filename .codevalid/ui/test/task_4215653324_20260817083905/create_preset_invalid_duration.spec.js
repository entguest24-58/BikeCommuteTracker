import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedAppSession, setupRidePresetCrudScenario } from "../../helpers/mock-api.js";

test("Preset creation fails with non-positive duration", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("create_preset_invalid_duration", testInfo.title);

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedAppSession(page, { userId: 1, userName: "johndoe" });
    await setupRidePresetCrudScenario(page, { initialPresets: [] });
  });

  await recorder.step("Open SettingsPage", async () => {
    await page.goto("/settings");
  });

  await recorder.step("Fill preset form with zero duration", async () => {
    await page.locator("#presetName").fill("Zero Duration Ride");
    await page.locator("#presetExactStartTimeLocal").fill("08:00");
    await page.locator("#presetDurationMinutes").fill("0");
    await page.locator("#presetMiles").fill("5.2");
    await page.getByRole("button", { name: "Add Preset" }).click();
  });

  await recorder.step("Verify real UI duration validation message", async () => {
    await expect(page.getByRole("alert")).toContainText("Duration minutes must be greater than 0.");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:create_preset_invalid_duration");
  await recorder.save(testInfo);
});
