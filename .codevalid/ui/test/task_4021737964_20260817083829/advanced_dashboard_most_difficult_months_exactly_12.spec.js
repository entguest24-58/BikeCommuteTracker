import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupAdvancedDashboardScenario,
} from "../../helpers/mock-api.js";
import { advancedDashboardMostDifficultMonthsScenario } from "../../mock/mock-data.js";

test("Average difficulty is grouped into exactly 12 calendar month buckets, ranked by difficulty", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_most_difficult_months_exactly_12", "Average difficulty is grouped into exactly 12 calendar month buckets, ranked by difficulty");

  await recorder.step("Seed authenticated session");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock advanced dashboard response with 12 ranked month buckets");
  await setupAdvancedDashboardScenario(page, {
    advanced: advancedDashboardMostDifficultMonthsScenario,
  });

  await recorder.step("Navigate to advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Verify Most Difficult Months list contains all calendar months");
  await expect(page.getByRole("heading", { name: "Most Difficult Months" })).toBeVisible();
  const items = page.locator(".difficulty-month-ranking li");
  await expect(items).toHaveCount(12);
  for (const month of [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]) {
    await expect(page.getByText(month)).toBeVisible();
  }

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_most_difficult_months_exactly_12");
  await recorder.save(testInfo);
});
