import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  mockDashboardResponse,
} from "../../helpers/mock-api.js";
import { dashboardOptionalMetricsHiddenResponse } from "../../mock/mock-data.js";

test("dashboard_optional_metrics_hidden_by_default", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "dashboard_optional_metrics_hidden_by_default",
    testTitle: "Optional metrics are hidden until enabled",
  });

  await recorder.step("Seed authenticated session and dashboard response with disabled suggestions");
  await setupAuthenticatedSession(page);
  await mockDashboardResponse(page, dashboardOptionalMetricsHiddenResponse);

  await recorder.step("Open dashboard");
  await page.goto("/dashboard");

  await recorder.step("Verify optional approved metric section is absent when all suggestions are disabled");
  await expect(page.getByText("Approved Metric")).toHaveCount(0);
  await expect(page.getByText("Estimated Gallons Avoided")).toHaveCount(0);
  await expect(page.getByText("Goal Progress")).toHaveCount(0);
  await expect(page.getByText("Expense Summary")).toHaveCount(0);

  await recorder.step("Verify baseline metrics still render");
  await expect(
    page.getByRole("heading", { name: "Your riding story, one screen." })
  ).toBeVisible();
  await expect(page.getByText("Current Month")).toBeVisible();
  await expect(page.getByText("Money Saved")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_optional_metrics_hidden_by_default");
  await recorder.save(testInfo);
});
