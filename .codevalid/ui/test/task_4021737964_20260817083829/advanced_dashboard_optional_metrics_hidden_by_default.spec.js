import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupAdvancedDashboardScenario,
} from "../../helpers/mock-api.js";
import { advancedDashboardOptionalMetricsHiddenScenario } from "../../mock/mock-data.js";

test("Estimated gallons avoided and expense-summary are hidden until enabled by user", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_optional_metrics_hidden_by_default", "Estimated gallons avoided and expense-summary are hidden until enabled by user");

  await recorder.step("Seed authenticated session");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock advanced dashboard response with optional suggestions still pending");
  await setupAdvancedDashboardScenario(page, {
    advanced: advancedDashboardOptionalMetricsHiddenScenario,
  });

  await recorder.step("Navigate to advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Verify suggestions panel is visible");
  await expect(page.getByRole("heading", { name: "Suggestions" })).toBeVisible();

  await recorder.step("Verify optional metrics are not visible before enablement");
  await expect(page.getByText("Estimated Gallons Avoided")).toHaveCount(0);
  await expect(page.getByText("Expense Summary")).toHaveCount(0);
  await expect(page.getByText("Enable expense summary")).toBeVisible();
  await expect(page.getByText("Enable estimated gallons")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_optional_metrics_hidden_by_default");
  await recorder.save(testInfo);
});
