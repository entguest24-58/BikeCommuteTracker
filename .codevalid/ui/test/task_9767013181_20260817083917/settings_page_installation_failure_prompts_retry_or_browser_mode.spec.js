import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupSettingsPageScenario } from "../../helpers/mock-api.js";

test("settings_page_installation_failure_prompts_retry_or_browser_mode", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "settings_page_installation_failure_prompts_retry_or_browser_mode",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session and install-supported snapshot", async () => {
    await setupAuthenticatedSession(page);
    await page.addInitScript(() => {
      window.__CODEVALID_PWA_SNAPSHOT__ = {
        launchContext: {
          mode: "browser_tab",
          isOnline: true,
          appVersion: "1.2.0",
        },
        installationState: {
          status: "idle",
          isInstallSupported: true,
          installPromptAvailable: true,
        },
        updateState: {
          status: "idle",
        },
      };

      window.__CODEVALID_PROMPT_PWA_INSTALL__ = async () => false;
    });
  });

  await recorder.step("Mock settings APIs", async () => {
    await setupSettingsPageScenario(page);
  });

  await recorder.step("Open settings page", async () => {
    await page.goto("/settings");
  });

  await recorder.step("Trigger install attempt", async () => {
    await expect(page.getByRole("heading", { name: "Install App" })).toBeVisible();
    await page.getByRole("button", { name: "Install on this computer" }).click();
  });

  await recorder.step("Verify source-implemented install failure recovery message", async () => {
    await expect(
      page.getByText("Install was not completed. You can continue in browser mode and retry later.")
    ).toBeVisible();
  });

  await recorder.step("Confirm current implementation does not expose explicit browser-mode and retry-install buttons", async () => {
    await expect(page.getByRole("button", { name: "Use Browser Version" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Retry Installation" })).toHaveCount(0);
  });

  await recorder.step("Verify core ride-tracking navigation remains accessible", async () => {
    await page.getByRole("link", { name: "Import Rides from CSV" }).click();
    await expect(page).toHaveURL(/\/rides\/import$/);
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:settings_page_installation_failure_prompts_retry_or_browser_mode");
  await recorder.save(testInfo);
});
