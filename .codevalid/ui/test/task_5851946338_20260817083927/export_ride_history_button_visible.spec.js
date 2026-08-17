import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";

const SETTINGS_PATH = "/settings";

function makeAuthSession() {
  const now = new Date().toISOString();
  return {
    userId: 101,
    userName: "codevalid-user",
    lastActivityAtUtc: now,
    expiresAtUtc: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}

async function seedAuthenticatedSession(page, session = makeAuthSession()) {
  await page.addInitScript((payload) => {
    window.sessionStorage.setItem("bike_tracking_auth_session", JSON.stringify(payload));
  }, session);
}

async function mockSettingsPageBootstrap(page) {
  await page.route("**/api/users/me/settings", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        hasSettings: true,
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
  });

  await page.route("**/api/ride-presets", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ presets: [] }),
    });
  });
}

test("export_ride_history_button_visible", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "export_ride_history_button_visible",
    testTitle: "Export Ride History button is visible and labeled clearly",
  });

  await recorder.step("Seed authenticated session and bootstrap settings page APIs", async () => {
    await seedAuthenticatedSession(page);
    await mockSettingsPageBootstrap(page);
  });

  await recorder.step("Load the Settings page", async () => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  await recorder.step("Locate the export controls section", async () => {
    await expect(page.getByRole("heading", { name: "Export Data" })).toBeVisible();
  });

  await recorder.step("Verify Export Ride History button is visible and clearly labeled", async () => {
    await expect(page.getByRole("button", { name: "Export Ride History" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:export_ride_history_button_visible");
  await recorder.save(testInfo);
});
