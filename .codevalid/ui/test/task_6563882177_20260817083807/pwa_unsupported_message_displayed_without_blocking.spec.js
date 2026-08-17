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

async function setupScenarioMocks(page) {
  await page.addInitScript(() => {
    const snapshot = {
      launchContext: {
        isOnline: true,
        mode: "browser_tab",
        appVersion: "test",
      },
      installationState: {
        isInstallSupported: false,
        installPromptAvailable: false,
        status: "unavailable",
        reasonCode: "unsupported_browser",
      },
      updateState: {
        status: "idle",
      },
    };
    window.__CODEVALID_PWA_SNAPSHOT__ = snapshot;
  });

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.toLowerCase();
    const method = request.method();

    if (path.endsWith("/settings") && method === "GET") {
      return json(route, 200, {
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
      });
    }

    if (path.includes("ridepreset") && method === "GET") {
      return json(route, 200, { presets: [] });
    }

    if (path.includes("ride") && method === "GET") {
      if (url.searchParams.has("rideDateTimeLocal") || url.searchParams.has("dateTime") || url.searchParams.has("rideDateTime")) {
        return json(route, 200, {
          temperature: 65,
          windSpeedMph: 4,
          windDirectionDeg: 190,
          relativeHumidityPercent: 50,
          cloudCoverPercent: 15,
          precipitationType: "none",
        });
      }
      return json(route, 200, { rides: [], totalCount: 0 });
    }

    if (path.includes("gas") && method === "GET") {
      return json(route, 200, {
        isAvailable: true,
        pricePerGallon: 3.35,
        dataSource: "Source: U.S. Energy Information Administration (EIA)",
      });
    }

    if (path.includes("dashboard") && method === "GET") {
      return json(route, 200, {
        summary: { totalMiles: 0, totalSavings: 0 },
        monthlyMiles: [],
        monthlySavings: [],
      });
    }

    return json(route, 200, {});
  });
}

test("pwa_unsupported_message_displayed_without_blocking", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "pwa_unsupported_message_displayed_without_blocking",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session and unsupported-install scenario", async () => {
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
    await setupScenarioMocks(page);
  });

  await recorder.step("Open settings to observe install guidance", async () => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Install App" })).toBeVisible();
  });

  await recorder.step("Verify unsupported PWA message is visible", async () => {
    await expect(
      page.getByText("Installation is not available in this browser in v1. Use current Chrome or Edge on Windows, or continue using browser mode.")
    ).toBeVisible();
  });

  await recorder.step("Verify navigation remains functional while unsupported guidance is shown", async () => {
    await page.getByRole("link", { name: "Record Ride" }).click();
    await expect(page).toHaveURL(/\/rides\/record$/);
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();

    await page.getByRole("link", { name: "Ride History" }).click();
    await expect(page).toHaveURL(/\/rides\/history$/);
    await expect(page.getByRole("heading", { name: "Ride History" })).toBeVisible();

    await page.getByRole("button", { name: "alex" }).click();
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(
      page.getByText("Installation is not available in this browser in v1. Use current Chrome or Edge on Windows, or continue using browser mode.")
    ).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:pwa_unsupported_message_displayed_without_blocking");
  await recorder.save(testInfo);
});
