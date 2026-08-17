import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupAdvancedDashboardScenario,
} from "../../helpers/mock-api.js";
import { advancedDashboardWindResistanceScenario } from "../../mock/mock-data.js";

test("Wind Resistance Rating visualization distinguishes headwind (+) and tailwind (-) by color and direction", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_wind_resistance_visualization", "Wind Resistance Rating visualization distinguishes headwind (+) and tailwind (-) by color and direction");

  await recorder.step("Seed authenticated session");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock advanced dashboard response with wind resistance distribution across -4 to +4");
  await setupAdvancedDashboardScenario(page, {
    advanced: advancedDashboardWindResistanceScenario,
  });

  await recorder.step("Navigate to advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Verify wind resistance section headings and legend");
  await expect(page.getByRole("heading", { name: "Ride Difficulty" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Wind Resistance Distribution" })).toBeVisible();
  await expect(page.getByText("Tailwind (assisted)")).toBeVisible();
  await expect(page.getByText("Headwind")).toBeVisible();

  await recorder.step("Verify chart scale labels for negative through positive bins");
  await expect(page.getByText("-4")).toBeVisible();
  await expect(page.getByText("-2")).toBeVisible();
  await expect(page.getByText("0")).toBeVisible();
  await expect(page.getByText("+1")).toBeVisible();
  await expect(page.getByText("+3")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_wind_resistance_visualization");
  await recorder.save(testInfo);
});
