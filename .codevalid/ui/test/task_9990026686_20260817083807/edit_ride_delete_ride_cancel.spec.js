import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

function json(route, status, body) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
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
    window.sessionStorage.setItem("bike_tracking_auth_session", JSON.stringify({
      userId: 1,
      userName: "testrider",
      lastActivityAtUtc: now,
      expiresAtUtc: new Date(Date.now() + 3600000).toISOString(),
    }));
  });
}

test("edit_ride_delete_ride_cancel", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "edit_ride_delete_ride_cancel", testTitle: testInfo.title });
  const rides = [{ rideId: 101, rideDateTimeLocal: "2024-06-15T07:30:00", miles: 10.2, rideMinutes: 30, note: "Good ride" }];
  let deleteCalled = false;

  await seedFrontendSession(page);
  await page.route("**/api/rides/history**", async (route) => json(route, 200, buildHistoryResponse(rides)));
  await page.route("**/api/rides/101", async (route) => {
    if (route.request().method() === "DELETE") {
      deleteCalled = true;
      return json(route, 200, { rideId: 101, deletedAt: "2024-06-16T00:00:00Z", message: "Ride deleted." });
    }
    return route.fallback();
  });

  await recorder.step("open delete dialog", async () => {
    await page.goto("/rides/history");
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("heading", { name: "Delete Ride" })).toBeVisible();
  });

  await recorder.step("cancel deletion", async () => {
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("10.2")).toBeVisible();
    expect(deleteCalled).toBe(false);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:edit_ride_delete_ride_cancel");
  await recorder.save(testInfo);
});
