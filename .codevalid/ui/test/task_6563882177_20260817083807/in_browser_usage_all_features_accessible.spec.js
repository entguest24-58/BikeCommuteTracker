import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, mockBrowserModeCoreFeaturesScenario } from "../../helpers/mock-api.js";

test("All core features are fully accessible without installation via supported browser", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "in_browser_usage_all_features_accessible",
    testTitle: "All core features are fully accessible without installation via supported browser",
  });

  await recorder.step("seed authenticated browser session and browser-mode routes", async () => {
    await setupAuthenticatedSession(page);
    await mockBrowserModeCoreFeaturesScenario(page);
  });

  await recorder.step("open dashboard in browser mode", async () => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();
  });

  await recorder.step("open record ride page", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("open settings page", async () => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Export Data" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Install App" })).toBeVisible();
  });

  await recorder.step("open ride import page", async () => {
    await page.goto("/rides/import");
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();
  });

  await recorder.step("open expense history page", async () => {
    await page.goto("/expenses/history");
    await expect(page.getByRole("heading", { name: "Expense History" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:in_browser_usage_all_features_accessible");
  await recorder.save(testInfo);
});
