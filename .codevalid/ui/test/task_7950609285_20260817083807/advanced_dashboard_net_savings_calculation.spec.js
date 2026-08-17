import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupAdvancedDashboardScenario } from "../../helpers/mock-api.js";

test("Advanced Dashboard correctly computes NetSavings per time period", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_net_savings_calculation", "Advanced Dashboard correctly computes NetSavings per time period");

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock monthly negative net savings", async () => {
    await setupAdvancedDashboardScenario(page, {
      advanced: {
        savingsWindows: {
          monthly: {
            period: "monthly",
            rideCount: 4,
            totalMiles: 80,
            gallonsSaved: 4,
            fuelCostAvoided: 50,
            fuelCostEstimated: false,
            mileageRateSavings: 40,
            combinedSavings: 90,
            totalExpenses: 150,
            oilChangeSavings: 30,
            netSavings: -30,
          },
        },
      },
    });
  });

  await recorder.step("Open advanced dashboard", async () => {
    await page.goto("/dashboard/advanced");
  });

  await recorder.step("Verify month row net savings value", async () => {
    await expect(page.getByText("This Month")).toBeVisible();
    await expect(page.getByRole("cell", { name: "-$30.00" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_net_savings_calculation");
  await recorder.save(testInfo);
});
