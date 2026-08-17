import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupAdvancedDashboardScenario,
} from "../../helpers/mock-api.js";
import { advancedDashboardNegativeNetSavingsScenario } from "../../mock/mock-data.js";

test("Negative net savings values are visually highlighted in red", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_net_savings_negative_highlighted", "Negative net savings values are visually highlighted in red");

  await recorder.step("Seed authenticated session");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock advanced dashboard response with negative monthly net savings");
  await setupAdvancedDashboardScenario(page, {
    advanced: advancedDashboardNegativeNetSavingsScenario,
  });

  await recorder.step("Navigate to advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Locate the negative net savings cell");
  const negativeCell = page.locator(".savings-windows-negative").filter({ hasText: "-$35.00" });
  await expect(negativeCell).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_net_savings_negative_highlighted");
  await recorder.save(testInfo);
});
