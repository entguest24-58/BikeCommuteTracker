import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupAdvancedDashboardScenario,
} from "../../helpers/mock-api.js";
import { advancedDashboardOilChangeUnavailableScenario } from "../../mock/mock-data.js";

test("Oil-change savings are indicated as unavailable when OilChangePrice is missing or miles insufficient", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_oil_change_savings_unavailable", "Oil-change savings are indicated as unavailable when OilChangePrice is missing or miles insufficient");

  await recorder.step("Seed authenticated session");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock advanced dashboard response with unavailable oil-change savings");
  await setupAdvancedDashboardScenario(page, {
    advanced: advancedDashboardOilChangeUnavailableScenario,
  });

  await recorder.step("Navigate to advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Verify oil change savings column exists");
  await expect(page.getByRole("columnheader", { name: "Oil Change Savings" })).toBeVisible();

  await recorder.step("Verify unavailable state is shown instead of currency value");
  await expect(page.getByText("Unavailable")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_oil_change_savings_unavailable");
  await recorder.save(testInfo);
});
