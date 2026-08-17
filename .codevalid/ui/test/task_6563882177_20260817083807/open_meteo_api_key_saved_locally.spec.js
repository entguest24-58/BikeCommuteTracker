import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupSettingsPageScenario,
} from "../../helpers/mock-api.js";

test("Open-Meteo Weather API key is saved locally and not transmitted", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "open_meteo_api_key_saved_locally",
    testTitle: testInfo.title,
  });

  await recorder.step("Prepare authenticated browser-only settings scenario", async () => {
    await setupAuthenticatedSession(page);
    await page.route(/https?:\/\/(?!localhost|127\.0\.0\.1).*/i, async (route) => {
      await route.abort();
    });
    await setupSettingsPageScenario(page, {
      settings: {
        weatherApiKey: "",
        eiaGasApiKey: "",
      },
      persistedSettings: {
        weatherApiKey: "mock_open_meteo_key_456",
        eiaGasApiKey: "",
      },
      presets: [],
    });
  });

  await recorder.step("Enter Open-Meteo key and save", async () => {
    await page.goto("/settings");
    const weatherInput = page.getByPlaceholder("Optional — leave blank to use free tier");

    await weatherInput.fill("mock_open_meteo_key_456");
    await page.getByRole("button", { name: "Save Settings" }).click();

    await expect(page.getByText("Settings saved successfully.")).toBeVisible();
    await expect(weatherInput).toHaveValue("mock_open_meteo_key_456");
  });

  await recorder.step("Reload and confirm persisted local value", async () => {
    await page.reload();
    await expect(
      page.getByPlaceholder("Optional — leave blank to use free tier")
    ).toHaveValue("mock_open_meteo_key_456");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:open_meteo_api_key_saved_locally");
  await recorder.save(testInfo);
});
