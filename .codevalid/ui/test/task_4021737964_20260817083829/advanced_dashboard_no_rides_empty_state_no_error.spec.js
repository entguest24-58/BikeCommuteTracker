import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupAdvancedDashboardScenario,
} from "../../helpers/mock-api.js";
import { advancedDashboardNoRidesScenario } from "../../mock/mock-data.js";

test("No rides? Shows 'Record rides to see analytics' instead of blank charts or errors", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_no_rides_empty_state_no_error", "No rides? Shows 'Record rides to see analytics' instead of blank charts or errors");

  await recorder.step("Seed authenticated session");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock advanced dashboard response with no rides and empty analytics");
  await setupAdvancedDashboardScenario(page, {
    advanced: advancedDashboardNoRidesScenario,
  });

  await recorder.step("Navigate to advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Verify difficulty empty state message renders cleanly");
  await expect(page.getByText("Record rides with travel direction to see difficulty trends.")).toBeVisible();

  await recorder.step("Verify dashboard shell is still stable and no alert is shown");
  await expect(page.getByRole("heading", { name: "Deep-dive into your savings." })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_no_rides_empty_state_no_error");
  await recorder.save(testInfo);
});
