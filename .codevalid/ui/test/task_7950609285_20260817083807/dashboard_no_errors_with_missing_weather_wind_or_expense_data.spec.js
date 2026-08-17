import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupDashboardScenario } from "../../helpers/mock-api.js";

test("Dashboard remains functional and uses empty states when weather, wind, or expense data is partially missing", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("dashboard_no_errors_with_missing_weather_wind_or_expense_data", "Dashboard remains functional and uses empty states when weather, wind, or expense data is partially missing");

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock dashboard with partial missing-data counts", async () => {
    await setupDashboardScenario(page, {
      dashboard: {
        averages: {
          averageTemperature: 68,
          averageMilesPerRide: 12.4,
          averageRideMinutes: 31.2,
        },
        missingData: {
          ridesMissingSavingsSnapshot: 0,
          ridesMissingGasPrice: 0,
          ridesMissingTemperature: 3,
          ridesMissingDuration: 2,
        },
      },
    });
  });

  await recorder.step("Open dashboard", async () => {
    await page.goto("/dashboard");
  });

  await recorder.step("Assert partial-data messaging and averages", async () => {
    await expect(page.getByRole("heading", { name: "Some metrics are still filling in" })).toBeVisible();
    await expect(page.getByText("3 rides are missing temperatures.")).toBeVisible();
    await expect(page.getByText("2 rides are missing ride durations.")).toBeVisible();
    await expect(page.getByText("68.0°F")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_no_errors_with_missing_weather_wind_or_expense_data");
  await recorder.save(testInfo);
});
