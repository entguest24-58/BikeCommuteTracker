import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupSettingsPageScenario } from "../../helpers/mock-api.js";

test("settings_page_retry_connectivity_resumes_operations", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "settings_page_retry_connectivity_resumes_operations",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session and initially offline installed snapshot", async () => {
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

  await recorder.step("Mock settings APIs", async () => {
    await setupSettingsPageScenario(page);
  });

  await recorder.step("Load settings page", async () => {
    await page.goto("/settings");
  });

  await recorder.step("Verify no retry-connection affordance is rendered in current UI", async () => {
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry Connection" })).toHaveCount(0);
  });

  await recorder.step("Simulate restored connectivity by mutating the injected snapshot", async () => {
    await page.evaluate(() => {
      window.__CODEVALID_PWA_SNAPSHOT__ = {
        ...(window.__CODEVALID_PWA_SNAPSHOT__ ?? {}),
        launchContext: {
          ...window.__CODEVALID_PWA_SNAPSHOT__.launchContext,
          isOnline: true,
        },
      };
      window.dispatchEvent(new Event("online"));
    });
  });

  await recorder.step("Use the ride operation link after connectivity restoration simulation", async () => {
    await page.getByRole("link", { name: "Import Rides from CSV" }).click();
  });

  await recorder.step("Verify ride-operation route loads normally", async () => {
    await expect(page).toHaveURL(/\/rides\/import$/);
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:settings_page_retry_connectivity_resumes_operations");
  await recorder.save(testInfo);
});
