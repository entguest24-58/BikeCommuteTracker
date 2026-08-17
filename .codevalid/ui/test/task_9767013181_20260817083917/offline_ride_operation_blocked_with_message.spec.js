import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Ride operation blocked when offline with clear message and retry button", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("offline_ride_operation_blocked_with_message", "Ride operation blocked when offline with clear message and retry button");

  await recorder.step("Seed authenticated installed-app session before loading the protected ride page.");
  await setupAuthenticatedSession(page);

  await recorder.step("Force the app into an offline installed-app context before navigation.");
  await page.addInitScript(() => {
    window.localStorage.setItem("token", "mock-valid-token");
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        userId: 101,
        userName: "johndoe",
        username: "johndoe",
        lastActivityAtUtc: new Date().toISOString(),
      })
    );

    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => false,
    });
  });

  await recorder.step("Mock startup and incidental API calls so the page can render without a backend.");
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

  await recorder.step("Navigate to the ride recording route that contains installed-mode connectivity blocking UI.");
  await page.goto("/rides/record");

  await recorder.step("Verify the ride page loads and the offline blocking message is shown.");
  await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  await expect(
    page.getByText("Connectivity required: this installed app needs an internet connection for ride operations.")
  ).toBeVisible();

  await recorder.step("Verify a visible retry action is present.");
  await expect(page.getByRole("button", { name: "Retry connection" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:offline_ride_operation_blocked_with_message");
  await recorder.save(testInfo);
});
