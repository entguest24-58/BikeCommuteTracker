import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupAdvancedDashboardScenario,
} from "../../helpers/mock-api.js";
import { advancedDashboardDifficultyLiveFallbackScenario } from "../../mock/mock-data.js";

test("Difficulty is calculated live from raw wind data when WindResistanceRating is missing", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_difficulty_live_calculation_fallback", "Difficulty is calculated live from raw wind data when WindResistanceRating is missing");

  await recorder.step("Seed authenticated session");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock advanced dashboard response with live-calculated difficulty aggregation");
  await setupAdvancedDashboardScenario(page, {
    advanced: advancedDashboardDifficultyLiveFallbackScenario,
  });

  await recorder.step("Navigate to advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Verify overall average difficulty and ranked months render");
  await expect(page.getByRole("heading", { name: "Most Difficult Months" })).toBeVisible();
  await expect(page.getByText("3.8")).toBeVisible();
  await expect(page.getByText("January")).toBeVisible();
  await expect(page.getByText("February")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_difficulty_live_calculation_fallback");
  await recorder.save(testInfo);
});
