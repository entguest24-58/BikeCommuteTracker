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

function normalizeNewlines(value) {
  return value.replace(/\r\n/g, "\n");
}

test("export_expenses_with_data_generates_valid_csv", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "export_expenses_with_data_generates_valid_csv",
    testTitle: "Export Expenses generates valid CSV with expense data",
  });

  let download;

  await recorder.step("Seed authenticated session and page bootstrap mocks", async () => {
    await seedAuthenticatedSession(page);
    await mockSettingsPageBootstrap(page);
    await page.route("**/api/exports/expenses", async (route) => {
      const csv = [
        "Date,Amount,Notes,CreatedAtUtc",
        '2024-01-15,12.5,"groceries, gas",2024-01-15T08:30:00Z',
        '2024-01-16,20,"He said ""hello""",2024-01-16T09:45:00Z',
        '2024-01-17,5.75,,2024-01-17T11:15:00Z',
      ].join("\r\n");

      await route.fulfill({
        status: 200,
        headers: {
          "content-type": "text/csv; charset=utf-8",
        },
        body: csv,
      });
    });
  });

  await recorder.step("Open Settings page", async () => {
    await page.goto("/settings");
    await expect(page.getByRole("button", { name: "Export Expenses" })).toBeVisible();
  });

  await recorder.step("Click Export Expenses and wait for download", async () => {
    [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export Expenses" }).click(),
    ]);
  });

  await recorder.step("Open the downloaded CSV and verify rows, blank optional fields, escaping, and no summaries", async () => {
    await expect(download.suggestedFilename()).toBe("expenses-export.csv");
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const text = normalizeNewlines(await download.createReadStream().then(async (stream) => {
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks).toString("utf-8");
    }));

    const rows = text.trimEnd().split("\n");
    expect(rows).toHaveLength(4);
    expect(rows[0]).toBe("Date,Amount,Notes,CreatedAtUtc");
    expect(rows[1]).toBe('2024-01-15,12.5,"groceries, gas",2024-01-15T08:30:00Z');
    expect(rows[2]).toBe('2024-01-16,20,"He said ""hello""",2024-01-16T09:45:00Z');
    expect(rows[3]).toBe("2024-01-17,5.75,,2024-01-17T11:15:00Z");
    expect(text).not.toContain("Total");
    expect(text).not.toContain("Subtotal");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:export_expenses_with_data_generates_valid_csv");
  await recorder.save(testInfo);
});
