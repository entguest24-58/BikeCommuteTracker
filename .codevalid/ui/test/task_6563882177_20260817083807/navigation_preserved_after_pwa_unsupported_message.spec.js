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

async function setupScenario(page) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.toLowerCase();
    const method = request.method();

    if (path.endsWith("/settings") && method === "GET") {
      return json(route, 200, {
        settings: {
          averageCarMpg: 28,
          yearlyGoalMiles: 1000,
          oilChangePrice: 50,
          mileageRateCents: 67,
          locationLabel: "Home",
          latitude: 40.7,
          longitude: -74.0,
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
          temperature: 66,
          windSpeedMph: 4,
          windDirectionDeg: 170,
          relativeHumidityPercent: 55,
          cloudCoverPercent: 30,
          precipitationType: "none",
        });
      }
      return json(route, 200, { rides: [], totalCount: 0 });
    }

    if (path.includes("dashboard") && method === "GET") {
      return json(route, 200, {
        summary: { totalMiles: 0, totalSavings: 0 },
        monthlyMiles: [],
        monthlySavings: [],
      });
    }

    if (path.includes("gas") && method === "GET") {
      return json(route, 200, {
        isAvailable: true,
        pricePerGallon: 3.4,
        dataSource: "Source: U.S. Energy Information Administration (EIA)",
      });
    }

    return json(route, 200, {});
  });
}

test("navigation_preserved_after_pwa_unsupported_message", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "navigation_preserved_after_pwa_unsupported_message",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session and unsupported environment", async () => {
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
    await setupScenario(page);
  });

  await recorder.step("Open settings and confirm guidance message is visible", async () => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Install App" })).toBeVisible();
    await expect(
      page.getByText("Installation is not available in this environment. Continue using browser mode.")
    ).toBeVisible();
  });

  await recorder.step("Navigate to dashboard after guidance is shown", async () => {
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();
  });

  await recorder.step("Navigate to ride history after guidance is shown", async () => {
    await page.getByRole("link", { name: "Ride History" }).click();
    await expect(page).toHaveURL(/\/rides\/history$/);
    await expect(page.getByRole("heading", { name: "Ride History" })).toBeVisible();
  });

  await recorder.step("Navigate back to settings and confirm message remains non-blocking", async () => {
    await page.getByRole("button", { name: "alex" }).click();
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(
      page.getByText("Installation is not available in this environment. Continue using browser mode.")
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Record Ride" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:navigation_preserved_after_pwa_unsupported_message");
  await recorder.save(testInfo);
});
