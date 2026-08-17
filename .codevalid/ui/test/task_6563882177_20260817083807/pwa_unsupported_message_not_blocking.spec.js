import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupSettingsPageScenario,
  setupUnsupportedPwaBrowserMode,
} from "../../helpers/mock-api.js";

test("PWA unsupported guidance does not block access to SettingsPage", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "pwa_unsupported_message_not_blocking",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed unsupported PWA environment and authenticated session", async () => {
    await setupAuthenticatedSession(page);
    await setupUnsupportedPwaBrowserMode(page, { reasonCode: "unsupported_browser" });
    await setupSettingsPageScenario(page, {
      settings: {
        weatherApiKey: "",
        eiaGasApiKey: "",
      },
      persistedSettings: {
        weatherApiKey: "",
        eiaGasApiKey: "not_blocked_key",
      },
      presets: [],
    });
  });

  await recorder.step("Open settings and verify unsupported message is shown", async () => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(
      page.getByText(
        "Installation is not available in this browser in v1. Use current Chrome or Edge on Windows, or continue using browser mode."
      )
    ).toBeVisible();
  });

  await recorder.step("Modify and save a setting despite unsupported install", async () => {
    const eiaInput = page.getByPlaceholder("Enter EIA API key to enable gas price lookup");
    await eiaInput.fill("not_blocked_key");
    await page.getByRole("button", { name: "Save Settings" }).click();

    await expect(page.getByText("Settings saved successfully.")).toBeVisible();
    await expect(eiaInput).toHaveValue("not_blocked_key");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:pwa_unsupported_message_not_blocking");
  await recorder.save(testInfo);
});
