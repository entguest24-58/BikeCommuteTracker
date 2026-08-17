import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupAdvancedDashboardScenario } from "../../helpers/mock-api.js";

test("Wind resistance distribution shows negative values visually separated from positive", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("wind_resistance_histogram_visual_separation", "Wind resistance distribution shows negative values visually separated from positive");

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock wind resistance bins from -4 to +4", async () => {
    await setupAdvancedDashboardScenario(page, {
      advanced: {
        difficultySection: {
          overallAverageDifficulty: 3,
          difficultyByMonth: [{ monthNumber: 1, monthName: "January", averageDifficulty: 3, rideCount: 6 }],
          mostDifficultMonths: [{ monthNumber: 1, monthName: "January", averageDifficulty: 3, rideCount: 6 }],
          windResistanceDistribution: [
            { rating: -4, rideCount: 0, label: "-4", isAssisted: true },
            { rating: -3, rideCount: 0, label: "-3", isAssisted: true },
            { rating: -2, rideCount: 1, label: "-2", isAssisted: true },
            { rating: -1, rideCount: 1, label: "-1", isAssisted: true },
            { rating: 0, rideCount: 1, label: "0", isAssisted: false },
            { rating: 1, rideCount: 1, label: "+1", isAssisted: false },
            { rating: 2, rideCount: 0, label: "+2", isAssisted: false },
            { rating: 3, rideCount: 1, label: "+3", isAssisted: false },
            { rating: 4, rideCount: 1, label: "+4", isAssisted: false }
          ],
          isEmpty: false,
        },
      },
    });
  });

  await recorder.step("Open advanced dashboard wind chart", async () => {
    await page.goto("/dashboard/advanced");
  });

  await recorder.step("Assert wind section and legends render", async () => {
    await expect(page.getByRole("heading", { name: "Wind Resistance Distribution" })).toBeVisible();
    await expect(page.getByText("Tailwind (assisted)")).toBeVisible();
    await expect(page.getByText("Headwind")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:wind_resistance_histogram_visual_separation");
  await recorder.save(testInfo);
});
