import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

function json(route, status, body) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

function buildHistoryResponse(rides) {
  return {
    summaries: {
      thisMonth: { miles: 10.2, rideCount: rides.length, period: "thisMonth" },
      thisYear: { miles: 10.2, rideCount: rides.length, period: "thisYear" },
      allTime: { miles: 10.2, rideCount: rides.length, period: "allTime" },
    },
    filteredTotal: { miles: 10.2, rideCount: rides.length, period: "filtered" },
    rides,
    page: 1,
    pageSize: 25,
    totalRows: rides.length,
  };
}

async function seedFrontendSession(page) {
  await setupAuthenticatedSession(page);
  await page.addInitScript(() => {
    const now = new Date().toISOString();
    window.sessionStorage.setItem("bike_tracking_auth_session", JSON.stringify({
      userId: 1,
      userName: "testrider",
      lastActivityAtUtc: now,
      expiresAtUtc: new Date(Date.now() + 3600000).toISOString(),
    }));
  });
}

test("edit_ride_wind_resistance_recalculated_on_direction_change", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "edit_ride_wind_resistance_recalculated_on_direction_change", testTitle: testInfo.title });
  const ride = {
    rideId: 101,
    rideDateTimeLocal: "2024-06-15T07:30:00",
    miles: 10.2,
    rideMinutes: 30,
    windSpeedMph: 15,
    windDirectionDeg: 270,
    difficulty: 4,
    primaryTravelDirection: "North",
    note: "Good ride",
  };

  await seedFrontendSession(page);
  await page.route("**/api/rides/history**", async (route) => json(route, 200, buildHistoryResponse([ride])));
  await page.route("**/api/rides/gas-price**", async (route) => json(route, 200, { date: "2024-06-15", pricePerGallon: null, isAvailable: false, dataSource: null }));

  await recorder.step("open edit form", async () => {
    await page.goto("/rides/history");
    await page.getByRole("button", { name: "Edit" }).click();
  });

  await recorder.step("change direction and observe suggested difficulty", async () => {
    await page.locator("#edit-ride-direction-101").selectOption("South");
    await expect(page.locator("#edit-ride-difficulty-101")).toHaveValue("5");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:edit_ride_wind_resistance_recalculated_on_direction_change");
  await recorder.save(testInfo);
});
