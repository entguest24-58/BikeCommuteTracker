import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupSettingsPageScenario } from "../../helpers/mock-api.js";

test("settings_page_update_in_progress_during_launch", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "settings_page_update_in_progress_during_launch",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session and an update-downloading snapshot", async () => {
    await setupAuthenticatedSession(page);
    await page.addInitScript(() => {
      window.__CODEVALID_PWA_SNAPSHOT__ = {
        launchContext: {
          mode: "installed_window",
          isOnline: true,
          appVersion: "1.2.0",
        },
        installationState: {
          status: "idle",
          isInstallSupported: true,
          installPromptAvailable: true,
        },
        updateState: {
          status: "downloading",
          targetVersion: "latest",
        },
      };
    });
  });

  await recorder.step("Mock settings APIs", async () => {
    await setupSettingsPageScenario(page);
  });

  await recorder.step("Launch settings page", async () => {
    await page.goto("/settings");
  });

  await recorder.step("Verify current implementation does not render update-progress messaging", async () => {
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(
      page.getByText("Updating Commute Bike Tracker… Please wait.")
    ).toHaveCount(0);
    await expect(page.getByText("Loading settings...")).toHaveCount(0);
  });

  await recorder.step("Verify settings content still renders despite update state", async () => {
    await expect(page.getByRole("heading", { name: "Install App" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Export Data" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:settings_page_update_in_progress_during_launch");
  await recorder.save(testInfo);
});
