import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupSettingsPageScenario } from "../../helpers/mock-api.js";

test("settings_page_no_update_needed_with_online_status", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "settings_page_no_update_needed_with_online_status",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session and up-to-date online snapshot", async () => {
    await setupAuthenticatedSession(page);
    await page.addInitScript(() => {
      window.__CODEVALID_PWA_SNAPSHOT__ = {
        launchContext: {
          mode: "installed_window",
          isOnline: true,
          appVersion: "latest",
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
    });
  });

  await recorder.step("Mock settings APIs", async () => {
    await setupSettingsPageScenario(page);
  });

  await recorder.step("Open settings page", async () => {
    await page.goto("/settings");
  });

  await recorder.step("Verify settings page loads normally", async () => {
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Install App" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Export Data" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ride Presets" })).toBeVisible();
  });

  await recorder.step("Confirm no update or retry messaging is shown", async () => {
    await expect(page.getByText("Updating Commute Bike Tracker… Please wait.")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Retry Update" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Retry Connection" })).toHaveCount(0);
  });

  await recorder.step("Verify interactive install control remains available immediately", async () => {
    await expect(page.getByRole("button", { name: "Install on this computer" })).toBeEnabled();
    await expect(page.getByRole("link", { name: "Import Rides from CSV" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:settings_page_no_update_needed_with_online_status");
  await recorder.save(testInfo);
});
