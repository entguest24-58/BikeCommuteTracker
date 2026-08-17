import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupSettingsPageScenario,
} from "../../helpers/mock-api.js";

test("API key fields retain their values after browser refresh or tab reload", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "api_key_fields_preserve_values_after_reload",
    testTitle: testInfo.title,
  });

  await recorder.step("Register settings save and reload scenario", async () => {
    await setupAuthenticatedSession(page);
    await setupSettingsPageScenario(page, {
      settings: {
        weatherApiKey: "",
        eiaGasApiKey: "",
      },
      persistedSettings: {
        weatherApiKey: "mock_open_meteo_key_456",
        eiaGasApiKey: "mock_eia_key_123",
      },
      presets: [],
    });
  });

  await recorder.step("Save both API keys", async () => {
    await page.goto("/settings");
    await page.getByPlaceholder("Enter EIA API key to enable gas price lookup").fill("mock_eia_key_123");
    await page.getByPlaceholder("Optional — leave blank to use free tier").fill("mock_open_meteo_key_456");
    await page.getByRole("button", { name: "Save Settings" }).click();
    await expect(page.getByText("Settings saved successfully.")).toBeVisible();
  });

  await recorder.step("Refresh and reopen settings route", async () => {
    await page.reload();
    await page.goto("/settings");
    await expect(page.getByPlaceholder("Enter EIA API key to enable gas price lookup")).toHaveValue("mock_eia_key_123");
    await expect(page.getByPlaceholder("Optional — leave blank to use free tier")).toHaveValue("mock_open_meteo_key_456");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:api_key_fields_preserve_values_after_reload");
  await recorder.save(testInfo);
});
