import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupSettingsPageRoutes,
  setupInstallFailureScenario,
} from "../../helpers/mock-api.js";

test("Installation failure is clearly communicated with retry or browser mode options", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "install_failure_user_informs_and_offers_alternative",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session, startup health, and settings routes");
  await setupAuthenticatedSession(page);
  await setupSettingsPageRoutes(page);
  await page.route("**/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });

  await recorder.step("Inject install failure message and alternatives");
  await setupInstallFailureScenario(page, {
    alertMessage: "Installation failed. You can still use the app in your browser.",
    retryLabel: "Retry Installation",
    continueLabel: "Continue in Browser",
  });

  await recorder.step("Open settings install section");
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Install App" })).toBeVisible();

  await recorder.step("Verify install failure messaging and available alternatives");
  await expect(page.getByText("Installation failed. You can still use the app in your browser.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry Installation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue in Browser" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:install_failure_user_informs_and_offers_alternative");
  await recorder.save(testInfo);
});
