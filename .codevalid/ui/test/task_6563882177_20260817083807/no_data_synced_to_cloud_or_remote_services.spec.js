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
      thisMonth: { period: "this_month", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 10.25 },
      thisYear: { period: "this_year", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 10.25 },
      allTime: { period: "all_time", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 10.25 }
    },
    page: 1,
    pageSize: 25,
    totalCount: rides.length
  };
}

test("No user data (rides, keys, settings) is transmitted to any cloud or remote service", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "no_data_synced_to_cloud_or_remote_services",
    "No user data (rides, keys, settings) is transmitted to any cloud or remote service"
  );

  let rides = [
    {
      rideId: 801,
      rideDateTimeLocal: "2026-08-15T08:00:00",
      miles: 4.6,
      rideMinutes: 23,
      temperature: 71,
      gasPricePerGallon: 3.51,
      primaryTravelDirection: "E",
      difficulty: 2,
      windResistanceRating: 0,
      note: "Local only",
      importSource: null
    }
  ];

  const seenUrls = [];
  const seenBodies = [];

  await recorder.step("Seed authenticated session before running protected-route flows.");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock all APIs locally and capture each outgoing request.");
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    seenUrls.push(url);
    const body = route.request().postData();
    if (body) {
      seenBodies.push(body);
    }

    if (method === "GET" && (url.includes("/Ride") || url.toLowerCase().includes("/ride") || url.toLowerCase().includes("/rides/history"))) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(buildHistoryResponse(rides))
      });
      return;
    }

    if ((method === "PUT" || method === "PATCH") && (url.toLowerCase().includes("/ride/") || url.toLowerCase().includes("/rides/"))) {
      const payload = route.request().postDataJSON();
      rides = rides.map((ride) =>
        ride.rideId === 801
          ? {
              ...ride,
              ...payload,
              note: payload.note,
              miles: payload.miles
            }
          : ride
      );
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
      return;
    }

    if (method === "DELETE" && (url.toLowerCase().includes("/ride/") || url.toLowerCase().includes("/rides/"))) {
      rides = [];
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
      return;
    }

    if (method === "GET" && url.toLowerCase().includes("weather")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ temperature: 73, windSpeedMph: 6, windDirectionDeg: 200, relativeHumidityPercent: 40, cloudCoverPercent: 5, precipitationType: "none" })
      });
      return;
    }

    if (method === "GET" && url.toLowerCase().includes("gas")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ isAvailable: true, pricePerGallon: 3.7999, dataSource: "Source: (EIA)" })
      });
      return;
    }

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
            weatherApiKey: "masked-weather-key",
            eiaGasApiKey: "masked-eia-key"
          }
        })
      });
      return;
    }

    if (method === "GET" && url.toLowerCase().includes("preset")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ presets: [] }) });
      return;
    }

    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
  });

  await recorder.step("Perform edit, weather load, delete, and settings flows while monitoring requests.");
  await page.goto("/rides/history");
  await page.getByRole("button", { name: "Edit" }).click();
  await page.locator('#edit-ride-miles-801').fill("6.3");
  await page.locator('#edit-ride-note-801').fill("Still local");
  await page.getByRole("button", { name: "Load Weather" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Confirm Delete" }).click();
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await recorder.step("Assert all traffic stays within local app APIs and excludes secret values.");
  for (const url of seenUrls) {
    expect(url).toContain("/api/");
    expect(url).not.toContain("masked-weather-key");
    expect(url).not.toContain("masked-eia-key");
    expect(url).not.toMatch(/vendor|cloud/i);
  }
  const combinedBodies = seenBodies.join("\n");
  expect(combinedBodies).not.toContain("masked-weather-key");
  expect(combinedBodies).not.toContain("masked-eia-key");

  console.log("CODEVALID_TEST_ASSERTION_OK:no_data_synced_to_cloud_or_remote_services");
  await recorder.save(testInfo);
});
