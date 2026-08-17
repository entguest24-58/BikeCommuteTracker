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

function buildHistoryResponse(rides) {
  const totalMiles = rides.reduce((sum, ride) => sum + ride.miles, 0);
  return {
    summaries: {
      thisMonth: { miles: totalMiles, rideCount: rides.length, period: "thisMonth" },
      thisYear: { miles: totalMiles, rideCount: rides.length, period: "thisYear" },
      allTime: { miles: totalMiles, rideCount: rides.length, period: "allTime" },
    },
    filteredTotal: { miles: totalMiles, rideCount: rides.length, period: "filtered" },
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
    window.sessionStorage.setItem(
      "bike_tracking_auth_session",
      JSON.stringify({
        userId: 1,
        userName: "testrider",
        lastActivityAtUtc: now,
        expiresAtUtc: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })
    );
  });
}

test("edit_ride_valid_all_fields", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "edit_ride_valid_all_fields",
    testTitle: testInfo.title,
  });

  const originalRide = {
    rideId: 101,
    rideDateTimeLocal: "2024-06-15T07:30:00",
    miles: 10.2,
    rideMinutes: 30,
    temperature: 68,
    gasPricePerGallon: 3.5,
    windSpeedMph: 15,
    windDirectionDeg: 270,
    relativeHumidityPercent: 55,
    cloudCoverPercent: 20,
    precipitationType: "None",
    note: "Good ride",
    difficulty: 4,
    primaryTravelDirection: "NE",
    windResistanceRating: 3.5,
  };

  let rides = [originalRide];
  let savedPayload = null;

  await seedFrontendSession(page);

  await page.route("**/api/rides/history**", async (route) =>
    json(route, 200, buildHistoryResponse(rides))
  );

  await page.route("**/api/rides/gas-price**", async (route) =>
    json(route, 200, {
      date: "2024-06-15",
      pricePerGallon: 3.5,
      isAvailable: true,
      dataSource: "Source: (EIA)",
    })
  );

  await page.route("**/api/rides/weather**", async (route) =>
    json(route, 200, {
      rideDateTimeLocal: "2024-06-15T07:30",
      temperature: 70,
      windSpeedMph: 15,
      windDirectionDeg: 270,
      relativeHumidityPercent: 50,
      cloudCoverPercent: 25,
      precipitationType: "None",
      isAvailable: true,
    })
  );

  await page.route("**/api/rides/101", async (route) => {
    if (route.request().method() !== "PUT") {
      return route.fallback();
    }

    savedPayload = route.request().postDataJSON();
    rides = [
      {
        ...originalRide,
        ...savedPayload,
        gasPricePerGallon: savedPayload.gasPricePerGallon,
        windResistanceRating: 3.5,
      },
    ];

    return json(route, 200, {
      rideId: 101,
      newVersion: 2,
      message: "Ride updated.",
    });
  });

  await recorder.step("open history page", async () => {
    await page.goto("/rides/history");
    await expect(page.getByRole("heading", { name: "Ride History" })).toBeVisible();
    await expect(page.getByText("10.2")).toBeVisible();
  });

  await recorder.step("start editing ride", async () => {
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(page.locator("#edit-ride-miles-101")).toHaveValue("10.2");
  });

  await recorder.step("update editable fields", async () => {
    await page.locator("#edit-ride-miles-101").fill("15.5");
    await page.locator("#edit-ride-temperature-101").fill("72");
    await page.locator("#edit-ride-gas-price-101").fill("3.75");
    await page.locator("#edit-ride-note-101").fill("Excellent ride on a sunny day.");
    await page.locator("#edit-ride-direction-101").selectOption("NE");
    await page.locator("#edit-ride-difficulty-101").selectOption("3");
  });

  await recorder.step("save edit and verify refreshed table", async () => {
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(page.getByText("15.5")).toBeVisible();
    await expect(page.getByText("$3.7500")).toBeVisible();
    await expect(page.getByText("NE")).toBeVisible();
    expect(savedPayload.miles).toBe(15.5);
    expect(savedPayload.temperature).toBe(72);
    expect(savedPayload.gasPricePerGallon).toBe(3.75);
    expect(savedPayload.note).toBe("Excellent ride on a sunny day.");
    expect(savedPayload.difficulty).toBe(3);
    expect(savedPayload.primaryTravelDirection).toBe("NE");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:edit_ride_valid_all_fields");
  await recorder.save(testInfo);
});
