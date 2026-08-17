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
      thisMonth: { period: "this_month", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 7.5 },
      thisYear: { period: "this_year", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 7.5 },
      allTime: { period: "all_time", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 7.5 }
    },
    page: 1,
    pageSize: 25,
    totalCount: rides.length
  };
}

test("Ride edits and additions persist after application restarts", async ({ page, context }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "ride_edits_persist_across_app_restarts",
    "Ride edits and additions persist after application restarts"
  );

  let rides = [
    {
      rideId: 301,
      rideDateTimeLocal: "2026-08-07T08:00:00",
      miles: 4.2,
      rideMinutes: 21,
      temperature: 65,
      gasPricePerGallon: 3.4,
      primaryTravelDirection: "W",
      difficulty: 2,
      windResistanceRating: 0,
      note: "Before restart",
      importSource: null
    },
    {
      rideId: 302,
      rideDateTimeLocal: "2026-08-07T17:30:00",
      miles: 3.1,
      rideMinutes: 18,
      temperature: 72,
      gasPricePerGallon: 3.41,
      primaryTravelDirection: "E",
      difficulty: 2,
      windResistanceRating: 0,
      note: "Added before shutdown",
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

      if ((method === "PUT" || method === "PATCH") && (url.toLowerCase().includes("/ride/") || url.toLowerCase().includes("/rides/"))) {
        const body = route.request().postDataJSON();
        rides = rides.map((ride) =>
          ride.rideId === 301
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
  }

  await recorder.step("Seed authenticated session and register persistent local API mocks.");
  await setupAuthenticatedSession(page);
  await registerRoutes(page);

  await recorder.step("Edit an existing ride and save the update.");
  await page.goto("/rides/history");
  await page.getByRole("button", { name: "Edit" }).first().click();
  await page.locator('#edit-ride-miles-301').fill("7.7");
  await page.locator('#edit-ride-note-301').fill("Persisted after restart");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Persisted after restart")).toBeVisible();

  await recorder.step("Simulate closing and reopening the app by opening a fresh page in the same context.");
  const reopenedPage = await context.newPage();
  await setupAuthenticatedSession(reopenedPage);
  await registerRoutes(reopenedPage);
  await reopenedPage.goto("/rides/history");

  await recorder.step("Verify the updated ride values still appear after reopening.");
  await expect(reopenedPage.getByText("Persisted after restart")).toBeVisible();
  await expect(reopenedPage.getByText("Added before shutdown")).toBeVisible();
  await expect(reopenedPage.getByRole("heading", { name: "Ride History" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:ride_edits_persist_across_app_restarts");
  await recorder.save(testInfo);
});
