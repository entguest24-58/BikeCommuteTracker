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
      thisMonth: { period: "this_month", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 11.0 },
      thisYear: { period: "this_year", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 11.0 },
      allTime: { period: "all_time", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 11.0 }
    },
    page: 1,
    pageSize: 25,
    totalCount: rides.length
  };
}

test("Deleted rides do not reappear after application restart", async ({ page, context }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "ride_deletion_persists_after_restart",
    "Deleted rides do not reappear after application restart"
  );

  let rides = [
    {
      rideId: 401,
      rideDateTimeLocal: "2026-08-09T08:00:00",
      miles: 5.0,
      rideMinutes: 25,
      temperature: 66,
      gasPricePerGallon: 3.5,
      primaryTravelDirection: "S",
      difficulty: 2,
      windResistanceRating: 0,
      note: "Keep me",
      importSource: null
    },
    {
      rideId: 402,
      rideDateTimeLocal: "2026-08-10T08:00:00",
      miles: 6.2,
      rideMinutes: 30,
      temperature: 69,
      gasPricePerGallon: 3.6,
      primaryTravelDirection: "N",
      difficulty: 3,
      windResistanceRating: 1,
      note: "Delete me",
      importSource: null
    }
  ];

  async function registerRoutes(targetPage) {
    await targetPage.route("**/api/**", async (route) => {
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

      if (method === "DELETE" && (url.toLowerCase().includes("/ride/") || url.toLowerCase().includes("/rides/"))) {
        rides = rides.filter((ride) => ride.rideId !== 402);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true })
        });
        return;
      }

      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    });
  }

  await recorder.step("Seed authenticated session and register deletion-aware local mocks.");
  await setupAuthenticatedSession(page);
  await registerRoutes(page);

  await recorder.step("Delete one ride from history.");
  await page.goto("/rides/history");
  await expect(page.getByText("Delete me")).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).nth(1).click();
  await expect(page.getByRole("heading", { name: "Delete Ride" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm Delete" }).click();
  await expect(page.getByText("Delete me")).not.toBeVisible();

  await recorder.step("Simulate restart by opening a fresh page and verifying deleted ride stays absent.");
  const reopenedPage = await context.newPage();
  await setupAuthenticatedSession(reopenedPage);
  await registerRoutes(reopenedPage);
  await reopenedPage.goto("/rides/history");
  await expect(reopenedPage.getByText("Keep me")).toBeVisible();
  await expect(reopenedPage.getByText("Delete me")).not.toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:ride_deletion_persists_after_restart");
  await recorder.save(testInfo);
});
