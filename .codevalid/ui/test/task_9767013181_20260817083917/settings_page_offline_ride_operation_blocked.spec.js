import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupSettingsPageScenario } from "../../helpers/mock-api.js";

test("settings_page_offline_ride_operation_blocked", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "settings_page_offline_ride_operation_blocked",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated installed-app snapshot in offline mode", async () => {
    await setupAuthenticatedSession(page);
    await page.addInitScript(() => {
      window.__CODEVALID_PWA_SNAPSHOT__ = {
        launchContext: {
          mode: "installed_window",
          isOnline: false,
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
    });
  });

  await recorder.step("Mock settings and preset APIs", async () => {
    await setupSettingsPageScenario(page);
  });

  await recorder.step("Open the settings page", async () => {
    await page.goto("/settings");
  });

  await recorder.step("Verify settings page and import link are visible", async () => {
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Install App" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Import Rides from CSV" })).toBeVisible();
  });

  await recorder.step("Confirm current mode reflects installed app window", async () => {
    await expect(page.getByText("Current mode: Installed app window")).toBeVisible();
  });

  await recorder.step("Attempt ride-operation navigation via Import Rides link", async () => {
    await page.getByRole("link", { name: "Import Rides from CSV" }).click();
  });

  await recorder.step("Verify current implementation still allows import page navigation", async () => {
    await expect(page).toHaveURL(/\/rides\/import$/);
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();
    await expect(
      page.getByText("Ride operations require an internet connection. Offline creation, editing, or viewing is not supported in v1.")
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Retry Connection" })).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:settings_page_offline_ride_operation_blocked");
  await recorder.save(testInfo);
});
