import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";

const SETTINGS_PATH = "/settings";
const SESSION_KEY = "bike_tracking_auth_session";

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

test("export_expenses_button_visible", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "export_expenses_button_visible",
    testTitle: "Export Expenses button is visible and labeled clearly",
  });

  await recorder.step("Seed authenticated session and bootstrap settings page APIs", async () => {
    await seedAuthenticatedSession(page);
    await mockSettingsPageBootstrap(page);
  });

  await recorder.step("Load the Settings page", async () => {
    await page.goto(SETTINGS_PATH);
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  await recorder.step("Locate the export controls section", async () => {
    await expect(page.getByRole("heading", { name: "Export Data" })).toBeVisible();
  });

  await recorder.step("Verify Export Expenses button is visible and clearly labeled", async () => {
    await expect(page.getByRole("button", { name: "Export Expenses" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:export_expenses_button_visible");
  await recorder.save(testInfo);
});
