import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupAdvancedDashboardScenario,
} from "../../helpers/mock-api.js";
import { advancedDashboardSplitSavingsScenario } from "../../mock/mock-data.js";

test("Split savings metrics (mileage-rate and gallons-based) are displayed as separate values", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_split_savings_displayed", "Split savings metrics (mileage-rate and gallons-based) are displayed as separate values");

  await recorder.step("Seed authenticated session");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock advanced dashboard response with separate mileage-rate and fuel-cost values");
  await setupAdvancedDashboardScenario(page, {
    advanced: advancedDashboardSplitSavingsScenario,
  });

  await recorder.step("Navigate to advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Verify savings table headings for separated metrics");
  await expect(page.getByRole("columnheader", { name: "Fuel Cost Avoided" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Mileage Rate" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Net Savings" })).toBeVisible();
  await expect(page.getByText("Total Savings")).toHaveCount(0);

  await recorder.step("Verify formatted monthly split values are rendered independently");
  await expect(page.getByText("$18.75")).toBeVisible();
  await expect(page.getByText("$42.50")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_split_savings_displayed");
  await recorder.save(testInfo);
});
