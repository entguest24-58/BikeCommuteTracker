import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

function json(route, status, body) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function setupCoreScenario(page) {
  await page.addInitScript(() => {
    window.__CODEVALID_DB_ASSERTION__ = "local-only";
  });

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.toLowerCase();
    const method = request.method();

    if (path.endsWith("/settings") && method === "GET") {
      return json(route, 200, {
        settings: {
          averageCarMpg: 30,
          yearlyGoalMiles: 1500,
          oilChangePrice: 55,
          mileageRateCents: 70,
          locationLabel: "Downtown",
          latitude: 41.0,
          longitude: -87.0,
          dashboardGallonsAvoidedEnabled: true,
          dashboardGoalProgressEnabled: true,
          weatherApiKey: "existing-weather-key",
          eiaGasApiKey: "existing-eia-key",
        },
      });
    }

    if (path.endsWith("/settings") && (method === "PUT" || method === "POST" || method === "PATCH")) {
      const body = request.postDataJSON?.() ?? {};
      return json(route, 200, {
        settings: {
          averageCarMpg: 30,
          yearlyGoalMiles: 1500,
          oilChangePrice: 55,
          mileageRateCents: 70,
          locationLabel: "Downtown",
          latitude: 41.0,
          longitude: -87.0,
          dashboardGallonsAvoidedEnabled: true,
          dashboardGoalProgressEnabled: true,
          weatherApiKey: body.weatherApiKey ?? "existing-weather-key",
          eiaGasApiKey: body.eiaGasApiKey ?? "existing-eia-key",
        },
      });
    }

    if (path.includes("ridepreset") && method === "GET") {
      return json(route, 200, { presets: [] });
    }

    if (path.includes("gas") && method === "GET") {
      return json(route, 200, {
        isAvailable: true,
        pricePerGallon: 3.25,
        dataSource: "Source: U.S. Energy Information Administration (EIA)",
      });
    }

    if (path.includes("ride") && method === "POST") {
      return json(route, 201, { rideId: 2026 });
    }

    if (path.includes("ride") && method === "GET") {
      if (url.searchParams.has("rideDateTimeLocal") || url.searchParams.has("dateTime") || url.searchParams.has("rideDateTime")) {
        return json(route, 200, {
          temperature: 72,
          windSpeedMph: 6,
          windDirectionDeg: 200,
          relativeHumidityPercent: 40,
          cloudCoverPercent: 10,
          precipitationType: "none",
        });
      }
      return json(route, 200, {
        rides: [
          {
            rideId: 2026,
            rideDateTimeLocal: "2026-08-17T08:15",
            miles: 8.4,
            note: "Browser mode ride",
          },
        ],
        totalCount: 1,
      });
    }

    if (path.includes("dashboard") && method === "GET") {
      return json(route, 200, {
        summary: { totalMiles: 8.4, totalSavings: 5.67 },
        monthlyMiles: [{ month: "2026-08", miles: 8.4 }],
        monthlySavings: [{ month: "2026-08", savings: 5.67 }],
      });
    }

    if (path.includes("expense") && method === "GET") {
      return json(route, 200, { expenses: [], totalCount: 0 });
    }

    if (path.includes("export") || path.includes("csv") || path.includes("zip")) {
      return route.fulfill({
        status: 200,
        contentType: "application/octet-stream",
        body: "mock-export-content",
      });
    }

    return json(route, 200, {});
  });
}

test("core_features_accessible_without_pwa_installation", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "core_features_accessible_without_pwa_installation",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated browser-only session and local mocks", async () => {
    await setupAuthenticatedSession(page, {
      token: "mock-valid-token",
      user: {
        userId: 101,
        userName: "alex",
        lastActivityAtUtc: "2099-01-01T00:00:00.000Z",
      },
    });
    await page.addInitScript(() => {
      window.localStorage.setItem("token", "mock-valid-token");
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          userId: 101,
          userName: "alex",
          lastActivityAtUtc: "2099-01-01T00:00:00.000Z",
        })
      );
      window.sessionStorage.setItem(
        "bike_tracking_auth_session",
        JSON.stringify({
          userId: 101,
          userName: "alex",
          lastActivityAtUtc: "2099-01-01T00:00:00.000Z",
          expiresAtUtc: "2099-01-08T00:00:00.000Z",
        })
      );
    });
    await setupCoreScenario(page);
  });

  await recorder.step("Open Record Ride in browser mode", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Browser Mode" })).toBeVisible();
  });

  await recorder.step("Submit a ride entry while remaining in browser mode", async () => {
    await page.locator("#miles").fill("8.4");
    await page.locator("#rideMinutes").fill("32");
    await page.locator("#notes").fill("Browser mode ride");
    await page.getByRole("button", { name: /record ride/i }).click();
    await expect(page.getByText("Ride recorded successfully (ID: 2026)")).toBeVisible();
  });

  await recorder.step("Verify ride history remains accessible", async () => {
    await page.getByRole("link", { name: "Ride History" }).click();
    await expect(page).toHaveURL(/\/rides\/history$/);
    await expect(page.getByRole("heading", { name: "Ride History" })).toBeVisible();
    await expect(page.getByText("Browser mode ride")).toBeVisible();
  });

  await recorder.step("Verify dashboard remains accessible", async () => {
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Miles by Month" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Savings by Month" })).toBeVisible();
  });

  await recorder.step("Verify settings are accessible and API key fields are preserved", async () => {
    await page.getByRole("button", { name: "alex" }).click();
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByPlaceholder("Enter EIA API key to enable gas price lookup")).toHaveValue("existing-eia-key");
    await expect(page.getByPlaceholder("Optional — leave blank to use free tier")).toHaveValue("existing-weather-key");
  });

  await recorder.step("Verify import-export entry points remain available", async () => {
    await expect(page.getByRole("heading", { name: "Export Data" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Import Rides from CSV" })).toBeVisible();
    await page.getByRole("link", { name: "Import Rides from CSV" }).click();
    await expect(page).toHaveURL(/\/rides\/import$/);
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:core_features_accessible_without_pwa_installation");
  await recorder.save(testInfo);
});
