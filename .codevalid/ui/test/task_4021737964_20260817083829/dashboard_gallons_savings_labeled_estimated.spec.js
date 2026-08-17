import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  mockAdvancedDashboardResponse,
} from "../../helpers/mock-api.js";
import { advancedDashboardEstimatedNegativeResponse } from "../../mock/mock-data.js";

test("dashboard_gallons_savings_labeled_estimated", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "dashboard_gallons_savings_labeled_estimated",
    testTitle: "Fuel-cost savings are labeled estimated on advanced dashboard savings table",
  });

  await recorder.step("Seed authenticated session and advanced dashboard response with estimated fuel cost");
  await setupAuthenticatedSession(page);
  await mockAdvancedDashboardResponse(page, advancedDashboardEstimatedNegativeResponse);

  await recorder.step("Open advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Verify advanced dashboard heading and savings breakdown");
  await expect(
    page.getByRole("heading", { name: "Deep-dive into your savings." })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Savings Breakdown" })
  ).toBeVisible();

  await recorder.step("Verify estimated badge appears for fallback gas price rows");
  await expect(page.getByText("Est.")).toBeVisible();
  await expect(page.getByText("$75.80")).toBeVisible();

  await recorder.step("Verify negative net savings context is rendered in red-styled cell");
  const negativeNetCell = page.locator(".savings-windows-negative").first();
  await expect(negativeNetCell).toBeVisible();
  await expect(negativeNetCell).toContainText("-$50.00");

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_gallons_savings_labeled_estimated");
  await recorder.save(testInfo);
});
