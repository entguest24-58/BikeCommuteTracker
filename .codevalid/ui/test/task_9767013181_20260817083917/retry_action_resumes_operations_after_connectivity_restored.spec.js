import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Retry button resumes ride operations after network is restored", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("retry_action_resumes_operations_after_connectivity_restored", "Retry button resumes ride operations after network is restored");

  await recorder.step("Seed authenticated session for a protected ride operation.");
  await setupAuthenticatedSession(page);

  await recorder.step("Install a mutable online-state shim so the app can move from offline to online.");
  await page.addInitScript(() => {
    window.__codevalidOnline = false;

    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => window.__codevalidOnline,
    });
  });

  await recorder.step("Mock startup and ride-page dependencies.");
  await page.route("**/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/rides/presets")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ presets: [] }),
      });
    }
    if (url.includes("/api/gas") || url.includes("/api/gas-price")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ isAvailable: false, pricePerGallon: null, dataSource: null }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });

  await recorder.step("Open the record ride page while offline and confirm the blocking state.");
  await page.goto("/rides/record");
  await expect(
    page.getByText("Connectivity required: this installed app needs an internet connection for ride operations.")
  ).toBeVisible();

  await recorder.step("Restore connectivity in the browser context.");
  await page.evaluate(() => {
    window.__codevalidOnline = true;
    window.dispatchEvent(new Event("online"));
  });

  await recorder.step("Use the retry action to recheck connectivity.");
  await page.getByRole("button", { name: "Retry connection" }).click();

  await recorder.step("Verify the app acknowledges restored connectivity without forcing re-entry or navigation loss.");
  await expect(page.getByText("Connection restored. Retry your action.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:retry_action_resumes_operations_after_connectivity_restored");
  await recorder.save(testInfo);
});
