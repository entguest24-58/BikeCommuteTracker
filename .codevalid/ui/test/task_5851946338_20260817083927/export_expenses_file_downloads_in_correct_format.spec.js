import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";

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

test("export_expenses_file_downloads_in_correct_format", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "export_expenses_file_downloads_in_correct_format",
    testTitle: "Export Expenses results in a downloadable CSV file with correct filename",
  });

  let download;

  await recorder.step("Seed authenticated session and mock expense export endpoint", async () => {
    await seedAuthenticatedSession(page);
    await mockSettingsPageBootstrap(page);
    await page.route("**/api/exports/expenses", async (route) => {
      await route.fulfill({
        status: 200,
        headers: { "content-type": "text/csv; charset=utf-8" },
        body: "Date,Amount,Notes,CreatedAtUtc\r\n2024-01-01,10,,2024-01-01T00:00:00Z\r\n",
      });
    });
  });

  await recorder.step("Trigger CSV download", async () => {
    await page.goto("/settings");
    [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export Expenses" }).click(),
    ]);
  });

  await recorder.step("Verify downloaded filename and format", async () => {
    expect(download.suggestedFilename()).toBe("expenses-export.csv");
    expect(download.suggestedFilename().endsWith(".csv")).toBe(true);
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:export_expenses_file_downloads_in_correct_format");
  await recorder.save(testInfo);
});
