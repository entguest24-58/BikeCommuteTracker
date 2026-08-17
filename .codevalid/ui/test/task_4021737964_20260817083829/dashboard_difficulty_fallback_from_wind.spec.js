import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  mockAdvancedDashboardResponse,
} from "../../helpers/mock-api.js";
import { advancedDashboardDifficultyWithWindResponse } from "../../mock/mock-data.js";

test("dashboard_difficulty_fallback_from_wind", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "dashboard_difficulty_fallback_from_wind",
    testTitle: "Difficulty analytics render fallback-derived month ranking and wind distribution",
  });

  await recorder.step("Seed authenticated session and advanced difficulty analytics response");
  await setupAuthenticatedSession(page);
  await mockAdvancedDashboardResponse(page, advancedDashboardDifficultyWithWindResponse);

  await recorder.step("Open advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Verify difficulty section headings and overall score");
  await expect(
    page.getByRole("heading", { name: "Ride Difficulty" })
  ).toBeVisible();
  await expect(page.getByText("2.8")).toBeVisible();
  await expect(page.getByText(/\/ 5 overall average/)).toBeVisible();

  await recorder.step("Verify month ranking and fallback-derived month labels render");
  await expect(
    page.getByRole("heading", { name: "Most Difficult Months" })
  ).toBeVisible();
  await expect(page.getByText("March")).toBeVisible();
  await expect(page.getByText("January")).toBeVisible();
  await expect(page.getByText("February")).toBeVisible();

  await recorder.step("Verify wind resistance distribution section renders assisted and headwind legend");
  await expect(
    page.getByRole("heading", { name: "Wind Resistance Distribution" })
  ).toBeVisible();
  await expect(page.getByText("Tailwind (assisted)")).toBeVisible();
  await expect(page.getByText("Headwind")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_difficulty_fallback_from_wind");
  await recorder.save(testInfo);
});
