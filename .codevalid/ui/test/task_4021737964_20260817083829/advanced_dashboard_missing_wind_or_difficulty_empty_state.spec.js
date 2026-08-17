import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupAdvancedDashboardScenario,
} from "../../helpers/mock-api.js";
import { advancedDashboardMissingWindDifficultyScenario } from "../../mock/mock-data.js";

test("Difficulty section renders descriptive message when no difficulty or wind data exists", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_missing_wind_or_difficulty_empty_state", "Difficulty section renders descriptive message when no difficulty or wind data exists");

  await recorder.step("Seed authenticated session");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock advanced dashboard response with empty difficulty analytics state");
  await setupAdvancedDashboardScenario(page, {
    advanced: advancedDashboardMissingWindDifficultyScenario,
  });

  await recorder.step("Navigate to advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Verify descriptive empty-state message is rendered");
  await expect(page.getByText("Record rides with travel direction to see difficulty trends.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Average Difficulty by Month" })).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_missing_wind_or_difficulty_empty_state");
  await recorder.save(testInfo);
});
