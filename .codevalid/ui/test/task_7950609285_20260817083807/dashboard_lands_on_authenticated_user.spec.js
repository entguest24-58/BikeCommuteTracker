import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockLegacyLoginFlow, setupDashboardScenario } from "../../helpers/mock-api.js";

test("DashboardPage loads as primary authenticated landing page", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("dashboard_lands_on_authenticated_user", "DashboardPage loads as primary authenticated landing page");

  await recorder.step("Clear any existing auth session", async () => {
    await setupUnauthenticatedSession(page);
  });

  await recorder.step("Mock login and dashboard endpoints", async () => {
    await mockLegacyLoginFlow(page);
    await setupDashboardScenario(page, {
      dashboard: {
        totals: {
          currentMonthMiles: { miles: 12, rideCount: 1, period: "thisMonth" },
          yearToDateMiles: { miles: 42, rideCount: 3, period: "thisYear" },
          allTimeMiles: { miles: 42, rideCount: 3, period: "allTime" },
          moneySaved: {
            mileageRateSavings: 27.3,
            fuelCostAvoided: 8.75,
            qualifiedRideCount: 3,
          },
          expenseSummary: {
            totalManualExpenses: 10,
            oilChangeSavings: null,
            netExpenses: 10,
            oilChangeIntervalCount: 0,
          },
        },
      },
    });
  });

  await recorder.step("Open application root and follow login redirect", async () => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });

  await recorder.step("Submit valid login credentials", async () => {
    await page.locator("#login-name").fill("johndoe");
    await page.locator("#login-pin").fill("1234");
    await page.getByRole("button", { name: "Log in" }).click();
  });

  await recorder.step("Verify redirect to dashboard and authenticated content", async () => {
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();
    await expect(page.getByText("Mileage rate savings $27.30")).toBeVisible();
    await expect(page.getByText("Gallons-based savings $8.75")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_lands_on_authenticated_user");
  await recorder.save(testInfo);
});
