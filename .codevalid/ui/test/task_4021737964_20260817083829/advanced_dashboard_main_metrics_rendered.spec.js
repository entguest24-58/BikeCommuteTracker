import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupAdvancedDashboardScenario,
} from "../../helpers/mock-api.js";
import { advancedDashboardMainMetricsScenario } from "../../mock/mock-data.js";

test("Main metrics display correct monthly, YTD, and all-time miles", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_main_metrics_rendered", "Main metrics display correct monthly, YTD, and all-time miles");

  await recorder.step("Seed authenticated session");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock advanced dashboard response with current-month, year-to-date, and all-time miles");
  await setupAdvancedDashboardScenario(page, {
    advanced: advancedDashboardMainMetricsScenario,
  });

  await recorder.step("Navigate to advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Verify advanced dashboard shell is visible");
  await expect(page.getByRole("heading", { name: "Deep-dive into your savings." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Savings Breakdown" })).toBeVisible();

  await recorder.step("Verify current-month miles are rendered from snapshot-backed totals");
  await expect(page.getByText("This Month")).toBeVisible();
  await expect(page.getByRole("cell", { name: "15.0 mi" })).toBeVisible();

  await recorder.step("Verify year-to-date miles are rendered from snapshot-backed totals");
  await expect(page.getByText("This Year")).toBeVisible();
  await expect(page.getByRole("cell", { name: "60.0 mi" })).toBeVisible();

  await recorder.step("Verify all-time miles are rendered from snapshot-backed totals");
  await expect(page.getByText("All Time")).toBeVisible();
  await expect(page.getByRole("cell", { name: "120.0 mi" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_main_metrics_rendered");
  await recorder.save(testInfo);
});
