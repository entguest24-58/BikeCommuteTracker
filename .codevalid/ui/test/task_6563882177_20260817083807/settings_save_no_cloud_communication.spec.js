import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupSettingsPageScenario,
} from "../../helpers/mock-api.js";

test("Saving any setting in SettingsPage triggers no cloud network calls", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "settings_save_no_cloud_communication",
    testTitle: testInfo.title,
  });

  let externalRequestCount = 0;

  await recorder.step("Seed local-only settings API and watch for external traffic", async () => {
    await setupAuthenticatedSession(page);
    await page.route(/https?:\/\/(?!localhost|127\.0\.0\.1).*/i, async (route) => {
      externalRequestCount += 1;
      await route.abort();
    });
    await setupSettingsPageScenario(page, {
      settings: {
        averageCarMpg: 30,
        yearlyGoalMiles: 1500,
        weatherApiKey: "",
        eiaGasApiKey: "",
        dashboardGallonsAvoidedEnabled: false,
        dashboardGoalProgressEnabled: false,
      },
      persistedSettings: {
        averageCarMpg: 31,
        yearlyGoalMiles: 1600,
        weatherApiKey: "cloudless-weather-key",
        eiaGasApiKey: "cloudless-eia-key",
        dashboardGallonsAvoidedEnabled: true,
        dashboardGoalProgressEnabled: true,
      },
      presets: [],
    });
  });

  await recorder.step("Modify several settings and save all changes", async () => {
    await page.goto("/settings");

    await page.getByPlaceholder("Enter EIA API key to enable gas price lookup").fill("cloudless-eia-key");
    await page.getByPlaceholder("Optional — leave blank to use free tier").fill("cloudless-weather-key");
    await page.locator("#averageCarMpg").fill("31");
    await page.locator("#yearlyGoalMiles").fill("1600");
    await page.locator("#dashboardGallonsAvoidedEnabled").check();
    await page.locator("#dashboardGoalProgressEnabled").check();

    await page.getByRole("button", { name: "Save Settings" }).click();
    await expect(page.getByText("Settings saved successfully.")).toBeVisible();
  });

  await recorder.step("Assert no cloud calls were made", async () => {
    await expect.poll(() => externalRequestCount).toBe(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:settings_save_no_cloud_communication");
  await recorder.save(testInfo);
});
