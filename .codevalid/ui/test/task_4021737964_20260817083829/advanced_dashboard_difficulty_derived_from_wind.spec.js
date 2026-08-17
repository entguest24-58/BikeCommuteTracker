import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupAdvancedDashboardScenario,
} from "../../helpers/mock-api.js";
import { advancedDashboardDifficultyDerivedScenario } from "../../mock/mock-data.js";

test("Difficulty is derived from WindResistanceRating when no stored difficulty exists, using 1–5 mapping", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_difficulty_derived_from_wind", "Difficulty is derived from WindResistanceRating when no stored difficulty exists, using 1–5 mapping");

  await recorder.step("Seed authenticated session");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock advanced dashboard response with overall derived difficulty average");
  await setupAdvancedDashboardScenario(page, {
    advanced: advancedDashboardDifficultyDerivedScenario,
  });

  await recorder.step("Navigate to advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Verify overall average difficulty includes rides derived from wind resistance rating");
  await expect(page.getByRole("heading", { name: "Ride Difficulty" })).toBeVisible();
  await expect(page.getByText("3.2")).toBeVisible();
  await expect(page.getByText(/overall average/i)).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_difficulty_derived_from_wind");
  await recorder.save(testInfo);
});
