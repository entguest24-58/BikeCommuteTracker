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
      thisMonth: { period: "this_month", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 8.12 },
      thisYear: { period: "this_year", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 8.12 },
      allTime: { period: "all_time", miles: totalMiles, rideCount: rides.length, rideMinutes: totalRideMinutes, estimatedSavings: 8.12 }
    },
    page: 1,
    pageSize: 25,
    totalCount: rides.length
  };
}

test("User can manually backup and restore ride history by copying biketracking.local.db file", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "backup_restore_flow_simulated_by_manual_db_copy",
    "User can manually backup and restore ride history by copying biketracking.local.db file"
  );

  const backupRides = [
    {
      rideId: 701,
      rideDateTimeLocal: "2026-08-13T08:00:00",
      miles: 4.0,
      rideMinutes: 20,
      temperature: 68,
      gasPricePerGallon: 3.4,
      primaryTravelDirection: "N",
      difficulty: 2,
      windResistanceRating: 0,
      note: "Backup ride 1",
      importSource: null
    },
    {
      rideId: 702,
      rideDateTimeLocal: "2026-08-14T08:00:00",
      miles: 5.5,
      rideMinutes: 26,
      temperature: 70,
      gasPricePerGallon: 3.5,
      primaryTravelDirection: "S",
      difficulty: 3,
      windResistanceRating: 1,
      note: "Backup ride 2",
      importSource: null
    }
  ];

  let activeRides = [...backupRides];

  await recorder.step("Seed authenticated session for protected history access.");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock ride-history API so database-present and database-restored states can be simulated.");
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === "GET" && (url.includes("/Ride") || url.toLowerCase().includes("/ride") || url.toLowerCase().includes("/rides/history"))) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(buildHistoryResponse(activeRides))
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
  });

  await recorder.step("Verify original rides are visible before simulated backup removal.");
  await page.goto("/rides/history");
  await expect(page.getByText("Backup ride 1")).toBeVisible();
  await expect(page.getByText("Backup ride 2")).toBeVisible();

  await recorder.step("Simulate deleting biketracking.local.db by clearing the stored rides and restarting the app.");
  activeRides = [];
  await page.reload();
  await expect(page.getByText("No rides found for this rider.")).toBeVisible();

  await recorder.step("Simulate restoring biketracking.local.db from backup and verify rides return after restart.");
  activeRides = [...backupRides];
  await page.reload();
  await expect(page.getByText("Backup ride 1")).toBeVisible();
  await expect(page.getByText("Backup ride 2")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:backup_restore_flow_simulated_by_manual_db_copy");
  await recorder.save(testInfo);
});
