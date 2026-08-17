import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupSettingsPageScenario } from "../../helpers/mock-api.js";

test("settings_page_update_failure_allows_fallback_usage", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "settings_page_update_failure_allows_fallback_usage",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session and update-failed snapshot", async () => {
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
          status: "failed",
          failureReason: "Update check failed",
          targetVersion: "latest",
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

  await recorder.step("Verify fallback usage remains available in current implementation", async () => {
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Import Rides from CSV" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Export Data" })).toBeVisible();
  });

  await recorder.step("Confirm no explicit update-failure banner or retry-update button exists", async () => {
    await expect(
      page.getByText("Update failed. You can continue using the current version or try again later.")
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Retry Update" })).toHaveCount(0);
  });

  await recorder.step("Verify ride-tracking navigation remains usable", async () => {
    await page.getByRole("link", { name: "Import Rides from CSV" }).click();
    await expect(page).toHaveURL(/\/rides\/import$/);
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:settings_page_update_failure_allows_fallback_usage");
  await recorder.save(testInfo);
});
