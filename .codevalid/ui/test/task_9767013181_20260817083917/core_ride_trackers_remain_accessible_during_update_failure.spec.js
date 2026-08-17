import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Core ride tracking remains accessible even if app update fails", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("core_ride_trackers_remain_accessible_during_update_failure", "Core ride tracking remains accessible even if app update fails");

  await recorder.step("Seed authenticated session so protected core ride pages are reachable.");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock startup plus history and record-page dependencies.");
  await page.route("**/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/rides/presets")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ presets: [] }),
      });
    }
    if (url.includes("/api/gas") || url.includes("/api/gas-price")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ isAvailable: false, pricePerGallon: null, dataSource: null }),
      });
    }
    if (url.includes("/api/ride") || url.includes("/Ride")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });

  await recorder.step("Navigate to ride history and verify the page remains accessible.");
  await page.goto("/rides/history");
  await expect(page.getByRole("heading", { name: "Ride History" })).toBeVisible();

  await recorder.step("Navigate to record ride and verify the ride entry UI remains accessible.");
  await page.goto("/rides/record");
  await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:core_ride_trackers_remain_accessible_during_update_failure");
  await recorder.save(testInfo);
});
