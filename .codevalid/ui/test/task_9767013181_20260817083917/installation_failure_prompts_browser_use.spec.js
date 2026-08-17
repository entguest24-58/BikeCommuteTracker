import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Installation failure presents retry and browser mode options", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("installation_failure_prompts_browser_use", "Installation failure presents retry and browser mode options");

  await recorder.step("Seed authenticated session so the protected settings page can be opened.");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock startup and settings dependencies.");
  await page.route("**/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/settings")) {
      return route.fulfill({
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
    }
    if (url.includes("/presets")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ presets: [] }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });

  await recorder.step("Open settings and verify the install section is available.");
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Install App" })).toBeVisible();

  await recorder.step("Assert the required installation-failure messaging and recovery actions.");
  await expect(
    page.getByText("Installation failed. Your device could not install the Commute Bike Tracker app.")
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry Installation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue Using Browser Version" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:installation_failure_prompts_browser_use");
  await recorder.save(testInfo);
});
