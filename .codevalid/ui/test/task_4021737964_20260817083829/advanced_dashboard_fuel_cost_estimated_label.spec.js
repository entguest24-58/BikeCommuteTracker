import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupAdvancedDashboardScenario,
} from "../../helpers/mock-api.js";
import { advancedDashboardEstimatedFuelScenario } from "../../mock/mock-data.js";

test("Fuel cost avoided is labeled 'Estimated' when fallback gas price is used", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_fuel_cost_estimated_label", "Fuel cost avoided is labeled 'Estimated' when fallback gas price is used");

  await recorder.step("Seed authenticated session");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock advanced dashboard response with estimated fuel cost");
  await setupAdvancedDashboardScenario(page, {
    advanced: advancedDashboardEstimatedFuelScenario,
  });

  await recorder.step("Navigate to advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Verify estimated fuel cost value and badge are visible");
  await expect(page.getByText("$22.50")).toBeVisible();
  await expect(page.getByText("Est.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_fuel_cost_estimated_label");
  await recorder.save(testInfo);
});
