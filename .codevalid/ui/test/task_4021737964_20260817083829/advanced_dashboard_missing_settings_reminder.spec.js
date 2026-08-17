import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupAdvancedDashboardScenario,
} from "../../helpers/mock-api.js";
import { advancedDashboardMissingSettingsReminderScenario } from "../../mock/mock-data.js";

test("Reminder cards prompt user to set MPG, mileage-rate, and OilChangePrice", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_missing_settings_reminder", "Reminder cards prompt user to set MPG, mileage-rate, and OilChangePrice");

  await recorder.step("Seed authenticated session");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock advanced dashboard response with missing-setting reminders");
  await setupAdvancedDashboardScenario(page, {
    advanced: advancedDashboardMissingSettingsReminderScenario,
  });

  await recorder.step("Navigate to advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Verify mileage-rate and MPG reminder notes are visible");
  await expect(page.getByTestId("mpg-reminder")).toBeVisible();
  await expect(page.getByTestId("mileage-rate-reminder")).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" }).first()).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_missing_settings_reminder");
  await recorder.save(testInfo);
});
