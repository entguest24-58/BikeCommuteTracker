import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupSettingsPageScenario,
} from "../../helpers/mock-api.js";

test("Settings page loads and functions fully in-browser without PWA installation", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "settings_page_loads_in_browser",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session and local settings routes", async () => {
    await setupAuthenticatedSession(page);
    await setupSettingsPageScenario(page, {
      settings: {
        averageCarMpg: 28.5,
        yearlyGoalMiles: 1200,
        weatherApiKey: "",
        eiaGasApiKey: "",
      },
      persistedSettings: {
        averageCarMpg: 28.5,
        yearlyGoalMiles: 1200,
        weatherApiKey: "",
        eiaGasApiKey: "browser_mode_key",
      },
      presets: [],
    });
  });

  await recorder.step("Open settings page directly in browser mode", async () => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Install App" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Export Data" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Import Rides from CSV" })).toBeVisible();
  });

  await recorder.step("Interact with settings controls and save", async () => {
    const eiaInput = page.getByPlaceholder("Enter EIA API key to enable gas price lookup");
    const weatherInput = page.getByPlaceholder("Optional — leave blank to use free tier");

    await expect(eiaInput).toBeEnabled();
    await expect(weatherInput).toBeEnabled();
    await expect(page.getByRole("button", { name: "Save Settings" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Use Browser Location" })).toBeEnabled();

    await eiaInput.fill("browser_mode_key");
    await weatherInput.fill("weather_browser_mode_key");
    await page.getByRole("button", { name: "Save Settings" }).click();

    await expect(page.getByText("Settings saved successfully.")).toBeVisible();
  });

  await recorder.step("Confirm navigation remains available", async () => {
    await page.getByRole("link", { name: "Import Rides from CSV" }).click();
    await expect(page).toHaveURL(/\/rides\/import$/);
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:settings_page_loads_in_browser");
  await recorder.save(testInfo);
});
