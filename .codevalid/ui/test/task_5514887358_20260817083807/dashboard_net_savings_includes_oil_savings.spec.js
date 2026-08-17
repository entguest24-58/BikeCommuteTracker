import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, mockAdvancedDashboardResponse } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

test("Advanced dashboard calculates NetSavings including oil-change savings", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "dashboard_net_savings_includes_oil_savings", testTitle: testInfo.title });

  await recorder.step("seed advanced dashboard api", async () => {
    await setupAuthenticatedSession(page, authSession);
    await mockAdvancedDashboardResponse(page, {
      savingsWindows: {
        weekly: { period: "weekly", rideCount: 2, totalMiles: 18, gallonsSaved: 0.72, fuelCostAvoided: 200, fuelCostEstimated: false, mileageRateSavings: 150, combinedSavings: 440, totalExpenses: 150, oilChangeSavings: 90, netSavings: 290 },
        monthly: { period: "monthly", rideCount: 2, totalMiles: 18, gallonsSaved: 0.72, fuelCostAvoided: 200, fuelCostEstimated: false, mileageRateSavings: 150, combinedSavings: 440, totalExpenses: 150, oilChangeSavings: 90, netSavings: 290 },
        yearly: { period: "yearly", rideCount: 2, totalMiles: 18, gallonsSaved: 0.72, fuelCostAvoided: 200, fuelCostEstimated: false, mileageRateSavings: 150, combinedSavings: 440, totalExpenses: 150, oilChangeSavings: 90, netSavings: 290 },
        allTime: { period: "allTime", rideCount: 2, totalMiles: 18, gallonsSaved: 0.72, fuelCostAvoided: 200, fuelCostEstimated: false, mileageRateSavings: 150, combinedSavings: 440, totalExpenses: 150, oilChangeSavings: 90, netSavings: 290 },
      },
      suggestions: [],
      reminders: { mpgReminderRequired: false, mileageRateReminderRequired: false },
      generatedAtUtc: "2026-08-17T08:00:00.000Z",
      difficultySection: { overallAverageDifficulty: null, difficultyByMonth: [], mostDifficultMonths: [], windResistanceDistribution: [], isEmpty: true },
    });
  });

  await recorder.step("open advanced dashboard", async () => {
    await page.goto("/dashboard/advanced");
  });

  await recorder.step("verify advanced dashboard loads and shows expected net savings value", async () => {
    await expect(page.getByRole("heading", { name: "Deep-dive into your savings." })).toBeVisible();
    await expect(page.getByText(/290/)).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_net_savings_includes_oil_savings");
  await recorder.save(testInfo);
});
