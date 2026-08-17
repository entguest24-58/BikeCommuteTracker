import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupAdvancedDashboardScenario } from "../../helpers/mock-api.js";

test("Difficulty and wind sections show descriptive message when no difficulty or wind data exists", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("dashboard_empty_state_no_difficulty_or_wind_data", "Difficulty and wind sections show descriptive message when no difficulty or wind data exists");

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock advanced dashboard empty difficulty section", async () => {
    await setupAdvancedDashboardScenario(page, {
      advanced: {
        difficultySection: {
          overallAverageDifficulty: null,
          difficultyByMonth: [],
          mostDifficultMonths: [],
          windResistanceDistribution: [],
          isEmpty: true,
        },
      },
    });
  });

  await recorder.step("Open advanced dashboard", async () => {
    await page.goto("/dashboard/advanced");
  });

  await recorder.step("Assert descriptive empty-state message", async () => {
    await expect(page.getByText("Record rides with travel direction to see difficulty trends.")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_empty_state_no_difficulty_or_wind_data");
  await recorder.save(testInfo);
});
