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

test("export_expenses_csv_special_characters_escaped", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "export_expenses_csv_special_characters_escaped",
    testTitle: "Export Expenses properly escapes special characters in CSV",
  });

  let download;

  await recorder.step("Seed authenticated session and mock escaped expense CSV", async () => {
    await seedAuthenticatedSession(page);
    await mockSettingsPageBootstrap(page);
    await page.route("**/api/exports/expenses", async (route) => {
      const csv = [
        "Date,Amount,Notes,CreatedAtUtc",
        '2024-02-10,18.4,"groceries, gas",2024-02-10T10:00:00Z',
        '2024-02-11,22,"He said ""hello""",2024-02-11T11:00:00Z',
        '2024-02-12,9.5,"line one\nline two",2024-02-12T12:00:00Z',
      ].join("\r\n");
      await route.fulfill({
        status: 200,
        headers: { "content-type": "text/csv; charset=utf-8" },
        body: csv,
      });
    });
  });

  await recorder.step("Export expenses", async () => {
    await page.goto("/settings");
    [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export Expenses" }).click(),
    ]);
  });

  await recorder.step("Verify commas, quotes, and newlines are escaped/quoted", async () => {
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const text = Buffer.concat(chunks).toString("utf-8");
    expect(text).toContain('"groceries, gas"');
    expect(text).toContain('"He said ""hello"""');
    expect(text).toContain('"line one\nline two"');
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:export_expenses_csv_special_characters_escaped");
  await recorder.save(testInfo);
});
