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
      thisMonth: { period: "this_month", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 9.21 },
      thisYear: { period: "this_year", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 9.21 },
      allTime: { period: "all_time", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 9.21 }
    },
    page: 1,
    pageSize: 25,
    totalCount: rides.length
  };
}

test("Core ride tracking flows remain fully accessible when PWA installation is unsupported", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "history_page_functional_in_unsupported_pwa_environment",
    "Core ride tracking flows remain fully accessible when PWA installation is unsupported"
  );

  let rides = [
    {
      rideId: 201,
      rideDateTimeLocal: "2026-08-05T08:00:00",
      miles: 4.1,
      rideMinutes: 22,
      temperature: 67,
      gasPricePerGallon: 3.45,
      primaryTravelDirection: "N",
      difficulty: 2,
      windResistanceRating: 0,
      note: "Original unsupported-env note",
      importSource: null
    }
  ];

  await recorder.step("Seed authenticated session before visiting protected settings and history pages.");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock settings APIs and unsupported-install UI environment.");
  await page.addInitScript(() => {
    window.__TEST_PWA_SNAPSHOT__ = {
      launchContext: { mode: "browser_tab" },
      installationState: {
        isInstallSupported: false,
        installPromptAvailable: false,
        reasonCode: "unsupported_browser"
      }
    };
  });

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
            weatherApiKey: null,
            eiaGasApiKey: null
          }
        })
      });
      return;
    }

    if (method === "GET" && url.toLowerCase().includes("preset")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ presets: [] })
      });
      return;
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
      const body = route.request().postDataJSON();
      rides = rides.map((ride) =>
        ride.rideId === 201
          ? {
              ...ride,
              ...body,
              note: body.note,
              miles: body.miles
            }
          : ride
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true })
      });
      return;
    }

    if (method === "DELETE" && (url.toLowerCase().includes("/ride/") || url.toLowerCase().includes("/rides/"))) {
      rides = [];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true })
      });
      return;
    }

    if (method === "GET" && url.toLowerCase().includes("weather")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ temperature: 70, windSpeedMph: 5, windDirectionDeg: 180, relativeHumidityPercent: 40, cloudCoverPercent: 10, precipitationType: "none" })
      });
      return;
    }

    if (method === "GET" && url.toLowerCase().includes("gas")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ isAvailable: false, pricePerGallon: null, dataSource: null })
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
  });

  await recorder.step("Open settings and verify install guidance does not block browser mode.");
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Install App" })).toBeVisible();
  await expect(page.getByText("Installation is not available in this browser in v1. Use current Chrome or Edge on Windows, or continue using browser mode.")).toBeVisible();

  await recorder.step("Open ride history and edit a ride successfully.");
  await page.goto("/rides/history");
  await expect(page.getByRole("heading", { name: "Ride History" })).toBeVisible();
  await page.getByRole("button", { name: "Edit" }).click();
  await page.locator('#edit-ride-miles-201').fill("5.5");
  await page.locator('#edit-ride-note-201').fill("Edited while install unsupported");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Edited while install unsupported")).toBeVisible();

  await recorder.step("Delete the ride and confirm delete workflow remains available.");
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("heading", { name: "Delete Ride" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm Delete" }).click();
  await expect(page.getByText("No rides found for this rider.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:history_page_functional_in_unsupported_pwa_environment");
  await recorder.save(testInfo);
});
