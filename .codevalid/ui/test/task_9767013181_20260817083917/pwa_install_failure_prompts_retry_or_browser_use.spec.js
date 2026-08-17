import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("PWA installation failure prompts user to retry or continue in browser", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "pwa_install_failure_prompts_retry_or_browser_use",
    testTitle: "PWA installation failure prompts user to retry or continue in browser",
  });

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock startup and settings dependencies", async () => {
    await page.route("**/health", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
    });

    await page.route("**/api/users/settings", async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            settings: {
              averageCarMpg: null,
              yearlyGoalMiles: null,
              oilChangePrice: null,
              mileageRateCents: null,
              locationLabel: null,
              latitude: null,
              longitude: null,
              dashboardGallonsAvoidedEnabled: false,
              dashboardGoalProgressEnabled: false,
              weatherApiKey: null,
              eiaGasApiKey: null,
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ settings: {} }),
      });
    });

    await page.route("**/api/ride-presets", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ presets: [] }),
      });
    });

    await page.goto("/settings");
  });

  await recorder.step("Verify install failure messaging and actions", async () => {
    await expect(page.getByRole("heading", { name: "Install App" })).toBeVisible();
    await expect(
      page.getByText("Installation failed. Your browser could not install the app.")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry Installation" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue Using in Browser" })).toBeVisible();
  });

  await recorder.step("Continue using browser mode", async () => {
    await page.getByRole("button", { name: "Continue Using in Browser" }).click();
    await expect(page).toHaveURL(/\/rides\/import$/);
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:pwa_install_failure_prompts_retry_or_browser_use");
  await recorder.save(testInfo);
});
