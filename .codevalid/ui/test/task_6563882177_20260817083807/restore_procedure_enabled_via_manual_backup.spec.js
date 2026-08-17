import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupSettingsPageScenario,
} from "../../helpers/mock-api.js";

test("Settings persist after manual database restore", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "restore_procedure_enabled_via_manual_backup",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed restored local settings snapshot", async () => {
    await setupAuthenticatedSession(page);
    await page.route(/https?:\/\/(?!localhost|127\.0\.0\.1).*/i, async (route) => {
      await route.abort();
    });
    await setupSettingsPageScenario(page, {
      settings: {
        weatherApiKey: "backup_weather_key",
        eiaGasApiKey: "backup_eia_key",
        averageCarMpg: 29,
      },
      persistedSettings: {
        weatherApiKey: "backup_weather_key",
        eiaGasApiKey: "backup_eia_key",
        averageCarMpg: 29,
      },
      presets: [],
    });
  });

  await recorder.step("Load settings matching restored backup state", async () => {
    await page.goto("/settings");
    await expect(page.getByPlaceholder("Enter EIA API key to enable gas price lookup")).toHaveValue("backup_eia_key");
    await expect(page.getByPlaceholder("Optional — leave blank to use free tier")).toHaveValue("backup_weather_key");
  });

  await recorder.step("Simulate app restart via full page reload and verify restored values remain", async () => {
    await page.reload();
    await expect(page.getByPlaceholder("Enter EIA API key to enable gas price lookup")).toHaveValue("backup_eia_key");
    await expect(page.getByPlaceholder("Optional — leave blank to use free tier")).toHaveValue("backup_weather_key");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:restore_procedure_enabled_via_manual_backup");
  await recorder.save(testInfo);
});
