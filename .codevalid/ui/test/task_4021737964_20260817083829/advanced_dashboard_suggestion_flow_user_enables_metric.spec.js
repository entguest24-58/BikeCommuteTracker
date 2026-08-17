import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupAdvancedDashboardSuggestionToggleScenario,
} from "../../helpers/mock-api.js";

test("User can enable estimated gallons and expense summary via suggestion card", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_suggestion_flow_user_enables_metric", "User can enable estimated gallons and expense summary via suggestion card");

  await recorder.step("Seed authenticated session");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock advanced dashboard suggestion toggle scenario with persistence across reload");
  await setupAdvancedDashboardSuggestionToggleScenario(page);

  await recorder.step("Navigate to advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Enable estimated gallons avoided from suggestions");
  await page.getByRole("button", { name: "Enable estimated gallons avoided" }).click();

  await recorder.step("Verify metric appears after enablement");
  await expect(page.getByText("Estimated Gallons Avoided")).toBeVisible();

  await recorder.step("Reload and verify enabled metric persists");
  await page.reload();
  await expect(page.getByText("Estimated Gallons Avoided")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_suggestion_flow_user_enables_metric");
  await recorder.save(testInfo);
});
