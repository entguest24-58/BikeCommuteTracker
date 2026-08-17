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

test("edit_ride_gas_price_fallback_to_last_ride", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "edit_ride_gas_price_fallback_to_last_ride", testTitle: testInfo.title });
  const ride = { rideId: 101, rideDateTimeLocal: "2024-06-16T07:30:00", miles: 10.2, rideMinutes: 30, gasPricePerGallon: null };

  await seedFrontendSession(page);
  await page.route("**/api/rides/history**", async (route) => json(route, 200, buildHistoryResponse([ride])));
  await page.route("**/api/rides/gas-price**", async (route) =>
    json(route, 200, { date: "2024-06-16", pricePerGallon: 3.87, isAvailable: true, dataSource: "Recent ride" })
  );

  await recorder.step("open edit form", async () => {
    await page.goto("/rides/history");
    await page.getByRole("button", { name: "Edit" }).click();
  });

  await recorder.step("verify fallback gas price", async () => {
    await expect(page.locator("#edit-ride-gas-price-101")).toHaveValue("3.87");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:edit_ride_gas_price_fallback_to_last_ride");
  await recorder.save(testInfo);
});
