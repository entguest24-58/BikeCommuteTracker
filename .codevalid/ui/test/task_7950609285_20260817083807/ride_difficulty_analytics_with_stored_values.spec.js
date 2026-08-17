import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupAdvancedDashboardScenario } from "../../helpers/mock-api.js";

test("Ride difficulty analytics use stored Difficulty values when available", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("ride_difficulty_analytics_with_stored_values", "Ride difficulty analytics use stored Difficulty values when available");

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock advanced dashboard difficulty analytics", async () => {
    await setupAdvancedDashboardScenario(page, {
      advanced: {
        difficultySection: {
          overallAverageDifficulty: 3.5,
          difficultyByMonth: [
            { monthNumber: 1, monthName: "January", averageDifficulty: 4, rideCount: 1 },
            { monthNumber: 2, monthName: "February", averageDifficulty: 3, rideCount: 1 }
          ],
          mostDifficultMonths: [
            { monthNumber: 1, monthName: "January", averageDifficulty: 4, rideCount: 1 },
            { monthNumber: 2, monthName: "February", averageDifficulty: 3, rideCount: 1 }
          ],
          windResistanceDistribution: [
            { rating: -4, rideCount: 0, label: "-4", isAssisted: true },
            { rating: -3, rideCount: 0, label: "-3", isAssisted: true },
            { rating: -2, rideCount: 0, label: "-2", isAssisted: true },
            { rating: -1, rideCount: 0, label: "-1", isAssisted: true },
            { rating: 0, rideCount: 0, label: "0", isAssisted: false },
            { rating: 1, rideCount: 0, label: "+1", isAssisted: false },
            { rating: 2, rideCount: 0, label: "+2", isAssisted: false },
            { rating: 3, rideCount: 1, label: "+3", isAssisted: false },
            { rating: 4, rideCount: 0, label: "+4", isAssisted: false }
          ],
          isEmpty: false,
        },
      },
    });
  });

  await recorder.step("Open advanced dashboard difficulty section", async () => {
    await page.goto("/dashboard/advanced");
  });

  await recorder.step("Assert overall difficulty and month rankings", async () => {
    await expect(page.getByRole("heading", { name: "Ride Difficulty" })).toBeVisible();
    await expect(page.getByText("3.5")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Most Difficult Months" })).toBeVisible();
    await expect(page.getByText("January")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:ride_difficulty_analytics_with_stored_values");
  await recorder.save(testInfo);
});
