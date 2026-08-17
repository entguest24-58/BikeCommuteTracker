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

test("no_data_sent_to_cloud_storage", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "no_data_sent_to_cloud_storage",
    testTitle: testInfo.title,
  });

  const outboundHosts = [];

  await recorder.step("Seed authenticated session and capture outbound network hosts", async () => {
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

    page.on("request", (request) => {
      const url = new URL(request.url());
      if (!url.pathname.startsWith("/api/") && !url.pathname.startsWith("/@vite") && !url.pathname.startsWith("/src/") && !url.pathname.startsWith("/node_modules/") && !url.pathname.startsWith("/logo") && !url.pathname.startsWith("/favicon") && !outboundHosts.includes(url.host)) {
        outboundHosts.push(url.host);
      }
    });

    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname.toLowerCase();
      const method = request.method();

      if (path.endsWith("/settings") && method === "GET") {
        return json(route, 200, {
          settings: {
            averageCarMpg: 29,
            yearlyGoalMiles: 1200,
            oilChangePrice: 50,
            mileageRateCents: 67,
            locationLabel: "Local Install Folder",
            latitude: 41.5,
            longitude: -81.6,
            dashboardGallonsAvoidedEnabled: true,
            dashboardGoalProgressEnabled: true,
            weatherApiKey: "local-weather-key",
            eiaGasApiKey: "local-eia-key",
          },
        });
      }

      if (path.includes("ridepreset") && method === "GET") {
        return json(route, 200, { presets: [] });
      }

      if (path.includes("gas") && method === "GET") {
        return json(route, 200, {
          isAvailable: true,
          pricePerGallon: 3.15,
          dataSource: "Source: U.S. Energy Information Administration (EIA)",
        });
      }

      if (path.includes("ride") && method === "POST") {
        return json(route, 201, { rideId: 4001 });
      }

      if (path.includes("ride") && method === "GET") {
        if (url.searchParams.has("rideDateTimeLocal") || url.searchParams.has("dateTime") || url.searchParams.has("rideDateTime")) {
          return json(route, 200, {
            temperature: 70,
            windSpeedMph: 5,
            windDirectionDeg: 180,
            relativeHumidityPercent: 42,
            cloudCoverPercent: 12,
            precipitationType: "none",
          });
        }
        return json(route, 200, {
          rides: [
            {
              rideId: 4001,
              rideDateTimeLocal: "2026-08-17T07:45",
              miles: 9.8,
              note: "Fully local ride",
            },
          ],
          totalCount: 1,
        });
      }

      if (path.includes("dashboard") && method === "GET") {
        return json(route, 200, {
          summary: { totalMiles: 9.8, totalSavings: 6.12 },
          monthlyMiles: [{ month: "2026-08", miles: 9.8 }],
          monthlySavings: [{ month: "2026-08", savings: 6.12 }],
        });
      }

      if (path.includes("export") || path.includes("csv") || path.includes("zip")) {
        return route.fulfill({
          status: 200,
          contentType: "application/octet-stream",
          body: "local-export-data",
        });
      }

      if (path.includes("expense") && method === "GET") {
        return json(route, 200, { expenses: [], totalCount: 0 });
      }

      return json(route, 200, {});
    });
  });

  await recorder.step("Navigate through core routes locally", async () => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();

    await page.getByRole("link", { name: "Record Ride" }).click();
    await expect(page).toHaveURL(/\/rides\/record$/);
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();

    await page.getByRole("link", { name: "Ride History" }).click();
    await expect(page).toHaveURL(/\/rides\/history$/);
    await expect(page.getByRole("heading", { name: "Ride History" })).toBeVisible();
  });

  await recorder.step("Perform local ride recording flow", async () => {
    await page.getByRole("link", { name: "Record Ride" }).click();
    await page.locator("#miles").fill("9.8");
    await page.locator("#rideMinutes").fill("35");
    await page.locator("#notes").fill("Fully local ride");
    await page.getByRole("button", { name: /record ride/i }).click();
    await expect(page.getByText("Ride recorded successfully (ID: 4001)")).toBeVisible();
  });

  await recorder.step("Use export entry points and verify settings remain local", async () => {
    await page.getByRole("button", { name: "alex" }).click();
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page.getByRole("heading", { name: "Export Data" })).toBeVisible();
    await expect(page.getByPlaceholder("Enter EIA API key to enable gas price lookup")).toHaveValue("local-eia-key");
    await expect(page.getByPlaceholder("Optional — leave blank to use free tier")).toHaveValue("local-weather-key");
    await page.getByRole("button", { name: "Export Expenses" }).click();
    await page.getByRole("button", { name: "Export Ride History" }).click();
  });

  await recorder.step("Assert no external cloud hosts were contacted", async () => {
    const unexpectedHosts = outboundHosts.filter(
      (host) => host && host !== "localhost" && host !== "127.0.0.1"
    );
    expect(unexpectedHosts).toEqual([]);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:no_data_sent_to_cloud_storage");
  await recorder.save(testInfo);
});
