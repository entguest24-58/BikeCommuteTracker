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

test("edit_ride_invalid_note_over_500_chars", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "edit_ride_invalid_note_over_500_chars", testTitle: testInfo.title });
  const ride = { rideId: 101, rideDateTimeLocal: "2024-06-15T07:30:00", miles: 10.2, rideMinutes: 30, note: "Good ride" };
  const longNote = "L".repeat(600);

  await seedFrontendSession(page);
  await page.route("**/api/rides/history**", async (route) => json(route, 200, buildHistoryResponse([ride])));
  await page.route("**/api/rides/gas-price**", async (route) => json(route, 200, { date: "2024-06-15", pricePerGallon: null, isAvailable: false, dataSource: null }));

  await recorder.step("open edit form", async () => {
    await page.goto("/rides/history");
    await page.getByRole("button", { name: "Edit" }).click();
  });

  await recorder.step("attempt to paste overlong note", async () => {
    await page.locator("#edit-ride-note-101").fill(longNote);
    await expect(page.locator("#edit-ride-note-101")).toHaveValue("L".repeat(500));
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:edit_ride_invalid_note_over_500_chars");
  await recorder.save(testInfo);
});
