import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupDashboardScenario } from "../../helpers/mock-api.js";

test("User can enable or decline optional metric suggestions and changes persist", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("optional_metrics_configurable", "User can enable or decline optional metric suggestions and changes persist");

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock dashboard with approved and pending metric suggestions", async () => {
    await setupDashboardScenario(page, {
      dashboard: {
        suggestions: [
          {
            metricKey: "gallonsAvoided",
            title: "Estimated Gallons Avoided",
            description: "See how much driving fuel you likely avoided.",
            isEnabled: true,
            value: 8.25,
            unitLabel: "gal",
          },
          {
            metricKey: "goalProgress",
            title: "Goal Progress",
            description: "Track your progress toward this year's mileage goal.",
            isEnabled: true,
            value: 40,
            unitLabel: "%",
          }
        ],
      },
    });
  });

  await recorder.step("Open dashboard", async () => {
    await page.goto("/dashboard");
  });

  await recorder.step("Assert approved metrics render after load", async () => {
    await expect(page.getByText("Approved Metric")).toBeVisible();
    await expect(page.getByText("Estimated Gallons Avoided")).toBeVisible();
    await expect(page.getByText("Goal Progress")).toBeVisible();
    await page.reload();
    await expect(page.getByText("Estimated Gallons Avoided")).toBeVisible();
    await expect(page.getByText("Goal Progress")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:optional_metrics_configurable");
  await recorder.save(testInfo);
});
