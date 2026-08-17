import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  mockDashboardResponse,
} from "../../helpers/mock-api.js";
import { dashboardCoreMetricsResponse } from "../../mock/mock-data.js";

test("dashboard_core_metrics_rendered_with_data", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "dashboard_core_metrics_rendered_with_data",
    testTitle: "Core metrics display correctly with recorded rides",
  });

  await recorder.step("Seed authenticated session and dashboard response");
  await setupAuthenticatedSession(page);
  await mockDashboardResponse(page, dashboardCoreMetricsResponse);

  await recorder.step("Open dashboard");
  await page.goto("/dashboard");

  await recorder.step("Verify dashboard heading and primary metric content");
  await expect(
    page.getByRole("heading", { name: "Your riding story, one screen." })
  ).toBeVisible();
  await expect(page.getByText("Current Month")).toBeVisible();
  await expect(page.getByText("Year to Date")).toBeVisible();
  await expect(page.getByText("All Time")).toBeVisible();
  await expect(page.getByText("Money Saved")).toBeVisible();

  await expect(page.getByText("42.0 mi")).toBeVisible();
  await expect(page.getByText("120.0 mi")).toBeVisible();
  await expect(page.getByText("355.0 mi")).toBeVisible();
  await expect(page.getByText("3 rides")).toBeVisible();

  await recorder.step("Verify averages render from populated ride data");
  await expect(page.getByText("Average temperature")).toBeVisible();
  await expect(page.getByText("68.7°F")).toBeVisible();
  await expect(page.getByText("Average miles per ride")).toBeVisible();
  await expect(page.getByText("14.2 mi")).toBeVisible();
  await expect(page.getByText("Average ride duration")).toBeVisible();
  await expect(page.getByText("37.5 min")).toBeVisible();

  await recorder.step("Verify charts loaded and loading copy is gone");
  await expect(page.getByRole("heading", { name: "Miles by Month" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Savings by Month" })).toBeVisible();
  await expect(page.getByText("Loading charts…")).toHaveCount(0);
  await expect(page.getByText("Refreshing dashboard…")).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_core_metrics_rendered_with_data");
  await recorder.save(testInfo);
});
