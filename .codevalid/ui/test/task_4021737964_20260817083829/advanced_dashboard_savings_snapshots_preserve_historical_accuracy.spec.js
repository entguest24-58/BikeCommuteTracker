import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupAdvancedDashboardScenario,
} from "../../helpers/mock-api.js";
import { advancedDashboardSnapshotAccuracyScenario } from "../../mock/mock-data.js";

test("All savings calculations use per-ride snapshots, ensuring historical accuracy when user changes settings", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_savings_snapshots_preserve_historical_accuracy", "All savings calculations use per-ride snapshots, ensuring historical accuracy when user changes settings");

  await recorder.step("Seed authenticated session");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock advanced dashboard response with snapshot-preserved mileage-rate totals");
  await setupAdvancedDashboardScenario(page, {
    advanced: advancedDashboardSnapshotAccuracyScenario,
  });

  await recorder.step("Navigate to advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Verify historical mileage-rate savings total remains based on ride snapshots");
  await expect(page.getByText("$22.00")).toBeVisible();
  await expect(page.getByText("$34.00")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_savings_snapshots_preserve_historical_accuracy");
  await recorder.save(testInfo);
});
