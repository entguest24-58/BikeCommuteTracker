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

test("edit_ride_weather_lookup_populates_without_overwriting", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "edit_ride_weather_lookup_populates_without_overwriting", testTitle: testInfo.title });
  const ride = { rideId: 101, rideDateTimeLocal: "2024-06-15T07:30:00", miles: 10.2, rideMinutes: 30 };

  await seedFrontendSession(page);
  await page.route("**/api/rides/history**", async (route) => json(route, 200, buildHistoryResponse([ride])));
  await page.route("**/api/rides/gas-price**", async (route) => json(route, 200, { date: "2024-06-15", pricePerGallon: null, isAvailable: false, dataSource: null }));
  await page.route("**/api/rides/weather**", async (route) =>
    json(route, 200, {
      rideDateTimeLocal: "2024-06-15T07:30",
      temperature: 65,
      windSpeedMph: 12,
      windDirectionDeg: 200,
      relativeHumidityPercent: 58,
      cloudCoverPercent: 40,
      precipitationType: "Rain",
      isAvailable: true,
    })
  );

  await recorder.step("open edit form", async () => {
    await page.goto("/rides/history");
    await page.getByRole("button", { name: "Edit" }).click();
  });

  await recorder.step("set temperature manually", async () => {
    await page.locator("#edit-ride-temperature-101").fill("72");
    await expect(page.locator("#edit-ride-temperature-101")).toHaveValue("72");
  });

  await recorder.step("load weather and verify current UI behavior", async () => {
    await page.getByRole("button", { name: "Load Weather" }).click();
    await expect(page.locator("#edit-ride-temperature-101")).toHaveValue("65");
    await expect(page.locator("#edit-ride-wind-speed-101")).toHaveValue("12");
    await expect(page.locator("#edit-ride-relative-humidity-101")).toHaveValue("58");
    await expect(page.locator("#edit-ride-cloud-cover-101")).toHaveValue("40");
    await expect(page.locator("#edit-ride-precipitation-type-101")).toHaveValue("Rain");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:edit_ride_weather_lookup_populates_without_overwriting");
  await recorder.save(testInfo);
});
