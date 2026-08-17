import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupAdvancedDashboardScenario } from "../../helpers/mock-api.js";

test("Advanced Dashboard loads correctly at /dashboard/advanced", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_accessible_and_loads", "Advanced Dashboard loads correctly at /dashboard/advanced");

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock advanced dashboard data", async () => {
    await setupAdvancedDashboardScenario(page);
  });

  await recorder.step("Navigate directly to advanced dashboard", async () => {
    await page.goto("/dashboard/advanced");
  });

  await recorder.step("Assert advanced dashboard sections are visible", async () => {
    await expect(page).toHaveURL(/\/dashboard\/advanced$/);
    await expect(page.getByRole("heading", { name: "Deep-dive into your savings." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Savings Breakdown" })).toBeVisible();
    await expect(page.getByText("This Week")).toBeVisible();
    await expect(page.getByText("All Time")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_accessible_and_loads");
  await recorder.save(testInfo);
});
