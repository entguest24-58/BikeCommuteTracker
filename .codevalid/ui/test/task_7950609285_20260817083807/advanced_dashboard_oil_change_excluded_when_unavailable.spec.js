import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupAdvancedDashboardScenario } from "../../helpers/mock-api.js";

test("OilChangeSavings is omitted from NetSavings when unavailable, but other metrics are shown", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_oil_change_excluded_when_unavailable", "OilChangeSavings is omitted from NetSavings when unavailable, but other metrics are shown");

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock month row with unavailable oil change savings", async () => {
    await setupAdvancedDashboardScenario(page, {
      advanced: {
        savingsWindows: {
          monthly: {
            period: "monthly",
            rideCount: 5,
            totalMiles: 100,
            gallonsSaved: 3,
            fuelCostAvoided: 60,
            fuelCostEstimated: false,
            mileageRateSavings: 50,
            combinedSavings: 110,
            totalExpenses: 70,
            oilChangeSavings: null,
            netSavings: 40,
          },
        },
      },
    });
  });

  await recorder.step("Open advanced dashboard", async () => {
    await page.goto("/dashboard/advanced");
  });

  await recorder.step("Assert other values render and oil change uses null display", async () => {
    await expect(page.getByText("This Month")).toBeVisible();
    await expect(page.getByRole("cell", { name: "$40.00" })).toBeVisible();
    await expect(page.getByText("—").first()).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_oil_change_excluded_when_unavailable");
  await recorder.save(testInfo);
});
