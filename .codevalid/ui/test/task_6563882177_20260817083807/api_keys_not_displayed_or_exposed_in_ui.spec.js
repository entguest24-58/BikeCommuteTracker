import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

function buildHistoryResponse(rides) {
  const totalMiles = rides.reduce((sum, ride) => sum + ride.miles, 0);
  const totalRideMinutes = rides.reduce((sum, ride) => sum + (ride.rideMinutes ?? 0), 0);

  return {
    rides,
    filteredTotal: { miles: totalMiles },
    summaries: {
      thisMonth: { period: "this_month", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 5.9 },
      thisYear: { period: "this_year", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 5.9 },
      allTime: { period: "all_time", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 5.9 }
    },
    page: 1,
    pageSize: 25,
    totalCount: rides.length
  };
}

test("Per-rider API keys are never displayed or exposed in the HistoryPage or related UIs", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "api_keys_not_displayed_or_exposed_in_ui",
    "Per-rider API keys are never displayed or exposed in the HistoryPage or related UIs"
  );

  const consoleMessages = [];
  page.on("console", (message) => consoleMessages.push(message.text()));

  await recorder.step("Seed authenticated session and mock settings/history APIs.");
  await setupAuthenticatedSession(page);
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === "GET" && url.toLowerCase().includes("user") && url.toLowerCase().includes("setting")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
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
            weatherApiKey: "super-secret-weather-key",
            eiaGasApiKey: "super-secret-eia-key"
          }
        })
      });
      return;
    }

    if (method === "GET" && url.toLowerCase().includes("preset")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ presets: [] }) });
      return;
    }

    if (method === "GET" && (url.includes("/Ride") || url.toLowerCase().includes("/ride") || url.toLowerCase().includes("/rides/history"))) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          buildHistoryResponse([
            {
              rideId: 601,
              rideDateTimeLocal: "2026-08-12T08:00:00",
              miles: 4.4,
              rideMinutes: 22,
              temperature: 70,
              gasPricePerGallon: 3.5,
              primaryTravelDirection: "N",
              difficulty: 2,
              windResistanceRating: 0,
              note: "No secrets",
              importSource: null
            }
          ])
        )
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
  });

  await recorder.step("Verify raw key values are not rendered in Settings.");
  await page.goto("/settings");
  await expect(page.getByPlaceholder("Enter EIA API key to enable gas price lookup")).toHaveAttribute("type", "password");
  await expect(page.getByPlaceholder("Optional — leave blank to use free tier")).toHaveAttribute("type", "password");
  await expect(page.locator("body")).not.toContainText("super-secret-weather-key");
  await expect(page.locator("body")).not.toContainText("super-secret-eia-key");

  await recorder.step("Verify raw key values are not rendered in HistoryPage or related ride UI.");
  await page.goto("/rides/history");
  await expect(page.getByRole("heading", { name: "Ride History" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("super-secret-weather-key");
  await expect(page.locator("body")).not.toContainText("super-secret-eia-key");

  await recorder.step("Verify console output does not expose API keys.");
  expect(consoleMessages.join("\n")).not.toContain("super-secret-weather-key");
  expect(consoleMessages.join("\n")).not.toContain("super-secret-eia-key");

  console.log("CODEVALID_TEST_ASSERTION_OK:api_keys_not_displayed_or_exposed_in_ui");
  await recorder.save(testInfo);
});
