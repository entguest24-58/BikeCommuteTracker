import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  mockDashboardResponse,
} from "../../helpers/mock-api.js";
import { dashboardSplitSavingsResponse } from "../../mock/mock-data.js";

test("dashboard_split_savings_displayed_separately", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "dashboard_split_savings_displayed_separately",
    testTitle: "Mileage-rate and gallons-based savings are displayed as two distinct metrics",
  });

  await recorder.step("Seed authenticated session and split-savings dashboard response");
  await setupAuthenticatedSession(page);
  await mockDashboardResponse(page, dashboardSplitSavingsResponse);

  await recorder.step("Open dashboard");
  await page.goto("/dashboard");

  await recorder.step("Verify split savings values are rendered separately within Money Saved card");
  await expect(
    page.getByText("Mileage rate savings $120.50")
  ).toBeVisible();
  await expect(
    page.getByText("Gallons-based savings $85.20")
  ).toBeVisible();
  await expect(page.getByText("Total Savings")).toHaveCount(0);

  await recorder.step("Verify money saved summary still shows currency-formatted headline");
  await expect(page.getByText("$120.50")).toBeVisible();
  await expect(page.getByText("5 qualified rides")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_split_savings_displayed_separately");
  await recorder.save(testInfo);
});
