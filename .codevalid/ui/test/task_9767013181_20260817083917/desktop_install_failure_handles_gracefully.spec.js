import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Desktop installer failure prompts retry or browser use", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "desktop_install_failure_handles_gracefully",
    testTitle: "Desktop installer failure prompts retry or browser use",
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

  await recorder.step("Verify graceful desktop install failure UI", async () => {
    await expect(page.getByRole("heading", { name: "Install App" })).toBeVisible();
    await expect(
      page.getByText(
        "Installation failed. Do you want to try again or continue using the app in your browser?"
      )
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry Installation" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue in Browser" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:desktop_install_failure_handles_gracefully");
  await recorder.save(testInfo);
});
