import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  mockAdvancedDashboardResponse,
} from "../../helpers/mock-api.js";
import { advancedDashboardDifficultyEmptyResponse } from "../../mock/mock-data.js";

test("dashboard_difficulty_empty_state_no_data", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "dashboard_difficulty_empty_state_no_data",
    testTitle: "Difficulty section shows descriptive empty state when no difficulty or wind data exists",
  });

  await recorder.step("Seed authenticated session and advanced dashboard empty-difficulty response");
  await setupAuthenticatedSession(page);
  await mockAdvancedDashboardResponse(page, advancedDashboardDifficultyEmptyResponse);

  await recorder.step("Open advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Verify descriptive difficulty empty state renders");
  await expect(
    page.getByText("Record rides with travel direction to see difficulty trends.")
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Average Difficulty by Month" })
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Wind Resistance Distribution" })
  ).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_difficulty_empty_state_no_data");
  await recorder.save(testInfo);
});
