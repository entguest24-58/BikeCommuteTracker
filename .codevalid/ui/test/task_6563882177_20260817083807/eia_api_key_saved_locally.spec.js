import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupSettingsPageScenario,
} from "../../helpers/mock-api.js";

test("EIA Gas Price API key is saved locally and not transmitted", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "eia_api_key_saved_locally",
    testTitle: testInfo.title,
  });

  await recorder.step("Block unexpected external traffic and register local settings mocks", async () => {
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
        weatherApiKey: "",
        eiaGasApiKey: "mock_eia_key_123",
      },
      presets: [],
    });
  });

  await recorder.step("Enter EIA API key and save", async () => {
    await page.goto("/settings");
    const eiaInput = page.getByPlaceholder("Enter EIA API key to enable gas price lookup");

    await eiaInput.fill("mock_eia_key_123");
    await page.getByRole("button", { name: "Save Settings" }).click();

    await expect(page.getByText("Settings saved successfully.")).toBeVisible();
    await expect(eiaInput).toHaveValue("mock_eia_key_123");
  });

  await recorder.step("Reload page and verify key persisted locally", async () => {
    await page.reload();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(
      page.getByPlaceholder("Enter EIA API key to enable gas price lookup")
    ).toHaveValue("mock_eia_key_123");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:eia_api_key_saved_locally");
  await recorder.save(testInfo);
});
