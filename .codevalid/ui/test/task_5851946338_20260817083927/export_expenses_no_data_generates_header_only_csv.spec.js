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

test("export_expenses_no_data_generates_header_only_csv", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "export_expenses_no_data_generates_header_only_csv",
    testTitle: "Export Expenses with no expenses generates header-only CSV",
  });

  let download;

  await recorder.step("Seed authenticated session and mocks", async () => {
    await seedAuthenticatedSession(page);
    await mockSettingsPageBootstrap(page);
    await page.route("**/api/exports/expenses", async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          "content-type": "text/csv; charset=utf-8",
        },
        body: "Date,Amount,Notes,CreatedAtUtc\r\n",
      });
    });
  });

  await recorder.step("Click Export Expenses", async () => {
    await page.goto("/settings");
    [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export Expenses" }).click(),
    ]);
  });

  await recorder.step("Verify header-only CSV download", async () => {
    await expect(download.suggestedFilename()).toBe("expenses-export.csv");
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const text = Buffer.concat(chunks).toString("utf-8").replace(/\r\n/g, "\n").trimEnd();
    const rows = text.split("\n");
    expect(rows).toEqual(["Date,Amount,Notes,CreatedAtUtc"]);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:export_expenses_no_data_generates_header_only_csv");
  await recorder.save(testInfo);
});
