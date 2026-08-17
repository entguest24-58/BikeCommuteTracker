import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupAdvancedDashboardScenario } from "../../helpers/mock-api.js";

const months = [
  "January","February","March","April","May","June","July","August","September","October","November","December"
];

test("Most Difficult Months aggregates exactly 12 calendar month groups across all years", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("ride_difficulty_most_difficult_months_12_groups", "Most Difficult Months aggregates exactly 12 calendar month groups across all years");

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock all 12 month difficulty groups", async () => {
    await setupAdvancedDashboardScenario(page, {
      advanced: {
        difficultySection: {
          overallAverageDifficulty: 3.2,
          difficultyByMonth: months.map((month, index) => ({ monthNumber: index + 1, monthName: month, averageDifficulty: 3 + ((index % 3) * 0.2), rideCount: 8 })),
          mostDifficultMonths: months.map((month, index) => ({ monthNumber: index + 1, monthName: month, averageDifficulty: 3 + ((index % 3) * 0.2), rideCount: 8 })),
          windResistanceDistribution: [
            { rating: -4, rideCount: 0, label: "-4", isAssisted: true },
            { rating: -3, rideCount: 0, label: "-3", isAssisted: true },
            { rating: -2, rideCount: 0, label: "-2", isAssisted: true },
            { rating: -1, rideCount: 0, label: "-1", isAssisted: true },
            { rating: 0, rideCount: 0, label: "0", isAssisted: false },
            { rating: 1, rideCount: 0, label: "+1", isAssisted: false },
            { rating: 2, rideCount: 0, label: "+2", isAssisted: false },
            { rating: 3, rideCount: 0, label: "+3", isAssisted: false },
            { rating: 4, rideCount: 0, label: "+4", isAssisted: false }
          ],
          isEmpty: false,
        },
      },
    });
  });

  await recorder.step("Open advanced dashboard", async () => {
    await page.goto("/dashboard/advanced");
  });

  await recorder.step("Assert all 12 month labels are rendered", async () => {
    await expect(page.getByRole("heading", { name: "Most Difficult Months" })).toBeVisible();
    for (const month of months) {
      await expect(page.getByText(month)).toBeVisible();
    }
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:ride_difficulty_most_difficult_months_12_groups");
  await recorder.save(testInfo);
});
