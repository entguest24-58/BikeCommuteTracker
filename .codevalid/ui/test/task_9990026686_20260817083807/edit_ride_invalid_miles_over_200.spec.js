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

test("edit_ride_invalid_miles_over_200", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "edit_ride_invalid_miles_over_200", testTitle: testInfo.title });
  const ride = { rideId: 101, rideDateTimeLocal: "2024-06-15T07:30:00", miles: 10.2, rideMinutes: 30, note: "Good ride" };
  let putCalled = false;

  await seedFrontendSession(page);
  await page.route("**/api/rides/history**", async (route) => json(route, 200, buildHistoryResponse([ride])));
  await page.route("**/api/rides/gas-price**", async (route) => json(route, 200, { date: "2024-06-15", pricePerGallon: null, isAvailable: false, dataSource: null }));
  await page.route("**/api/rides/101", async (route) => {
    putCalled = true;
    return json(route, 200, { rideId: 101, newVersion: 2, message: "Ride updated." });
  });

  await recorder.step("open edit form", async () => {
    await page.goto("/rides/history");
    await page.getByRole("button", { name: "Edit" }).click();
  });

  await recorder.step("save miles above 200", async () => {
    await page.locator("#edit-ride-miles-101").fill("250");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("alert")).toContainText("Miles must be less than or equal to 200");
    await expect(page.locator("#edit-ride-miles-101")).toHaveValue("250");
    await expect(page.locator("#edit-ride-note-101")).toHaveValue("Good ride");
    expect(putCalled).toBe(false);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:edit_ride_invalid_miles_over_200");
  await recorder.save(testInfo);
});
