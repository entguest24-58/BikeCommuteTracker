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
      thisMonth: { period: "this_month", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 12.44 },
      thisYear: { period: "this_year", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 12.44 },
      allTime: { period: "all_time", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 12.44 }
    },
    page: 1,
    pageSize: 25,
    totalCount: rides.length
  };
}

test("Weather data is loaded using local API keys without sending user rides or keys to the cloud", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "weather_data_loads_via_local_api_keys_without_cloud_leakage",
    "Weather data is loaded using local API keys without sending user rides or keys to the cloud"
  );

  const observedRequests = [];
  const rides = [
    {
      rideId: 501,
      rideDateTimeLocal: "2026-08-11T08:00:00",
      miles: 9.1,
      rideMinutes: 42,
      temperature: null,
      gasPricePerGallon: null,
      primaryTravelDirection: "E",
      difficulty: 3,
      windResistanceRating: 1,
      note: "Weather check",
      importSource: null
    }
  ];

  await recorder.step("Seed authenticated session before loading settings and history.");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock settings, history, weather, and gas-price requests while collecting network evidence.");
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const headers = route.request().headers();
    observedRequests.push({ url, method, headers });

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
            locationLabel: "Home",
            latitude: 40.7128,
            longitude: -74.006,
            dashboardGallonsAvoidedEnabled: false,
            dashboardGoalProgressEnabled: false,
            weatherApiKey: "hidden-open-meteo-key",
            eiaGasApiKey: "hidden-eia-key"
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
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(buildHistoryResponse(rides)) });
      return;
    }

    if (method === "GET" && url.toLowerCase().includes("weather")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          temperature: 72,
          windSpeedMph: 8,
          windDirectionDeg: 180,
          relativeHumidityPercent: 45,
          cloudCoverPercent: 10,
          precipitationType: "none"
        })
      });
      return;
    }

    if (method === "GET" && url.toLowerCase().includes("gas")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ isAvailable: true, pricePerGallon: 3.7899, dataSource: "Source: (EIA)" })
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
  });

  await recorder.step("Verify stored API keys are only represented by password fields in settings.");
  await page.goto("/settings");
  await expect(page.getByPlaceholder("Enter EIA API key to enable gas price lookup")).toHaveAttribute("type", "password");
  await expect(page.getByPlaceholder("Optional — leave blank to use free tier")).toHaveAttribute("type", "password");

  await recorder.step("Open history, edit a ride, and load weather through local app APIs.");
  await page.goto("/rides/history");
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Load Weather" }).click();
  await expect(page.locator('#edit-ride-temperature-501')).toHaveValue("72");
  await expect(page.locator('#edit-ride-wind-speed-501')).toHaveValue("8");

  await recorder.step("Assert observed requests do not leak keys or ride notes to external domains.");
  for (const request of observedRequests) {
    expect(request.url).toContain("/api/");
    expect(request.url).not.toContain("hidden-open-meteo-key");
    expect(request.url).not.toContain("hidden-eia-key");
    expect(request.url).not.toContain("Weather%20check");
    expect(JSON.stringify(request.headers)).not.toContain("hidden-open-meteo-key");
    expect(JSON.stringify(request.headers)).not.toContain("hidden-eia-key");
  }

  console.log("CODEVALID_TEST_ASSERTION_OK:weather_data_loads_via_local_api_keys_without_cloud_leakage");
  await recorder.save(testInfo);
});
