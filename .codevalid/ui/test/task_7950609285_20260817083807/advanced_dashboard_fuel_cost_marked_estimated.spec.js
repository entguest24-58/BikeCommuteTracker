import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupAdvancedDashboardScenario } from "../../helpers/mock-api.js";

test("Fuel cost avoided is marked estimated when fallback gas prices are used", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_fuel_cost_marked_estimated", "Fuel cost avoided is marked estimated when fallback gas prices are used");

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock estimated fuel cost on advanced dashboard", async () => {
    await setupAdvancedDashboardScenario(page, {
      advanced: {
        savingsWindows: {
          monthly: {
            period: "monthly",
            rideCount: 6,
            totalMiles: 150,
            gallonsSaved: 10,
            fuelCostAvoided: 85,
            fuelCostEstimated: true,
            mileageRateSavings: 40,
            combinedSavings: 125,
            totalExpenses: 0,
            oilChangeSavings: null,
            netSavings: 125,
          },
        },
      },
    });
  });

  await recorder.step("Open advanced dashboard", async () => {
    await page.goto("/dashboard/advanced");
  });

  await recorder.step("Assert estimated badge appears next to fuel cost", async () => {
    await expect(page.getByRole("cell", { name: /\$85\.00/ })).toBeVisible();
    await expect(page.getByText("Est.")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_fuel_cost_marked_estimated");
  await recorder.save(testInfo);
});
