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
      thisMonth: { period: "this_month", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 18.42 },
      thisYear: { period: "this_year", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 18.42 },
      allTime: { period: "all_time", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 18.42 }
    },
    page: 1,
    pageSize: 25,
    totalCount: rides.length
  };
}

test("Ride history loads correctly in-browser without PWA installation", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "history_page_loads_rides_in_browser_without_installation",
    "Ride history loads correctly in-browser without PWA installation"
  );

  const rides = [
    {
      rideId: 101,
      rideDateTimeLocal: "2026-08-01T08:00:00",
      miles: 5.2,
      rideMinutes: 24,
      temperature: 68,
      gasPricePerGallon: 3.4999,
      primaryTravelDirection: "NE",
      difficulty: 2,
      windResistanceRating: 1,
      note: "Office commute",
      importSource: null,
      estimatedSavings: 4.1
    },
    {
      rideId: 102,
      rideDateTimeLocal: "2026-08-02T08:15:00",
      miles: 3.8,
      rideMinutes: 19,
      temperature: 71,
      gasPricePerGallon: 3.5999,
      primaryTravelDirection: "SW",
      difficulty: 3,
      windResistanceRating: 0,
      note: "Lunch trip",
      importSource: null,
      estimatedSavings: 2.75
    },
    {
      rideId: 103,
      rideDateTimeLocal: "2026-08-03T18:10:00",
      miles: 6.1,
      rideMinutes: 28,
      temperature: 74,
      gasPricePerGallon: 3.5499,
      primaryTravelDirection: "E",
      difficulty: 3,
      windResistanceRating: -1,
      note: "Evening ride",
      importSource: null,
      estimatedSavings: 5.03
    }
  ];

  await recorder.step("Seed authenticated session before opening protected history route.");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock ride-history API for full browser-mode usage without installation.");
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === "GET" && (url.includes("/Ride") || url.toLowerCase().includes("/ride") || url.toLowerCase().includes("/rides/history"))) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(buildHistoryResponse(rides))
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({})
    });
  });

  await recorder.step("Open the local app directly to the ride history page.");
  await page.goto("/rides/history");

  await recorder.step("Verify history table loads existing rides in browser mode.");
  await expect(page.getByRole("heading", { name: "Ride History" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Ride history table" })).toBeVisible();
  await expect(page.getByText("Office commute")).toBeVisible();
  await expect(page.getByText("Lunch trip")).toBeVisible();
  await expect(page.getByText("Evening ride")).toBeVisible();
  await expect(page.getByText("No rides found for this rider.")).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Total Miles (Visible)" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:history_page_loads_rides_in_browser_without_installation");
  await recorder.save(testInfo);
});
