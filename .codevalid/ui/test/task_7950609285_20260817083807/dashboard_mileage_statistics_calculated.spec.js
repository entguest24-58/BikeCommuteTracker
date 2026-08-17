import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupDashboardScenario } from "../../helpers/mock-api.js";

test("Dashboard displays correct current-month, year-to-date, and all-time mileage", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("dashboard_mileage_statistics_calculated", "Dashboard displays correct current-month, year-to-date, and all-time mileage");

  await recorder.step("Seed authenticated rider session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock dashboard mileage totals", async () => {
    await setupDashboardScenario(page, {
      dashboard: {
        totals: {
          currentMonthMiles: { miles: 15, rideCount: 1, period: "thisMonth" },
          yearToDateMiles: { miles: 60, rideCount: 3, period: "thisYear" },
          allTimeMiles: { miles: 60, rideCount: 3, period: "allTime" },
        },
      },
    });
  });

  await recorder.step("Open dashboard", async () => {
    await page.goto("/dashboard");
  });

  await recorder.step("Assert mileage cards show expected values", async () => {
    await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();
    await expect(page.getByText("Current Month")).toBeVisible();
    await expect(page.getByText("15.0 mi")).toBeVisible();
    await expect(page.getByText("Year to Date")).toBeVisible();
    await expect(page.getByText("60.0 mi").first()).toBeVisible();
    await expect(page.getByText("All Time")).toBeVisible();
    await expect(page.getByText("60.0 mi").nth(1)).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_mileage_statistics_calculated");
  await recorder.save(testInfo);
});
