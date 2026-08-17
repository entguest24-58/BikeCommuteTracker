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

async function setupCoreAppMocks(page) {
  const settingsPayload = {
    settings: {
      averageCarMpg: 28,
      yearlyGoalMiles: 1200,
      oilChangePrice: 60,
      mileageRateCents: 67,
      locationLabel: "Home",
      latitude: 40.7128,
      longitude: -74.006,
      dashboardGallonsAvoidedEnabled: true,
      dashboardGoalProgressEnabled: true,
      weatherApiKey: "",
      eiaGasApiKey: "",
    },
  };

  const ridePresetsPayload = { presets: [] };
  const rideHistoryPayload = {
    rides: [
      {
        rideId: 101,
        rideDateTimeLocal: "2026-08-16T08:30",
        miles: 12.5,
        note: "Morning commute",
      },
    ],
    totalCount: 1,
  };

  const dashboardPayload = {
    summary: {
      totalMiles: 12.5,
      totalSavings: 8.42,
    },
    monthlyMiles: [{ month: "2026-08", miles: 12.5 }],
    monthlySavings: [{ month: "2026-08", savings: 8.42 }],
  };

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path.includes("/auth/") || path.includes("/events")) {
      return route.fallback();
    }

    if (path.endsWith("/settings") && method === "GET") {
      return json(route, 200, settingsPayload);
    }

    if (path.endsWith("/settings") && (method === "PUT" || method === "POST" || method === "PATCH")) {
      return json(route, 200, settingsPayload);
    }

    if (path.toLowerCase().includes("ridepreset") && method === "GET") {
      return json(route, 200, ridePresetsPayload);
    }

    if (path.toLowerCase().includes("ride") && method === "GET") {
      if (url.searchParams.has("rideDateTimeLocal") || url.searchParams.has("dateTime") || url.searchParams.has("rideDateTime")) {
        return json(route, 200, {
          temperature: 68,
          windSpeedMph: 5,
          windDirectionDeg: 180,
          relativeHumidityPercent: 45,
          cloudCoverPercent: 20,
          precipitationType: "none",
        });
      }
      return json(route, 200, rideHistoryPayload);
    }

    if (path.toLowerCase().includes("gas") && method === "GET") {
      return json(route, 200, {
        isAvailable: true,
        pricePerGallon: 3.49,
        dataSource: "Source: U.S. Energy Information Administration (EIA)",
      });
    }

    if (path.toLowerCase().includes("dashboard") && method === "GET") {
      return json(route, 200, dashboardPayload);
    }

    if (path.toLowerCase().includes("expense") && method === "GET") {
      return json(route, 200, { expenses: [], totalCount: 0 });
    }

    if ((path.toLowerCase().includes("export") || path.toLowerCase().includes("csv") || path.toLowerCase().includes("zip")) && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/octet-stream",
        body: "mock-export",
      });
    }

    return json(route, 200, {});
  });
}

test("app_header_navigation_in_browser_mode", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "app_header_navigation_in_browser_mode",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated browser-mode session and core mocks", async () => {
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
    await setupCoreAppMocks(page);
  });

  await recorder.step("Open dashboard in browser mode", async () => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Browser Mode" })).toBeVisible();
  });

  await recorder.step("Navigate to Record Ride from AppHeader", async () => {
    await page.getByRole("link", { name: "Record Ride" }).click();
    await expect(page).toHaveURL(/\/rides\/record$/);
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("Navigate to Ride History from AppHeader", async () => {
    await page.getByRole("link", { name: "Ride History" }).click();
    await expect(page).toHaveURL(/\/rides\/history$/);
    await expect(page.getByRole("heading", { name: "Ride History" })).toBeVisible();
  });

  await recorder.step("Navigate back to Dashboard from AppHeader", async () => {
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();
  });

  await recorder.step("Open Settings from user menu", async () => {
    await page.getByRole("button", { name: "alex" }).click();
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Install App" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:app_header_navigation_in_browser_mode");
  await recorder.save(testInfo);
});
